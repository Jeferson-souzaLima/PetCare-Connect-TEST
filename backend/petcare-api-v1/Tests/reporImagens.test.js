const test = require('node:test');
const assert = require('node:assert/strict');
const { FONTES, estaQuebrada, montarPlano } = require('../scripts/reporImagens');

test('estaQuebrada: caminho antigo em /uploads é quebrado; URL http(s) e vazio não', () => {
    assert.equal(estaQuebrada('/uploads/lojas/loja-1.jpg'), true);
    assert.equal(estaQuebrada('uploads/1783731599970.png'), true);
    assert.equal(estaQuebrada('https://pub-x.r2.dev/lojas/a.png'), false);
    assert.equal(estaQuebrada(null), false);
    assert.equal(estaQuebrada(''), false);
});

test('montarPlano: junta os registros quebrados com o arquivo novo e aponta o que falta', () => {
    const quebrados = [
        { fonte: 'lojas', id: 6, caminho: '/uploads/lojas/loja-1.jpg' },
        { fonte: 'produtos', id: 41, caminho: '/uploads/a.png' },
        { fonte: 'pets', id: 3, caminho: '/uploads/b.png' }
    ];
    const mapa = { lojas: { 6: 'lojas/joao.png' }, produtos: { 41: 'produtos/bola.png', 99: 'x.png' } };
    const plano = montarPlano(quebrados, mapa);
    assert.deepEqual(plano.trocar, [
        { fonte: 'lojas', id: 6, caminho: '/uploads/lojas/loja-1.jpg', arquivo: 'lojas/joao.png' },
        { fonte: 'produtos', id: 41, caminho: '/uploads/a.png', arquivo: 'produtos/bola.png' }
    ]);
    assert.deepEqual(plano.semArquivo, [{ fonte: 'pets', id: 3, caminho: '/uploads/b.png' }]);
    assert.deepEqual(plano.sobrando, ['produtos 99']);
});

test('cada fonte grava só a coluna de imagem, pela chave do registro', () => {
    for (const fonte of Object.values(FONTES)) {
        assert.match(fonte.listar, /^SELECT /);
        assert.match(fonte.atualizar, /^UPDATE \w+ SET \w+ = \? WHERE id = \? AND \w+ = \?$/);
        assert.ok(['produtos', 'pets', 'lojas'].includes(fonte.pasta));
    }
});
