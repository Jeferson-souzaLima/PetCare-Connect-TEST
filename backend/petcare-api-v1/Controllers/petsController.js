const Pet = require('../Models/petsModel');
const { enviarImagem, removerImagem } = require('../utils/imagens');
const { responderErroInterno, responderErroDoServico } = require('../utils/erroInterno');

const LIMITES = { nome: 100, especie: 50, raca: 100 };

const textoLimpo = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/*
 * Valida os campos enviados pelo formulário (multipart: tudo chega como texto).
 * Na criação, nome e espécie são obrigatórios; na edição, só o que vier é alterado.
 */
function validarDadosPet(corpo = {}, { criacao }) {
    const dados = {};

    for (const campo of ['nome', 'especie', 'raca']) {
        if (corpo[campo] === undefined) continue;
        const texto = textoLimpo(corpo[campo]);
        if (texto.length > LIMITES[campo]) return { erro: `O campo ${campo} é muito longo.` };
        dados[campo] = campo === 'raca' ? texto || null : texto;
    }

    if (corpo.idade !== undefined) {
        const idade = textoLimpo(String(corpo.idade));
        if (idade === '') {
            dados.idade = null;
        } else if (!/^\d{1,2}$/.test(idade)) {
            return { erro: 'Informe a idade em anos (de 0 a 99).' };
        } else {
            dados.idade = Number(idade);
        }
    }

    const obrigatorios = criacao ? ['nome', 'especie'] : Object.keys(dados).filter((c) => c !== 'raca' && c !== 'idade');
    if (obrigatorios.some((campo) => !dados[campo])) {
        return { erro: 'Nome e espécie do pet são obrigatórios.' };
    }

    return { dados };
}

const executar = (fn, ...args) => new Promise((resolve, reject) =>
    fn(...args, (err, resultado) => (err ? reject(err) : resolve(resultado))));

const buscarPetDoUsuario = (id, usuarioId) => executar(Pet.buscarDoUsuario, id, usuarioId);

/** Envia a imagem nova (se houver); se a gravação falhar, apaga o que foi enviado. */
async function comImagemNova(file, gravar) {
    const url = file ? await enviarImagem(file, 'pets') : undefined;
    try {
        return await gravar(url);
    } catch (erro) {
        if (url) await removerImagem(url);
        throw erro;
    }
}

const criarPet = async (req, res) => {
    const { dados, erro } = validarDadosPet(req.body, { criacao: true });
    if (erro) return res.status(400).json({ mensagem: erro, erro });

    try {
        const result = await comImagemNova(req.file, (imagem) =>
            executar(Pet.criar, { ...dados, usuario_id: req.usuario.id, imagem: imagem || null }));

        return res.status(201).json({ mensagem: 'Pet criado com sucesso', petId: result.insertId });
    } catch (err) {
        return responderErroDoServico(res, err, 'petsController.criarPet', 'Erro ao criar pet.');
    }
};

const listarPetsDoUsuario = (req, res) => {
    Pet.listarPorUsuario(req.usuario.id, (err, pets) => {
        if (err) return responderErroInterno(res, err, 'petsController.listarPetsDoUsuario');
        res.json(pets);
    });
};

/** Atualiza dados e/ou imagem; a imagem anterior é apagada depois de salvar a nova. */
async function atualizar(req, res, dados, contexto) {
    try {
        const pet = await buscarPetDoUsuario(req.params.id, req.usuario.id);
        if (!pet) return res.status(404).json({ mensagem: 'Pet não encontrado.', erro: 'Pet não encontrado.' });

        const imagem = await comImagemNova(req.file, async (url) => {
            await executar(Pet.atualizar, pet.id, req.usuario.id, { ...dados, imagem: url });
            return url;
        });

        if (imagem && pet.imagem) await removerImagem(pet.imagem);

        return res.json({
            mensagem: 'Pet atualizado com sucesso',
            imagem: imagem || pet.imagem || null,
            imagemUrl: imagem || pet.imagem || null
        });
    } catch (err) {
        return responderErroDoServico(res, err, contexto, 'Erro ao atualizar pet.');
    }
}

const atualizarPet = (req, res) => {
    const { dados, erro } = validarDadosPet(req.body, { criacao: false });
    if (erro) return res.status(400).json({ mensagem: erro, erro });
    return atualizar(req, res, dados, 'petsController.atualizarPet');
};

const uploadImagem = (req, res) => {
    if (!req.file) return res.status(400).json({ mensagem: 'Nenhuma imagem enviada.', erro: 'Nenhuma imagem enviada.' });
    return atualizar(req, res, {}, 'petsController.uploadImagem');
};

const deletarPet = async (req, res) => {
    try {
        const pet = await buscarPetDoUsuario(req.params.id, req.usuario.id);
        if (!pet) return res.status(404).json({ mensagem: 'Pet não encontrado.', erro: 'Pet não encontrado.' });

        await executar(Pet.deletar, pet.id, req.usuario.id);
        await removerImagem(pet.imagem);

        return res.json({ mensagem: 'Pet deletado com sucesso' });
    } catch (err) {
        return responderErroInterno(res, err, 'petsController.deletarPet');
    }
};

module.exports = {
    criarPet,
    listarPetsDoUsuario,
    atualizarPet,
    uploadImagem,
    deletarPet
};
