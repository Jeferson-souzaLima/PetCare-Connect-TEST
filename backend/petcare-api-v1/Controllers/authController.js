const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { secret } = require('../Config/jwt');
const { responderErroInterno } = require('../utils/erroInterno');


// =========================
// REGISTER
// =========================
exports.register = (req, res) => {
    const { nome, email, senha } = req.body;
    const tipo = 'cliente';

    if (!nome || !email || !senha) {
        return res.status(400).json({
            mensagem: 'Nome, email e senha são obrigatórios.'
        });
    }

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return responderErroInterno(res, err, "authController.register");

        if (results.length > 0) {
            return res.status(409).json({ mensagem: 'Email já cadastrado.' });
        }

        bcrypt.hash(senha, 10, (err, hash) => {
            if (err) return responderErroInterno(res, err, "authController.register");

            db.query(
                'INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)',
                [nome, email, hash, tipo],
                (err, result) => {
                    if (err) return responderErroInterno(res, err, "authController.register");

                    const token = jwt.sign(
                        { id: result.insertId, tipo },
                        secret,
                        { expiresIn: '1d' }
                    );

                    return res.status(201).json({
                        mensagem: 'Usuário registrado com sucesso!',
                        token,
                        usuario: {
                            id: result.insertId,
                            nome,
                            email,
                            tipo
                        }
                    });
                }
            );
        });
    });
};

// =========================
// LOGIN
// =========================
exports.login = (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            mensagem: 'Email e senha são obrigatórios.'
        });
    }

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return responderErroInterno(res, err, "authController.login");

        if (results.length === 0) {
            return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
        }

        const usuario = results[0];

        // Compatibilidade temporária durante a migração
        const tipoUsuario = usuario.tipo;

        bcrypt.compare(senha, usuario.senha_hash, (err, isMatch) => {
            if (err) return responderErroInterno(res, err, "authController.login");

            if (!isMatch) {
                return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
            }

            // =========================
            // LOJISTA
            // =========================
            if (tipoUsuario === 'lojista') {
                db.query(
                    'SELECT id FROM lojas WHERE usuario_id = ? LIMIT 1',
                    [usuario.id],
                    (err, lojaResults) => {
                        if (err) return responderErroInterno(res, err, "authController.login");

                        if (lojaResults.length === 0) {
                            return res.status(400).json({
                                mensagem: 'Loja não encontrada para este usuário.'
                            });
                        }

                        const lojaId = lojaResults[0].id;

                        const token = jwt.sign(
                            {
                                id: usuario.id,
                                tipo: tipoUsuario,
                                loja_id: lojaId
                            },
                            secret,
                            { expiresIn: '1d' }
                        );



                        return res.json({
                            mensagem: 'Login realizado com sucesso!',
                            token,
                            usuario: {
                                id: usuario.id,
                                nome: usuario.nome,
                                email: usuario.email,
                                tipo: tipoUsuario,
                                loja_id: lojaId
                            }
                        });
                    }
                );
            } else {
                // =========================
                // CLIENTE / ADMIN / OUTROS
                // =========================
                const token = jwt.sign(
                    {
                        id: usuario.id,
                        tipo: tipoUsuario
                    },
                    secret,
                    { expiresIn: '1d' }
                );

                return res.json({
                    mensagem: 'Login realizado com sucesso!',
                    token,
                    usuario: {
                        id: usuario.id,
                        nome: usuario.nome,
                        email: usuario.email,
                        tipo: tipoUsuario
                    }
                });
            }
        });
    });
};

// =========================
// ENDPOINT /usuarios/me
// =========================
exports.me = (req, res) => {
    const userId = req.usuario.id;

    db.query(
        `SELECT id, nome, email, telefone, tipo, cidade, uf, cep, logradouro,
                numero, complemento, bairro, latitude, longitude
         FROM usuarios WHERE id = ?`,
        [userId],
        (err, results) => {
            if (err) return responderErroInterno(res, err, "authController.me");

            if (results.length === 0) {
                return res.status(404).json({
                    mensagem: 'Usuário não encontrado.'
                });
            }

            const usuario = results[0];

            // Se for lojista, devolve também a loja vinculada
            if (usuario.tipo === 'lojista') {
                db.query(
                    'SELECT id FROM lojas WHERE usuario_id = ? LIMIT 1',
                    [usuario.id],
                    (err, lojaResults) => {
                        if (err) return responderErroInterno(res, err, "authController.me");

                        return res.json({
                            ...usuario,
                            loja_id: lojaResults.length
                                ? lojaResults[0].id
                                : null
                        });
                    }
                );
            } else {
                return res.json(usuario);
            }
        }
    );
};

// =========================
// REGISTER LOJISTA
// =========================
exports.registerLojista = (req, res) => {
    const {
        nomeFantasia,
        razaoSocial,
        cnpj,
        email,
        senha,
        telefone,
        cidade,
        uf,
        descricao
    } = req.body;

    if (!nomeFantasia || !cnpj || !email || !senha) {
        return res.status(400).json({
            mensagem: 'Campos obrigatórios faltando.'
        });
    }

    // 1) verifica se email já existe
    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return responderErroInterno(res, err, "authController.registerLojista");

        if (results.length > 0) {
            return res.status(409).json({ mensagem: 'Email já cadastrado.' });
        }

        // 2) cria usuário lojista
        bcrypt.hash(senha, 10, (err, hash) => {
            if (err) return responderErroInterno(res, err, "authController.registerLojista");

            db.query(
                'INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)',
                [nomeFantasia, email, hash, 'lojista'],
                (err, result) => {
                    if (err) return responderErroInterno(res, err, "authController.registerLojista");

                    const usuarioId = result.insertId;

                    // 3) cria loja vinculada ao usuário
                    db.query(
                        `INSERT INTO lojas
                        (usuario_id, nome_fantasia, razao_social, cnpj, telefone, cidade, uf, descricao)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            usuarioId,
                            nomeFantasia,
                            razaoSocial,
                            cnpj,
                            telefone,
                            cidade,
                            uf,
                            descricao
                        ],
                        (err, lojaResult) => {
                            if (err) return responderErroInterno(res, err, "authController.registerLojista");

                            const lojaId = lojaResult.insertId;

                            // opcionalmente já loga o lojista após cadastro
                            const token = jwt.sign(
                                {
                                    id: usuarioId,
                                    tipo: 'lojista',
                                    loja_id: lojaId
                                },
                                secret,
                                { expiresIn: '1d' }
                            );

                            return res.status(201).json({
                                mensagem: 'Lojista cadastrado com sucesso!',
                                token,
                                usuario: {
                                    id: usuarioId,
                                    nome: nomeFantasia,
                                    email,
                                    tipo: 'lojista',
                                    loja_id: lojaId
                                }
                            });
                        }
                    );
                }
            );
        });
    });
};
