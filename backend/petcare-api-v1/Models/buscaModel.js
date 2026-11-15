const db = require('../db');
const { consultar } = require('../utils/transacao');

// Só o termo e a quantidade de resultados: sem usuário nem IP.
exports.registrarBusca = (termo, totalResultados) => consultar(
    'INSERT INTO buscas_realizadas (termo, total_resultados) VALUES (?, ?)',
    [termo, totalResultados]
);

// ===============================
// BUSCA GLOBAL
// ===============================
exports.buscar = (texto, callback) => {
    executarBusca(texto, 5, callback);
};

exports.buscarResultados = (texto, callback) => {
    executarBusca(texto, null, callback);
};

function executarBusca(texto, limite, callback) {

    const termo = `%${texto}%`;

    buscarProdutos(termo, limite, (err, produtos) => {
        if (err) return callback(err);

        buscarLojas(termo, limite, (err, lojas) => {
            if (err) return callback(err);

            buscarServicos(termo, limite, (err, servicos) => {
                if (err) return callback(err);

                callback(null, {
                    produtos,
                    lojas,
                    servicos,
                });
            });
        });
    });
}

// ===============================
// PRODUTOS
// ===============================
function buscarProdutos(termo, limite, callback) {

    const query = `
        SELECT
            p.id,
            p.nome,
            p.preco,

            l.id AS loja_id,
            l.nome_fantasia AS loja_nome,
            l.imagem AS loja_logo,

            pi.caminho AS imagem

        FROM produtos p

        JOIN lojas l
            ON l.id = p.loja_id

        LEFT JOIN produtoimagens pi
            ON pi.produto_id = p.id
           AND pi.principal = 1

        WHERE
            p.ativo = 1
            AND (
                p.nome LIKE ?
                OR p.descricao LIKE ?
            )

        ORDER BY
            CASE
                WHEN p.nome LIKE ? THEN 0
                ELSE 1
            END,
            p.nome

    `;

    const params = [termo, termo, termo];

    let sql = query;

    if (limite != null) {
        sql += "\nLIMIT ?";
        params.push(limite);
    }

    db.query(
        sql,
        params,
        (err, results) => {

            if (err) return callback(err);

            const produtos = results.map((produto) => ({
                id: produto.id,
                nome: produto.nome,
                preco: produto.preco,

                imagens: produto.imagem
                    ? [
                        {
                        caminho: produto.imagem,
                        },
                    ]
                    : [],

                loja: {
                    id: produto.loja_id,
                    nome: produto.loja_nome,
                    logo: produto.loja_logo,
                },
                }));

            callback(null, produtos);
        }
    );
}

// ===============================
// LOJAS
// ===============================
function buscarLojas(termo, limite, callback) {

    const query = `
        SELECT
            id,
            nome_fantasia,
            imagem

        FROM lojas

        WHERE
            nome_fantasia LIKE ?

        ORDER BY nome_fantasia
    `;

    const params = [termo];

    let sql = query;

    if (limite != null) {
        sql += "\nLIMIT ?";
        params.push(limite);
    }

    db.query(
        sql,
        params,
        (err, results) => {

        if (err) return callback(err);

            callback(null, results);
        }
    );
}

// ===============================
// SERVIÇOS
// ===============================
function buscarServicos(termo, limite, callback) {

    const query = `
        SELECT

            s.id,
            s.nome,
            s.preco,
            s.duracao_min,

            l.id AS loja_id,
            l.nome_fantasia AS loja_nome,
            l.imagem AS loja_logo

        FROM servicos s

        JOIN lojas l
            ON l.id = s.loja_id

        WHERE
            s.ativo = 1
            AND (
                s.nome LIKE ?
                OR s.descricao LIKE ?
            )

        ORDER BY
            CASE
                WHEN s.nome LIKE ? THEN 0
                ELSE 1
            END,
            s.nome
    `;

    const params = [termo, termo, termo];

    let sql = query;

    if (limite != null) {
        sql += "\nLIMIT ?";
        params.push(limite);
    }

    db.query(
        sql,
        params,
        (err, results) => {

            if (err) return callback(err);

            callback(null, results);
        }
    );
}