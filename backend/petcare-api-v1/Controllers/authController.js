const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { secret } = require('../Config/jwt');
const { responderErroInterno, registrarErroInterno, responderErroDoServico, MENSAGEM_ERRO_INTERNO } = require('../utils/erroInterno');
const { enviarEmailConfirmacao } = require('../Services/emailService');
const { gerarTokenConfirmacao } = require('../utils/tokenConfirmacaoEmail');
const { normalizarEmail, emailValido, erroDaSenha } = require('../utils/validacaoUsuario');
const { validarDadosLoja, somenteDigitos } = require('../utils/validacaoLoja');
const { CUSTO_BCRYPT } = require('../Config/senha');
const { MENSAGEM_ACEITE_OBRIGATORIO, aceitouTermos, COLUNAS_ACEITE, VALORES_ACEITE_SQL, valoresAceite } = require('../utils/aceiteTermos');


// =========================
// LOGIN
// =========================
/*
 * Hash usado quando o e-mail não existe, para que a resposta leve o mesmo
 * tempo de uma senha errada e não revele quais e-mails têm conta (M5).
 */
const HASH_SEM_CONTA = bcrypt.hashSync('senha-de-conta-inexistente', CUSTO_BCRYPT);

exports.login = (req, res) => {
    const email = normalizarEmail(req.body?.email);
    const { senha } = req.body || {};

    if (!email || !senha) {
        return res.status(400).json({
            mensagem: 'Email e senha são obrigatórios.'
        });
    }

    db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return responderErroInterno(res, err, "authController.login");

        const usuario = results[0];
        const tipoUsuario = usuario?.tipo;

        bcrypt.compare(String(senha), usuario?.senha_hash || HASH_SEM_CONTA, (err, isMatch) => {
            if (err) return responderErroInterno(res, err, "authController.login");

            if (!usuario || !isMatch) {
                return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
            }

            // Só quem acertou a senha descobre que o e-mail ainda não foi confirmado.
            if (['cliente', 'lojista'].includes(tipoUsuario) && !usuario.email_verificado) {
                return res.status(403).json({
                    codigo: 'EMAIL_NAO_VERIFICADO',
                    mensagem: 'Confirme seu e-mail antes de entrar.'
                });
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
const consultar = (sql, valores) => new Promise((resolve, reject) =>
    db.query(sql, valores, (err, resultado) => (err ? reject(err) : resolve(resultado))));

/*
 * Executa trabalho() numa transação. As consultas precisam começar dentro do
 * callback de beginTransaction: é ali que db.js associa a conexão da transação.
 */
function emTransacao(trabalho, callback) {
    db.beginTransaction((erro) => {
        if (erro) return callback(erro);
        trabalho().then(
            (resultado) => db.commit((erroCommit) =>
                (erroCommit ? db.rollback(() => callback(erroCommit)) : callback(null, resultado))),
            (falha) => db.rollback(() => callback(falha))
        );
    });
}

function conflito(mensagem) {
    const erro = new Error(mensagem);
    erro.status = 409;
    return erro;
}

/*
 * Cadastro de lojista: cria o usuário e a loja na mesma transação e exige a
 * confirmação do e-mail antes do primeiro login (não devolve token).
 */
exports.registerLojista = (req, res) => {
    const corpo = req.body || {};
    const email = normalizarEmail(corpo.email);

    if (!corpo.nomeFantasia || !corpo.cnpj || !email || !corpo.senha) {
        return res.status(400).json({ mensagem: "Preencha nome fantasia, CNPJ, e-mail e senha." });
    }

    const { loja, erro } = validarDadosLoja({
        nome_fantasia: corpo.nomeFantasia,
        razao_social: corpo.razaoSocial,
        cnpj: corpo.cnpj,
        telefone: corpo.telefone,
        cidade: corpo.cidade,
        uf: corpo.uf,
        descricao: corpo.descricao
    });
    if (erro) return res.status(400).json({ mensagem: erro });

    if (!emailValido(email)) {
        return res.status(400).json({ mensagem: "Informe um e-mail válido." });
    }

    const erroSenha = erroDaSenha(corpo.senha, corpo.confirmacaoSenha);
    if (erroSenha) return res.status(400).json({ mensagem: erroSenha });

    if (!aceitouTermos(corpo)) {
        return res.status(400).json({ mensagem: MENSAGEM_ACEITE_OBRIGATORIO });
    }

    bcrypt.hash(corpo.senha, CUSTO_BCRYPT, (erroHash, senhaHash) => {
        if (erroHash) return responderErroInterno(res, erroHash, "authController.registerLojista - hash da senha");

        const { token, tokenHash } = gerarTokenConfirmacao();

        emTransacao(async () => {
            const usuarios = await consultar("SELECT id FROM usuarios WHERE email = ? LIMIT 1", [email]);
            if (usuarios.length) throw conflito("E-mail já cadastrado.");

            const lojas = await consultar(
                "SELECT id FROM lojas WHERE REGEXP_REPLACE(cnpj, '[^0-9]', '') = ? LIMIT 1",
                [somenteDigitos(loja.cnpj)]
            );
            if (lojas.length) throw conflito("Já existe uma loja cadastrada com este CNPJ.");

            const usuario = await consultar(
                `INSERT INTO usuarios
                    (nome, email, senha_hash, tipo, email_verificado, email_verificacao_token_hash, email_verificacao_expira_em, ${COLUNAS_ACEITE})
                 VALUES (?, ?, ?, 'lojista', 0, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ${VALORES_ACEITE_SQL})`,
                [loja.nome_fantasia, email, senhaHash, tokenHash, ...valoresAceite()]
            );

            await consultar(
                `INSERT INTO lojas
                    (usuario_id, nome_fantasia, razao_social, cnpj, telefone, cidade, uf, descricao)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [usuario.insertId, loja.nome_fantasia, loja.razao_social, loja.cnpj, loja.telefone, loja.cidade, loja.uf, loja.descricao]
            );
        }, (erroCadastro) => {
            if (erroCadastro?.code === "ER_DUP_ENTRY") return res.status(409).json({ mensagem: "E-mail já cadastrado." });
            if (erroCadastro) return responderErroDoServico(res, erroCadastro, "authController.registerLojista", MENSAGEM_ERRO_INTERNO);

            enviarEmailConfirmacao(email, token)
                .then(() => res.status(201).json({
                    mensagem: "Loja cadastrada. Verifique seu e-mail para ativar a conta."
                }))
                .catch((erroEmail) => {
                    registrarErroInterno("authController.registerLojista - envio do e-mail de confirmação", erroEmail);
                    res.status(503).json({
                        mensagem: "Loja cadastrada, mas não foi possível enviar o e-mail. Solicite um novo link de confirmação na tela de login."
                    });
                });
        });
    });
};
