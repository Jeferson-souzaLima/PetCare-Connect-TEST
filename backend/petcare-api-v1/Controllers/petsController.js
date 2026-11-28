const Pet = require('../Models/petsModel');
const { enviarImagem, removerImagem } = require('../utils/imagens');
const { responderErroInterno, responderErroDoServico } = require('../utils/erroInterno');

const { ESPECIES, FASES_VIDA, encontrarEspecie, encontrarRaca, faseVidaValida } = require('../Config/catalogoPets');

const LIMITE_NOME = 100;

const textoLimpo = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/*
 * Valida os campos enviados pelo formulário (multipart: tudo chega como texto).
 * Espécie, raça e fase de vida só aceitam valores do catálogo (Config/catalogoPets.js);
 * espécie e raça andam juntas, porque a raça precisa ser daquela espécie.
 * Na criação tudo é obrigatório; na edição, só o que vier é alterado.
 */
function validarDadosPet(corpo = {}, { criacao }) {
    const dados = {};

    if (corpo.nome !== undefined) {
        const nome = textoLimpo(corpo.nome);
        if (!nome) return { erro: 'Informe o nome do pet.' };
        if (nome.length > LIMITE_NOME) return { erro: 'O nome do pet é muito longo.' };
        dados.nome = nome;
    }

    if (corpo.especie !== undefined || corpo.raca !== undefined) {
        const especie = encontrarEspecie(corpo.especie);
        if (!especie) return { erro: 'Escolha uma espécie da lista.' };
        const raca = encontrarRaca(especie, corpo.raca);
        if (!raca) return { erro: 'Escolha uma raça da lista para essa espécie.' };
        dados.especie = especie.nome;
        dados.raca = raca;
    }

    if (corpo.fase_vida !== undefined) {
        if (!faseVidaValida(corpo.fase_vida)) return { erro: 'Escolha a fase de vida do pet.' };
        dados.fase_vida = corpo.fase_vida;
    }

    if (criacao && !(dados.nome && dados.especie && dados.fase_vida)) {
        return { erro: 'Preencha nome, espécie, raça e fase de vida do pet.' };
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

/** Espécies (com as raças de cada uma) e fases de vida aceitas no cadastro. */
const listarOpcoes = (_req, res) => res.json({ especies: ESPECIES, fases: FASES_VIDA });

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
    listarOpcoes,
    atualizarPet,
    uploadImagem,
    deletarPet
};
