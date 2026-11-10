const usuarioModel = require('../Models/usuariosModel');
const geocodingService = require('../Services/geocodingService');
const { registrarErroInterno } = require('../utils/erroInterno');

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
