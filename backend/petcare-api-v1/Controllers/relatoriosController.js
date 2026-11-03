const relatoriosModel = require('../Models/relatoriosModel');
const { registrarErroInterno } = require('../utils/erroInterno');

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

function adicionarDias(data, dias) {
    const resultado = new Date(`${data}T00:00:00Z`);
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado.toISOString().slice(0, 10);
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
                ticket_medio_pedido: pedidosPagos ? Number((receitaProdutos / pedidosPagos).toFixed(2)) : 0
            },
            vendas_por_periodo: relatorio.vendasPorPeriodo,
            produtos_mais_vendidos: relatorio.produtosMaisVendidos,
            agendamentos_servicos: relatorio.agendamentos
        });
    } catch (erro) {
        registrarErroInterno('relatoriosController: Erro ao gerar relatório do lojista', erro);
        return res.status(500).json({ mensagem: 'Não foi possível gerar o relatório.' });
    }
};
