const assert = require('node:assert/strict');
const test = require('node:test');
require('./apoioAcesso');

const usuariosController = require('../Controllers/usuariosController');
const usuariosModel = require('../Models/usuariosModel');
const authController = require('../Controllers/authController');

// M8: funções sem rota que listavam, criavam (com req.body), alteravam ou
// apagavam usuários. Se alguém ligasse uma rota a elas, qualquer um viraria
// admin ou apagaria contas. Não devem voltar a existir.
test('usuariosController só age sobre a própria conta (sem CRUD genérico de usuários)', () => {
    assert.deepEqual(Object.keys(usuariosController).sort(), ['atualizarMeuPerfil', 'excluirMinhaConta', 'exportarMeusDados']);
});

test('usuariosModel não tem create/update genéricos nem listagem completa', () => {
    for (const nome of ['getAll', 'create', 'update']) {
        assert.equal(usuariosModel[nome], undefined, nome);
    }
});

test('cadastro antigo sem confirmação de e-mail nem aceite não existe mais', () => {
    assert.equal(authController.register, undefined);
});
