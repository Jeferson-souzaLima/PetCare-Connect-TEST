const AdminModel = require('../Models/adminModel');
const Indicadores = require('../Models/adminIndicadoresModel');
const pedidosModel = require('../Models/pedidosModel');
const { estornarPagamento, estornarVendaSePaga } = require('../Services/estornoService');
const PagamentosModel = require('../Models/pagamentosModel');
const { adicionarImagensAoProduto, trocarImagemDaLoja } = require('../Services/imagensCatalogoService');
const { responderErroInterno, responderErroDoServico, registrarErroInterno } = require('../utils/erroInterno');

/*
 * Painel do administrador. As rotas já exigem tipo 'admin'
 * (authorizeRoles), então aqui só validamos a entrada.
 */

function idValido(valor) {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
}

exports.listarLojas = async (req, res) => {
    const filtro = req.query.status || 'pendentes';

    if (!AdminModel.FILTROS_LOJAS.includes(filtro)) {
        return res.status(400).json({ mensagem: 'Filtro de lojas inválido.' });
    }

    try {
        const lojas = await AdminModel.listarLojas(filtro);
        return res.json(lojas.map((loja) => ({
            ...loja,
            ativo: Boolean(loja.ativo),
            email_verificado: Boolean(loja.email_verificado),
            recebe_online: Boolean(loja.recebe_online)
        })));
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.listarLojas');
    }
};

exports.definirSituacaoLoja = async (req, res) => {
    const lojaId = idValido(req.params.id);
    const { ativo } = req.body || {};

    if (!lojaId) return res.status(400).json({ mensagem: 'Loja inválida.' });
    if (typeof ativo !== 'boolean') {
        return res.status(400).json({ mensagem: 'Informe ativo como true ou false.' });
    }

    try {
        const alterou = await AdminModel.definirLojaAtiva(lojaId, ativo);
        if (!alterou) return res.status(404).json({ mensagem: 'Loja não encontrada.' });

        return res.json({ mensagem: ativo ? 'Loja aprovada e visível na plataforma.' : 'Loja suspensa e oculta da plataforma.' });
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.definirSituacaoLoja');
    }
};

exports.listarUsuarios = async (req, res) => {
    const tipo = req.query.tipo || null;
    const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';

    if (tipo && !AdminModel.TIPOS_USUARIO.includes(tipo)) {
        return res.status(400).json({ mensagem: 'Tipo de usuário inválido.' });
    }

    if (busca.length > 100) {
        return res.status(400).json({ mensagem: 'Busca muito longa.' });
    }

    try {
        const usuarios = await AdminModel.listarUsuarios({ tipo, busca });
        return res.json(usuarios.map((usuario) => ({
            ...usuario,
            email_verificado: Boolean(usuario.email_verificado)
        })));
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.listarUsuarios');
    }
};

exports.listarPedidos = async (req, res) => {
    try {
        return res.json(await AdminModel.listarPedidos());
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.listarPedidos');
    }
};

// Pedidos que já saíram da loja (em entrega ou entregues) não são cancelados aqui.
const STATUS_CANCELAVEIS_PELO_ADMIN = ['aguardando_pagamento', 'pago', 'em_preparo', 'pronto_para_retirada'];

exports.cancelarPedido = (req, res) => {
    const pedidoId = idValido(req.params.id);
    if (!pedidoId) return res.status(400).json({ mensagem: 'Pedido inválido.' });

    pedidosModel.getByIdSimples(pedidoId, (erro, pedido) => {
        if (erro) return responderErroInterno(res, erro, 'adminController.cancelarPedido');
        if (!pedido) return res.status(404).json({ mensagem: 'Pedido não encontrado.' });

        if (!STATUS_CANCELAVEIS_PELO_ADMIN.includes(pedido.status)) {
            return res.status(400).json({ mensagem: 'Este pedido já saiu para entrega, foi entregue ou já está cancelado.' });
        }

        // Estorna antes de cancelar; o cancelamento devolve o estoque.
        estornarVendaSePaga('pedido', pedidoId)
            .then((estornou) => pedidosModel.cancelarPeloAdmin(pedidoId, (cancelErr, cancelou) => {
                if (cancelErr || !cancelou) {
                    registrarErroInterno(`adminController.cancelarPedido: pedido ${pedidoId} não cancelado`, cancelErr || new Error('status mudou durante o cancelamento'));
                    return res.status(500).json({
                        mensagem: estornou
                            ? 'O pagamento foi estornado, mas não foi possível concluir o cancelamento. Verifique o pedido.'
                            : 'Não foi possível cancelar o pedido.'
                    });
                }
                return res.json({
                    mensagem: estornou ? 'Pedido cancelado e pagamento estornado.' : 'Pedido cancelado.'
                });
            }))
            .catch((erroEstorno) => responderErroDoServico(res, erroEstorno, 'adminController.cancelarPedido', 'Não foi possível cancelar o pedido.'));
    });
};

// ===============================
// INDICADORES (financeiro e rankings)
// ===============================

const PRIMEIRO_ANO = 2025;
const doisDigitos = (n) => String(n).padStart(2, '0');

/** Período de um ano inteiro ou de um mês, a partir de ?ano= e ?mes=. Retorna null se inválido. */
function periodoDaConsulta({ ano: anoInformado, mes: mesInformado }) {
    const anoAtual = new Date().getFullYear();
    const ano = anoInformado === undefined ? anoAtual : Number(anoInformado);
    if (!Number.isInteger(ano) || ano < PRIMEIRO_ANO || ano > anoAtual) return null;

    if (mesInformado === undefined) {
        return { ano, mes: null, inicio: `${ano}-01-01 00:00:00`, fimExclusivo: `${ano + 1}-01-01 00:00:00` };
    }

    const mes = Number(mesInformado);
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) return null;

    const fim = mes === 12 ? `${ano + 1}-01` : `${ano}-${doisDigitos(mes + 1)}`;
    return { ano, mes, inicio: `${ano}-${doisDigitos(mes)}-01 00:00:00`, fimExclusivo: `${fim}-01 00:00:00` };
}

const MENSAGEM_PERIODO_INVALIDO = `Informe ano entre ${PRIMEIRO_ANO} e o ano atual e, se quiser, mes entre 1 e 12.`;

const CAMPOS_FINANCEIROS = ['gmv', 'gmv_produtos', 'gmv_servicos', 'receita_comissoes', 'vendas', 'estornos', 'vendas_estornadas'];
const centavos = (valor) => Math.round(valor * 100) / 100;

function comTicketMedio(valores) {
    return { ...valores, ticket_medio: valores.vendas ? centavos(valores.gmv / valores.vendas) : 0 };
}

exports.obterFinanceiro = async (req, res) => {
    const periodo = periodoDaConsulta({ ano: req.query.ano });
    if (!periodo) return res.status(400).json({ mensagem: MENSAGEM_PERIODO_INVALIDO });

    try {
        const linhas = await Indicadores.financeiroPorMes(periodo.inicio, periodo.fimExclusivo);
        const zerado = () => Object.fromEntries(CAMPOS_FINANCEIROS.map((campo) => [campo, 0]));
        const total = zerado();

        const meses = Array.from({ length: 12 }, (_, indice) => {
            const linha = linhas.find((l) => Number(l.mes) === indice + 1);
            const valores = zerado();
            for (const campo of CAMPOS_FINANCEIROS) {
                valores[campo] = linha ? Number(linha[campo]) : 0;
                total[campo] = centavos(total[campo] + valores[campo]);
            }
            return { mes: indice + 1, ...comTicketMedio(valores) };
        });

        return res.json({ ano: periodo.ano, total: comTicketMedio(total), meses });
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.obterFinanceiro');
    }
};

const comNumeros = (linhas, campos) => linhas.map((linha) => ({
    ...linha,
    ...Object.fromEntries(campos.map((campo) => [campo, Number(linha[campo])]))
}));

exports.obterRankings = async (req, res) => {
    const periodo = periodoDaConsulta(req.query);
    if (!periodo) return res.status(400).json({ mensagem: MENSAGEM_PERIODO_INVALIDO });

    try {
        const r = await Indicadores.rankings(periodo.inicio, periodo.fimExclusivo);
        const favoritos = comNumeros(r.favoritos, ['total']);
        const favoritosDoTipo = (tipo) => favoritos
            .filter((f) => f.tipo === tipo)
            .map(({ id, nome, total }) => ({ id, nome, total }));

        return res.json({
            periodo: { ano: periodo.ano, mes: periodo.mes },
            mais_vendidos: {
                produtos: comNumeros(r.produtos, ['quantidade', 'valor']),
                servicos: comNumeros(r.servicos, ['quantidade', 'valor']),
                lojas: comNumeros(r.lojas, ['vendas', 'valor', 'comissao'])
            },
            mais_favoritados: {
                produtos: favoritosDoTipo('produto'),
                servicos: favoritosDoTipo('servico'),
                lojas: favoritosDoTipo('loja')
            },
            buscas: {
                mais_buscadas: comNumeros(r.buscas, ['total']),
                sem_resultado: comNumeros(r.buscasSemResultado, ['total'])
            }
        });
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.obterRankings');
    }
};

// ===============================
// ESTORNOS RECUSADOS PELO MERCADO PAGO
// ===============================

exports.listarEstornos = async (req, res) => {
    try {
        const estornos = await PagamentosModel.listarEstornosComFalha();
        return res.json(estornos.map((estorno) => ({
            ...estorno,
            valor: Number(estorno.valor),
            pendente: estorno.estorno_pendente_desde !== null
        })));
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.listarEstornos');
    }
};

/** Nova tentativa manual de um estorno pendente (a venda já não existe). */
exports.tentarEstorno = async (req, res) => {
    const pagamentoId = idValido(req.params.id);
    if (!pagamentoId) return res.status(400).json({ mensagem: 'Pagamento inválido.' });

    try {
        const pagamento = await PagamentosModel.getComLoja(pagamentoId);
        if (!pagamento) return res.status(404).json({ mensagem: 'Pagamento não encontrado.' });
        if (pagamento.status !== 'aprovado' || !pagamento.estorno_pendente_desde) {
            return res.status(400).json({ mensagem: 'Este pagamento não tem estorno pendente.' });
        }

        await estornarPagamento({ pagamento, obrigatorio: true });
        return res.json({ mensagem: 'Estorno feito. O valor volta ao cliente pelo Mercado Pago.' });
    } catch (erro) {
        return responderErroDoServico(res, erro, 'adminController.tentarEstorno', 'Não foi possível estornar o pagamento.');
    }
};

// ===============================
// IMAGENS DO CATÁLOGO (produtos e logo de qualquer loja)
// ===============================
exports.obterCatalogoDaLoja = async (req, res) => {
    const lojaId = idValido(req.params.id);
    if (!lojaId) return res.status(400).json({ mensagem: 'Loja inválida.' });

    try {
        const catalogo = await AdminModel.catalogoDaLoja(lojaId);
        if (!catalogo) return res.status(404).json({ mensagem: 'Loja não encontrada.' });
        return res.json(catalogo);
    } catch (erro) {
        return responderErroInterno(res, erro, 'adminController.obterCatalogoDaLoja');
    }
};

exports.enviarImagensProduto = async (req, res) => {
    const produtoId = idValido(req.params.id);
    if (!produtoId) return res.status(400).json({ mensagem: 'Produto inválido.' });

    try {
        if (!(await AdminModel.buscarProduto(produtoId))) {
            return res.status(404).json({ mensagem: 'Produto não encontrado.' });
        }
        const imagens = await adicionarImagensAoProduto(produtoId, req.files);
        return res.json({ mensagem: 'Imagens enviadas.', imagens });
    } catch (erro) {
        return responderErroDoServico(res, erro, 'adminController.enviarImagensProduto', 'Não foi possível enviar as imagens.');
    }
};

exports.enviarImagemLoja = async (req, res) => {
    const lojaId = idValido(req.params.id);
    if (!lojaId) return res.status(400).json({ mensagem: 'Loja inválida.' });

    try {
        const loja = await AdminModel.buscarLoja(lojaId);
        if (!loja) return res.status(404).json({ mensagem: 'Loja não encontrada.' });
        const imagem = await trocarImagemDaLoja({ lojaId, imagemAtual: loja.imagem, arquivo: req.file });
        return res.json({ mensagem: 'Logo da loja atualizado.', imagem });
    } catch (erro) {
        return responderErroDoServico(res, erro, 'adminController.enviarImagemLoja', 'Não foi possível enviar a imagem.');
    }
};
