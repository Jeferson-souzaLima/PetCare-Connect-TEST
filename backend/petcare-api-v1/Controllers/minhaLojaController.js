const db = require('../db');
const { buscarCoordenadas } = require("../Services/geocodingService");

const { validarDadosLoja: validarDados } = require("../utils/validacaoLoja");

function buscarPorUsuario(usuarioId, callback) {
    db.query('SELECT * FROM lojas WHERE usuario_id = ? LIMIT 1', [usuarioId], callback);
}

async function obterCoordenadas(loja) {

    const coordenadas = await buscarCoordenadas({
        endereco: loja.endereco,
        cidade: loja.cidade,
        uf: loja.uf,
        cep: loja.cep
    });

    if (!coordenadas) {
        return {
            latitude: null,
            longitude: null
        };
    }

    return coordenadas;

}

exports.buscarMinhaLoja = (req, res) => {
    buscarPorUsuario(req.usuario.id, (err, lojas) => {
        if (err) return res.status(500).json({ mensagem: 'Erro ao buscar os dados da loja.' });
        if (!lojas.length) return res.status(404).json({ mensagem: 'Nenhuma loja cadastrada para este usuário.' });
        return res.json(lojas[0]);
    });
};

exports.criarMinhaLoja = async (req, res) => {
    const { loja, erro } = validarDados(req.body);
    if (erro) return res.status(400).json({ mensagem: erro });
    buscarPorUsuario(req.usuario.id, async (findErr, lojas) => {
        if (findErr) return res.status(500).json({ mensagem: 'Erro ao verificar a loja.' });
        if (lojas.length) return res.status(409).json({ mensagem: 'Este usuário já possui uma loja cadastrada.' });
        const coordenadas = await obterCoordenadas(loja);
        const sql = `
        INSERT INTO lojas (
            usuario_id,
            nome_fantasia,
            razao_social,
            cnpj,
            telefone,
            descricao,
            cidade,
            uf,
            endereco,
            cep,
            latitude,
            longitude,
            entrega_ativa, taxa_entrega_fixa, taxa_entrega_por_km, raio_entrega_km
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            req.usuario.id,
            loja.nome_fantasia,
            loja.razao_social,
            loja.cnpj,
            loja.telefone,
            loja.descricao,
            loja.cidade,
            loja.uf,
            loja.endereco,
            loja.cep,
            coordenadas.latitude,
            coordenadas.longitude,
            loja.entrega_ativa, loja.taxa_entrega_fixa, loja.taxa_entrega_por_km, loja.raio_entrega_km
        ];
        db.query(sql, values, (insertErr, result) => {
            if (insertErr) return res.status(500).json({ mensagem: 'Erro ao criar a loja.' });
            return res.status(201).json({ mensagem: 'Dados da loja salvos com sucesso.', loja: { id: result.insertId, ...loja } });
        });
    });
};

exports.atualizarMinhaLoja = async (req, res) => {
    const { loja, erro } = validarDados(req.body);
    if (erro) return res.status(400).json({ mensagem: erro });
    const coordenadas = await obterCoordenadas(loja);


    const sql = `
    UPDATE lojas
    SET
        nome_fantasia = ?,
        razao_social = ?,
        cnpj = ?,
        telefone = ?,
        descricao = ?,
        cidade = ?,
        uf = ?,
        endereco = ?,
        cep = ?,
        latitude = ?,
        longitude = ?,
        entrega_ativa = ?, taxa_entrega_fixa = ?, taxa_entrega_por_km = ?, raio_entrega_km = ?
        WHERE usuario_id = ?
    `;
    const values = [
        loja.nome_fantasia,
        loja.razao_social,
        loja.cnpj,
        loja.telefone,
        loja.descricao,
        loja.cidade,
        loja.uf,
        loja.endereco,
        loja.cep,
        coordenadas.latitude,
        coordenadas.longitude,
        loja.entrega_ativa, loja.taxa_entrega_fixa, loja.taxa_entrega_por_km, loja.raio_entrega_km,
        req.usuario.id
    ];
    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ mensagem: 'Erro ao atualizar a loja.' });
        if (!result.affectedRows) return res.status(404).json({ mensagem: 'Nenhuma loja cadastrada para este usuário.' });
        return res.json({ mensagem: 'Dados da loja atualizados com sucesso.', loja });
    });
};

exports.carregarMinhaLoja = (req, res, next) => {
    buscarPorUsuario(req.usuario.id, (err, lojas) => {
        if (err) return res.status(500).json({ mensagem: 'Erro ao verificar a loja.' });
        if (!lojas.length) return res.status(404).json({ mensagem: 'Cadastre os dados da loja antes de enviar uma imagem.' });
        req.loja = lojas[0];
        return next();
    });
};

exports.atualizarImagemMinhaLoja = (req, res) => {
    if (!req.file) return res.status(400).json({ mensagem: 'Selecione uma imagem para enviar.' });
    const imagem = `/uploads/${req.file.filename}`;
    db.query('UPDATE lojas SET imagem = ? WHERE id = ? AND usuario_id = ?', [imagem, req.loja.id, req.usuario.id], (err, result) => {
        if (err) return res.status(500).json({ mensagem: 'Erro ao atualizar a imagem da loja.' });
        if (!result.affectedRows) return res.status(404).json({ mensagem: 'Loja não encontrada.' });
        return res.json({ mensagem: 'Imagem da loja atualizada com sucesso.', imagem });
    });
};
