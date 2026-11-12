const db = require('../db');

//
// ===============================
// LISTAR TODOS ATIVOS (HOME)
// ===============================
exports.getAll = (callback) => {

    const query = `
        SELECT 
            p.id AS produto_id,
            p.nome AS produto_nome,
            p.descricao,
            p.preco,
            p.estoque,
            p.ativo,

            l.id AS loja_id,
            l.nome_fantasia AS loja_nome,
            l.imagem AS loja_logo,

            pi.id AS imagem_id,
            pi.caminho AS imagem_caminho,
            pi.principal AS imagem_principal

        FROM produtos p
        JOIN lojas l ON l.id = p.loja_id
        LEFT JOIN produtoimagens pi ON pi.produto_id = p.id
        WHERE p.ativo = 1
        ORDER BY p.id DESC
    `;

    db.query(query, (err, results) => {
        if (err) return callback(err);
        callback(null, agruparProdutos(results));
    });
};

//
// ===============================
// LISTAR PRODUTOS PAGINADOS (HOME)
// DISTRIBUÍDOS ENTRE LOJAS
// ===============================
// filtros (opcional): { ordem: 'preco_asc' | 'preco_desc' | null, termo: { sql, valores } }
exports.getPaginados = (page, limit, filtros, callback) => {

    if (typeof filtros === 'function') {
        callback = filtros;
        filtros = {};
    }

    const offset = (page - 1) * limit;
    const termo = filtros.termo ?? { sql: '', valores: [] };
    const ordemPreco = { preco_asc: 'ASC', preco_desc: 'DESC' }[filtros.ordem];
    // Sem ordem pedida: produtos intercalados entre as lojas (como antes).
    const ordemPaginacao = ordemPreco
        ? `preco ${ordemPreco}, produto_id DESC`
        : 'ordem_na_loja ASC, loja_id ASC, produto_id DESC';
    const ordemFinal = ordemPreco
        ? `pp.preco ${ordemPreco}, pp.produto_id DESC`
        : 'pp.ordem_na_loja ASC, pp.loja_id ASC, pp.produto_id DESC';

    // 1. Conta os produtos válidos do catálogo público
    const queryTotal = `
        SELECT COUNT(*) AS total
        FROM produtos p
        INNER JOIN lojas l
            ON l.id = p.loja_id
        WHERE
            p.ativo = 1
            AND l.ativo = 1${termo.sql}
    `;

    db.query(queryTotal, termo.valores, (err, totalResults) => {

        if (err) {
            return callback(err);
        }

        const total = Number(totalResults[0].total);

        // 2. Primeiro seleciona e pagina os produtos.
        // 3. Depois busca as imagens desses produtos.
        const queryProdutos = `
            WITH produtos_ordenados AS (

                SELECT
                    p.id AS produto_id,
                    p.nome AS produto_nome,
                    p.descricao,
                    p.preco,
                    p.estoque,
                    p.ativo,

                    l.id AS loja_id,
                    l.nome_fantasia AS loja_nome,
                    l.imagem AS loja_logo,

                    ROW_NUMBER() OVER (
                        PARTITION BY l.id
                        ORDER BY p.id DESC
                    ) AS ordem_na_loja

                FROM produtos p

                INNER JOIN lojas l
                    ON l.id = p.loja_id

                WHERE
                    p.ativo = 1
                    AND l.ativo = 1${termo.sql}
            ),

            produtos_paginados AS (

                SELECT *
                FROM produtos_ordenados

                ORDER BY
                    ${ordemPaginacao}

                LIMIT ? OFFSET ?
            )

            SELECT
                pp.produto_id,
                pp.produto_nome,
                pp.descricao,
                pp.preco,
                pp.estoque,
                pp.ativo,

                pp.loja_id,
                pp.loja_nome,
                pp.loja_logo,

                pi.id AS imagem_id,
                pi.caminho AS imagem_caminho,
                pi.principal AS imagem_principal

            FROM produtos_paginados pp

            LEFT JOIN produtoimagens pi
                ON pi.produto_id = pp.produto_id

            ORDER BY
                ${ordemFinal}
        `;

        db.query(
            queryProdutos,
            [...termo.valores, limit, offset],
            (err, results) => {

                if (err) {
                    return callback(err);
                }

                const produtos = agruparProdutos(results);

                const temMais =
                    offset + produtos.length < total;

                callback(null, {
                    dados: produtos,
                    pagina: page,
                    limite: limit,
                    total,
                    temMais
                });
            }
        );
    });
};

//
// ===============================
// BUSCAR POR ID
// ===============================
exports.getById = (id, callback) => {

    const query = `
        SELECT 
            p.id AS produto_id,
            p.nome AS produto_nome,
            p.descricao,
            p.preco,
            p.estoque,
            p.ativo,
            p.loja_id,

            l.id AS loja_id,
            l.nome_fantasia AS loja_nome,
            l.imagem AS loja_logo,

            pi.id AS imagem_id,
            pi.caminho AS imagem_caminho,
            pi.principal AS imagem_principal

        FROM produtos p
        JOIN lojas l ON l.id = p.loja_id
        LEFT JOIN produtoimagens pi ON pi.produto_id = p.id
        WHERE p.id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) return callback(err);
        if (results.length === 0) return callback(null, null);

        const produtos = agruparProdutos(results);
        callback(null, produtos[0]);
    });
};

//
// ===============================
// CRIAR
// ===============================
exports.create = (produto, callback) => {

    const { nome, descricao, preco, estoque, ativo, loja_id } = produto;

    const query = `
        INSERT INTO produtos (nome, descricao, preco, estoque, ativo, loja_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [nome, descricao, preco, estoque, ativo, loja_id], callback);
};

//
// ===============================
// ATUALIZAR
// ===============================
exports.update = (id, dados, callback) => {

    const { nome, descricao, preco, estoque, ativo } = dados;

    const query = `
        UPDATE produtos
        SET nome = ?, descricao = ?, preco = ?, estoque = ?, ativo = ?
        WHERE id = ?
    `;

    db.query(query, [nome, descricao, preco, estoque, ativo, id], callback);
};

//
// ===============================
// DELETAR
// ===============================
exports.delete = (id, callback) => {
    db.query('DELETE FROM produtos WHERE id = ?', [id], callback);
};

//
// ===============================
// SALVAR IMAGENS
// ===============================
exports.saveImagens = (imagens, callback) => {

    if (!imagens || imagens.length === 0) {
        return callback(new Error('Nenhuma imagem informada.'));
    }

    const produtoId = imagens[0].produto_id;

    const queryVerificar = `
        SELECT COUNT(*) AS total
        FROM produtoimagens
        WHERE produto_id = ?
    `;

    db.query(queryVerificar, [produtoId], (err, results) => {
        if (err) return callback(err);

        const produtoJaTemImagens = results[0].total > 0;

        const values = imagens.map((img, index) => [
            img.produto_id,
            img.caminho,
            !produtoJaTemImagens && index === 0 ? 1 : 0
        ]);

        const queryInsert = `
            INSERT INTO produtoimagens
            (produto_id, caminho, principal)
            VALUES ?
        `;

        db.query(queryInsert, [values], callback);
    });
};

//
// ===============================
// PRODUTOS DO LOJISTA (TODOS)
// ===============================
exports.getByLojaId = (lojaId, callback) => {

    const query = `
        SELECT 
            p.id AS produto_id,
            p.nome AS produto_nome,
            p.descricao,
            p.preco,
            p.estoque,
            p.ativo,
            p.loja_id,

            l.id AS loja_id,
            l.nome_fantasia AS loja_nome,
            l.imagem AS loja_logo,

            pi.id AS imagem_id,
            pi.caminho AS imagem_caminho,
            pi.principal AS imagem_principal

        FROM produtos p
        JOIN lojas l ON l.id = p.loja_id
        LEFT JOIN produtoimagens pi ON pi.produto_id = p.id
        WHERE p.loja_id = ?
        ORDER BY p.id DESC
    `;

    db.query(query, [lojaId], (err, results) => {
        if (err) return callback(err);
        callback(null, agruparProdutos(results));
    });
};

//
// ===============================
// PRODUTOS ATIVOS DA LOJA (CLIENTE)
// ===============================
exports.getAtivosByLojaId = (lojaId, callback) => {

    const query = `
        SELECT 
            p.id AS produto_id,
            p.nome AS produto_nome,
            p.descricao,
            p.preco,
            p.estoque,
            p.ativo,
            p.loja_id,

            l.id AS loja_id,
            l.nome_fantasia AS loja_nome,
            l.imagem AS loja_logo,

            pi.id AS imagem_id,
            pi.caminho AS imagem_caminho,
            pi.principal AS imagem_principal

        FROM produtos p
        JOIN lojas l ON l.id = p.loja_id
        LEFT JOIN produtoimagens pi ON pi.produto_id = p.id
        WHERE p.loja_id = ?
          AND p.ativo = 1
        ORDER BY p.id DESC
    `;

    db.query(query, [lojaId], (err, results) => {
        if (err) return callback(err);

        callback(null, agruparProdutos(results));
    });
};

//
// ===============================
// PRODUTOS DISTRIBUIDORAS
// ===============================
exports.getProdutosDistribuidoras = (callback) => {

    const query = `
        SELECT p.*
        FROM produtos p
        JOIN lojas l ON p.loja_id = l.id
        JOIN usuarios u ON l.usuario_id = u.id
        WHERE u.tipo = 'distribuidora'
    `;

    db.query(query, callback);
};


//
// ===============================
// BUSCAR IMAGEM POR ID E PRODUTO
// ===============================
exports.getImagemById = (imagemId, produtoId, callback) => {

    const query = `
        SELECT id, produto_id, caminho, principal
        FROM produtoimagens
        WHERE id = ? AND produto_id = ?
        LIMIT 1
    `;

    db.query(query, [imagemId, produtoId], (err, results) => {
        if (err) return callback(err);

        callback(null, results.length ? results[0] : null);
    });
};

//
// ===============================
// CONTAR IMAGENS DO PRODUTO
// ===============================
exports.countImagensByProduto = (produtoId, callback) => {

    const query = `
        SELECT COUNT(*) AS total
        FROM produtoimagens
        WHERE produto_id = ?
    `;

    db.query(query, [produtoId], (err, results) => {
        if (err) return callback(err);

        callback(null, results[0].total);
    });
};

//
// ===============================
// DEFINIR OUTRA IMAGEM COMO PRINCIPAL
// ===============================
exports.definirOutraPrincipal = (produtoId, imagemIdIgnorada, callback) => {

    const query = `
        UPDATE produtoimagens
        SET principal = 1
        WHERE produto_id = ?
          AND id != ?
        ORDER BY id ASC
        LIMIT 1
    `;

    db.query(query, [produtoId, imagemIdIgnorada], callback);
};

//
// ===============================
// DEFINIR IMAGEM PRINCIPAL
// ===============================
exports.definirImagemPrincipal = (produtoId, imagemId, callback) => {

    db.beginTransaction((err) => {
        if (err) return callback(err);

        const removerPrincipal = `
            UPDATE produtoimagens
            SET principal = 0
            WHERE produto_id = ?
        `;

        db.query(removerPrincipal, [produtoId], (err) => {

            if (err) {
                return db.rollback(() => callback(err));
            }

            const definirPrincipal = `
                UPDATE produtoimagens
                SET principal = 1
                WHERE id = ?
                  AND produto_id = ?
            `;

            db.query(
                definirPrincipal,
                [imagemId, produtoId],
                (err, result) => {

                    if (err) {
                        return db.rollback(() => callback(err));
                    }

                    // Prote��o: nenhuma imagem correspondente foi encontrada.
                    if (result.affectedRows === 0) {
                        return db.rollback(() => {
                            const erro = new Error(
                                "Imagem n�o encontrada para este produto."
                            );

                            erro.status = 404;

                            callback(erro);
                        });
                    }

                    db.commit((err) => {

                        if (err) {
                            return db.rollback(() => callback(err));
                        }

                        callback(null, result);
                    });
                }
            );
        });
    });
};

//
// ===============================
// DELETAR IMAGEM
// ===============================
exports.deleteImagem = (imagemId, produtoId, callback) => {

    const query = `
        DELETE FROM produtoimagens
        WHERE id = ? AND produto_id = ?
    `;

    db.query(query, [imagemId, produtoId], callback);
};

//
// ===============================
// FUN��O AUXILIAR
// ===============================
function agruparProdutos(results) {

    const produtosMap = {};

    results.forEach(row => {

        if (!produtosMap[row.produto_id]) {
            produtosMap[row.produto_id] = {
                id: row.produto_id,
                nome: row.produto_nome,
                descricao: row.descricao,
                preco: row.preco,
                estoque: row.estoque,
                ativo: row.ativo,
                loja_id: row.loja_id,
                imagens: [],
                loja: {
                    id: row.loja_id,
                    nome: row.loja_nome,
                    logo: row.loja_logo
                }
            };
        }

        if (row.imagem_id) {
            produtosMap[row.produto_id].imagens.push({
                id: row.imagem_id,
                caminho: row.imagem_caminho,
                principal: row.imagem_principal
            });
        }
    });

    Object.values(produtosMap).forEach(produto => {
        produto.imagens.sort((a, b) => b.principal - a.principal);
    });

    return Object.values(produtosMap);
}

//
// ===============================
// VERIFICAR SE EXISTE POR ID
// ===============================
exports.existePorId = (id, callback) => {

    const sql = `
        SELECT id
        FROM produtos
        WHERE
            id = ?
            AND ativo = 1
        LIMIT 1
    `;

    db.query(
        sql,
        [id],
        callback
    );
};