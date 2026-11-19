const relatoriosModel = require('../Models/relatoriosModel');
const { registrarErroInterno } = require('../utils/erroInterno');
const { calcularLiquido } = require('../Services/comissaoService');
const { agoraNoHorarioDasLojas, adicionarDias } = require('../utils/dataLocal');

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const LIMITE_DIAS_PERIODO = 366;

function dataValida(data) {
    if (typeof data !== 'string' || !FORMATO_DATA.test(data)) return false;
    const [ano, mes, dia] = data.split('-').map(Number);
    const dataUtc = new Date(Date.UTC(ano, mes - 1, dia));
    return dataUtc.getUTCFullYear() === ano
        && dataUtc.getUTCMonth() === mes - 1
        && dataUtc.getUTCDate() === dia;
}

function periodoPadrao() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return { dataInicial: `${ano}-${mes}-01`, dataFinal: `${ano}-${mes}-${dia}` };
}

exports.obterRelatorio = async (req, res) => {
    const { data_inicial: dataInicialInformada, data_final: dataFinalInformada } = req.query;

    if (!req.usuario.loja_id) {
        return res.status(400).json({ mensagem: 'Loja não identificada no token.' });
    }

    if ((dataInicialInformada && !dataFinalInformada) || (!dataInicialInformada && dataFinalInformada)) {
        return res.status(400).json({ mensagem: 'Informe data_inicial e data_final juntas.' });
    }

    const periodo = dataInicialInformada ? {
        dataInicial: dataInicialInformada,
        dataFinal: dataFinalInformada
    } : periodoPadrao();

    if (!dataValida(periodo.dataInicial) || !dataValida(periodo.dataFinal)) {
        return res.status(400).json({ mensagem: 'As datas devem seguir o formato AAAA-MM-DD e ser válidas.' });
    }

    if (periodo.dataInicial > periodo.dataFinal) {
        return res.status(400).json({ mensagem: 'data_inicial não pode ser posterior a data_final.' });
    }

    const fimExclusivo = adicionarDias(periodo.dataFinal, 1);
    const diferencaEmDias = (Date.parse(`${fimExclusivo}T00:00:00Z`) - Date.parse(`${periodo.dataInicial}T00:00:00Z`)) / 86400000;
    if (diferencaEmDias > LIMITE_DIAS_PERIODO) {
        return res.status(400).json({ mensagem: `O período máximo para consulta é de ${LIMITE_DIAS_PERIODO} dias.` });
    }

    try {
        const relatorio = await relatoriosModel.obterRelatorioDaLoja(
            req.usuario.loja_id,
            `${periodo.dataInicial} 00:00:00`,
            `${fimExclusivo} 00:00:00`
        );

        const pedidosPagos = Number(relatorio.resumo.pedidos_pagos);
        const receitaProdutos = Number(relatorio.resumo.receita_produtos);
        const { receita_total: receitaTotal, comissao_total: comissaoTotal, tarifa_total: tarifaTotal } = relatorio.resumo;

        return res.json({
            periodo: {
                data_inicial: periodo.dataInicial,
                data_final: periodo.dataFinal
            },
            resumo_financeiro: {
                receita_total: Number(relatorio.resumo.receita_total),
                receita_produtos: receitaProdutos,
                receita_servicos: Number(relatorio.resumo.receita_servicos),
                pedidos_pagos: pedidosPagos,
                agendamentos_pagos: Number(relatorio.resumo.agendamentos_pagos),
                ticket_medio_pedido: pedidosPagos ? Number((receitaProdutos / pedidosPagos).toFixed(2)) : 0,
                comissao_total: Number(comissaoTotal),
                tarifa_total: Number(tarifaTotal),
                valor_liquido: calcularLiquido(receitaTotal, comissaoTotal, tarifaTotal)
            },
            // Divisão de cada venda: total pago, tarifa do Mercado Pago, comissão e líquido da loja.
            vendas: relatorio.vendas.map((venda) => ({
                pagamento_id: venda.pagamento_id,
                tipo: venda.tipo_referencia,
                referencia_id: venda.referencia_id,
                status: venda.status,
                data: venda.data,
                valor: Number(venda.valor),
                comissao: venda.valor_comissao === null ? null : Number(venda.valor_comissao),
                tarifa_gateway: venda.tarifa_gateway === null ? null : Number(venda.tarifa_gateway),
                valor_liquido: calcularLiquido(venda.valor, venda.valor_comissao, venda.tarifa_gateway)
            })),
            vendas_por_periodo: relatorio.vendasPorPeriodo,
            produtos_mais_vendidos: relatorio.produtosMaisVendidos,
            agendamentos_servicos: relatorio.agendamentos
        });
    } catch (erro) {
        registrarErroInterno('relatoriosController: Erro ao gerar relatório do lojista', erro);
        return res.status(500).json({ mensagem: 'Não foi possível gerar o relatório.' });
    }
};

// ===============================
// PAINEL DO LOJISTA (home)
// ===============================

const DIAS_DO_PAINEL = 30;

/** Variação percentual em relação ao período anterior; null quando não há base de comparação. */
function variacao(atual, anterior) {
    if (!anterior) return null;
    return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

const indicador = (atual, anterior) => ({ atual, anterior, variacao: variacao(atual, anterior) });

exports.obterPainel = async (req, res) => {
    const lojaId = req.usuario.loja_id;
    if (!lojaId) {
        return res.status(400).json({ mensagem: 'Loja não identificada no token.' });
    }

    const { data: hoje, dataHora: agora } = agoraNoHorarioDasLojas();
    const dataInicial = adicionarDias(hoje, -(DIAS_DO_PAINEL - 1));
    const inicioAnterior = adicionarDias(dataInicial, -DIAS_DO_PAINEL);
    const fimExclusivo = adicionarDias(hoje, 1);

    try {
        const painel = await relatoriosModel.obterPainelDaLoja(lojaId, {
            inicioAnterior: `${inicioAnterior} 00:00:00`,
            inicio: `${dataInicial} 00:00:00`,
            fim: `${fimExclusivo} 00:00:00`,
            agora,
            hoje
        });

        const porDia = new Map(painel.vendasPorDia.map((linha) => [linha.data, linha]));
        const soma = (linhas, campo) => linhas.reduce((total, linha) => total + Number(linha[campo]), 0);
        const doPeriodoAnterior = painel.vendasPorDia.filter((linha) => linha.data < dataInicial);
        const doPeriodoAtual = painel.vendasPorDia.filter((linha) => linha.data >= dataInicial);
        const centavos = (valor) => Math.round(valor * 100) / 100;

        return res.json({
            periodo: { data_inicial: dataInicial, data_final: hoje },
            indicadores: {
                vendas: indicador(centavos(soma(doPeriodoAtual, 'receita')), centavos(soma(doPeriodoAnterior, 'receita'))),
                pedidos: indicador(soma(doPeriodoAtual, 'pedidos'), soma(doPeriodoAnterior, 'pedidos')),
                agendamentos: indicador(Number(painel.agendamentos.atual), Number(painel.agendamentos.anterior)),
                novos_clientes: indicador(Number(painel.novosClientes.atual), Number(painel.novosClientes.anterior))
            },
            vendas_por_dia: Array.from({ length: DIAS_DO_PAINEL }, (_, indice) => {
                const data = adicionarDias(dataInicial, indice);
                return { data, receita: Number(porDia.get(data)?.receita || 0) };
            }),
            proximos_agendamentos: painel.proximosAgendamentos,
            pendencias: {
                pedidos_a_preparar: Number(painel.pendencias.pedidos_a_preparar),
                agendamentos_hoje: Number(painel.pendencias.agendamentos_hoje)
            }
        });
    } catch (erro) {
        registrarErroInterno('relatoriosController: Erro ao montar o painel do lojista', erro);
        return res.status(500).json({ mensagem: 'Não foi possível carregar o painel.' });
    }
};
