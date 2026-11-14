const buscaModel = require('../Models/buscaModel');
const { responderErroInterno, registrarErroInterno } = require('../utils/erroInterno');

const TAMANHO_MAXIMO_TERMO = 100;

/*
 * Registra a busca feita na página de resultados, para o ranking do admin.
 * Roda em segundo plano: uma falha aqui nunca afeta a resposta ao cliente.
 */
function registrarBusca(texto, resultados) {
    const termo = texto.toLowerCase().replace(/\s+/g, ' ').slice(0, TAMANHO_MAXIMO_TERMO).trim();
    if (termo.length < 2) return;

    const total = resultados.produtos.length + resultados.lojas.length + resultados.servicos.length;
    buscaModel.registrarBusca(termo, total)
        .catch((erro) => registrarErroInterno('buscaController.registrarBusca', erro));
}

exports.buscar = (req, res) => {
    const { q } = req.query;

    if (!q || !q.trim()) {
        return res.status(400).json({
            mensagem: 'Informe um termo para pesquisa.'
        });
    }

    const usuario = req.usuario;

    // Lojista não utiliza a busca B2C.
    // A busca específica para lojistas será implementada futuramente.
    if (usuario?.tipo === 'lojista') {
        return res.status(200).json({
            contexto: 'lojista',
            disponivel: false,
            produtos: [],
            lojas: [],
            servicos: []
        });
    }

    buscaModel.buscar(q.trim(), (err, resultados) => {
        if (err) {
            return responderErroInterno(res, err, "buscaController.buscar");
        }

        res.status(200).json({
            contexto: 'cliente',
            disponivel: true,
            ...resultados
        });
    });
};

exports.buscarResultados = (req, res) => {
    const { q } = req.query;

    if (!q || !q.trim()) {
        return res.status(400).json({
            mensagem: 'Informe um termo para pesquisa.'
        });
    }

    const usuario = req.usuario;

    // Lojista não utiliza a busca B2C.
    // A busca específica para lojistas será implementada futuramente.
    if (usuario?.tipo === 'lojista') {
        return res.status(200).json({
            contexto: 'lojista',
            disponivel: false,
            produtos: [],
            lojas: [],
            servicos: []
        });
    }

    buscaModel.buscarResultados(q.trim(), (err, resultados) => {
        if (err) {
            return responderErroInterno(res, err, "buscaController.buscarResultados");
        }

        registrarBusca(q, resultados);

        res.status(200).json({
            contexto: 'cliente',
            disponivel: true,
            ...resultados
        });
    });
};