const usuarioModel = require('../Models/usuariosModel');
const geocodingService = require('../Services/geocodingService');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const r2Storage = require('../Services/r2Storage');
const { CUSTO_BCRYPT } = require('../Config/senha');
const { emTransacao, erroDeNegocio } = require('../utils/transacao');
const {
    registrarErroInterno,
    responderErroInterno,
    responderErroDoServico,
    MENSAGEM_ERRO_INTERNO
} = require('../utils/erroInterno');

const CAMPOS_ENDERECO = ['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'];

function textoLimpo(valor) {
    return typeof valor === 'string' ? valor.trim() : valor;
}

function buscarUsuarioPorId(id) {
    return new Promise((resolve, reject) => {
        usuarioModel.getById(id, (err, usuario) => err ? reject(err) : resolve(usuario));
    });
}

function salvarPerfil(id, dados) {
    return new Promise((resolve, reject) => {
        usuarioModel.updatePerfil(id, dados, (err, result) => err ? reject(err) : resolve(result));
    });
}

exports.atualizarMeuPerfil = async (req, res) => {
    const id = req.usuario.id;

    try {
        if (!req.body || Array.isArray(req.body)) {
            return res.status(400).json({ mensagem: 'Dados do perfil invalidos.' });
        }

        const usuarioAtual = await buscarUsuarioPorId(id);
        if (!usuarioAtual) return res.status(404).json({ mensagem: 'Usuario nao encontrado.' });

        const enderecoAlterado = CAMPOS_ENDERECO.some((campo) =>
            Object.prototype.hasOwnProperty.call(req.body, campo)
        );
        const dadosAtualizados = {
            nome: textoLimpo(req.body.nome ?? usuarioAtual.nome),
            telefone: textoLimpo(req.body.telefone ?? usuarioAtual.telefone),
            cidade: textoLimpo(req.body.cidade ?? usuarioAtual.cidade),
            uf: textoLimpo(req.body.uf ?? usuarioAtual.uf)?.toUpperCase(),
            cep: textoLimpo(req.body.cep ?? usuarioAtual.cep)?.replace(/\D/g, ''),
            logradouro: textoLimpo(req.body.logradouro ?? usuarioAtual.logradouro),
            numero: textoLimpo(req.body.numero ?? usuarioAtual.numero),
            complemento: textoLimpo(req.body.complemento ?? usuarioAtual.complemento),
            bairro: textoLimpo(req.body.bairro ?? usuarioAtual.bairro),
            latitude: usuarioAtual.latitude,
            longitude: usuarioAtual.longitude
        };

        if (enderecoAlterado) {
            const obrigatorios = ['cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'];

            if (
                obrigatorios.some((campo) => !dadosAtualizados[campo]) ||
                !/^\d{8}$/.test(dadosAtualizados.cep) ||
                !/^[A-Z]{2}$/.test(dadosAtualizados.uf)
            ) {
                return res.status(400).json({
                    mensagem: 'Informe CEP, endereco, numero, bairro, cidade e UF validos.'
                });
            }

            /*
            * Se o frontend enviar coordenadas válidas,
            * usamos a localização fornecida pelo dispositivo.
            */
            const latitudeRecebida = Number(req.body.latitude);
            const longitudeRecebida = Number(req.body.longitude);

            const coordenadasRecebidasSaoValidas =
                Number.isFinite(latitudeRecebida) &&
                Number.isFinite(longitudeRecebida) &&
                latitudeRecebida >= -90 &&
                latitudeRecebida <= 90 &&
                longitudeRecebida >= -180 &&
                longitudeRecebida <= 180;

            if (coordenadasRecebidasSaoValidas) {

                dadosAtualizados.latitude = latitudeRecebida;
                dadosAtualizados.longitude = longitudeRecebida;

            } else {

                /*
                * Caso não tenham sido fornecidas coordenadas,
                * seguimos com o geocoding normalmente.
                */
                const endereco = [
                    dadosAtualizados.logradouro,
                    dadosAtualizados.numero,
                    dadosAtualizados.complemento,
                    dadosAtualizados.bairro
                ]
                    .filter(Boolean)
                    .join(', ');

                const coordenadas =
                    await geocodingService.buscarCoordenadas({
                        endereco,
                        cidade: dadosAtualizados.cidade,
                        uf: dadosAtualizados.uf,
                        cep: dadosAtualizados.cep
                    });

                if (
                    !coordenadas ||
                    !Number.isFinite(coordenadas.latitude) ||
                    !Number.isFinite(coordenadas.longitude)
                ) {
                    return res.status(400).json({
                        mensagem: 'Nao foi possivel localizar esse endereco. Verifique os dados informados.'
                    });
                }

                dadosAtualizados.latitude = coordenadas.latitude;
                dadosAtualizados.longitude = coordenadas.longitude;
            }
        }

        const result = await salvarPerfil(id, dadosAtualizados);
        if (result.affectedRows === 0) return res.status(404).json({ mensagem: 'Usuario nao encontrado.' });

        return res.json({
            mensagem: 'Perfil atualizado com sucesso.',
            usuario: { ...usuarioAtual, ...dadosAtualizados }
        });
    } catch (err) {
        registrarErroInterno('usuariosController: Erro ao processar atualizacao do perfil', err);
        return res.status(500).json({ mensagem: 'Erro ao processar atualizacao do perfil.' });
    }
};


// =====================================================================
// LGPD (art. 18): exportar meus dados e excluir minha conta
// =====================================================================

exports.exportarMeusDados = async (req, res) => {
    try {
        const dados = await usuarioModel.buscarDadosParaExportacao(req.usuario.id);
        if (!dados) return res.status(404).json({ mensagem: 'Usuario nao encontrado.' });

        res.setHeader('Content-Disposition', 'attachment; filename="petcare-connect-meus-dados.json"');
        res.setHeader('Cache-Control', 'no-store');
        return res.json({ gerado_em: new Date().toISOString(), ...dados });
    } catch (err) {
        return responderErroInterno(res, err, 'usuariosController.exportarMeusDados');
    }
};

/*
 * Exclusão da conta do cliente por anonimização. Exige a senha atual e que
 * não haja pedido ou agendamento em andamento. Contas de lojista envolvem a
 * loja e os pedidos dela: são tratadas pelo canal de atendimento.
 * Senha errada responde 403 (e não 401, que o site trata como sessão expirada).
 */
exports.excluirMinhaConta = async (req, res) => {
    const { senha } = req.body || {};

    if (typeof senha !== 'string' || !senha) {
        return res.status(400).json({ mensagem: 'Informe sua senha para confirmar a exclusão.' });
    }

    if (req.usuario.tipo !== 'cliente') {
        return res.status(409).json({
            mensagem: 'Para excluir uma conta de lojista, fale com o atendimento: a exclusão envolve a loja e os pedidos dela.'
        });
    }

    try {
        const credenciais = await usuarioModel.buscarCredenciais(req.usuario.id);
        if (!credenciais) return res.status(404).json({ mensagem: 'Usuario nao encontrado.' });

        if (!(await bcrypt.compare(senha, credenciais.senha_hash))) {
            return res.status(403).json({ mensagem: 'Senha incorreta.' });
        }

        const senhaInutilizavel = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), CUSTO_BCRYPT);

        emTransacao(async () => {
            const pendencias = await usuarioModel.contarPendencias(req.usuario.id);
            if (pendencias.pedidos || pendencias.agendamentos) {
                throw erroDeNegocio(409,
                    'Você tem pedidos ou agendamentos em andamento. Conclua ou cancele antes de excluir a conta.');
            }
            return usuarioModel.anonimizarConta(req.usuario.id, senhaInutilizavel);
        }, (erro, imagensDosPets) => {
            if (erro) {
                return responderErroDoServico(res, erro, 'usuariosController.excluirMinhaConta', MENSAGEM_ERRO_INTERNO);
            }

            apagarArquivosLocais(imagensDosPets);
            return res.json({ mensagem: 'Sua conta foi excluída e seus dados pessoais foram removidos.' });
        });
    } catch (err) {
        return responderErroInterno(res, err, 'usuariosController.excluirMinhaConta');
    }
};

/** Apaga as fotos dos pets guardadas em /uploads. Falhas só são registradas. */
function apagarArquivosLocais(caminhos = []) {
    for (const caminho of caminhos) {
        const alvo = r2Storage.getStorageTarget(caminho);
        if (alvo?.type !== 'local') continue;

        fs.unlink(path.join(__dirname, '..', 'uploads', alvo.filename), (err) => {
            if (err && err.code !== 'ENOENT') registrarErroInterno('usuariosController: apagar foto de pet', err);
        });
    }
}
