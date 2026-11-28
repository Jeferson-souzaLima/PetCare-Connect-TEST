const assert = require('node:assert/strict');
const test = require('node:test');
const { comServidor, pedir, simularBanco, USUARIOS } = require('./apoioAcesso');

const db = require('../db');
const petsRoutes = require('../Routes/pets');
const { ESPECIES, FASES_VIDA } = require('../Config/catalogoPets');

/*
 * Cadastro de pets: espécie, raça e fase de vida só com valores do catálogo
 * (Config/catalogoPets.js), que o site busca em GET /pets/opcoes.
 */
function banco(t) {
    return simularBanco(t, db, [
        [/FROM pets WHERE id = \? AND usuario_id = \?/, (v) =>
            (Number(v[0]) === 5 && Number(v[1]) === 10 ? [{ id: 5, usuario_id: 10, imagem: null }] : [])],
        [/^\s*INSERT INTO pets/, { insertId: 9 }],
        [/^\s*UPDATE pets/, { affectedRows: 1 }]
    ]);
}

const gravacoes = (consultas) => consultas.filter((c) => /^(INSERT|UPDATE)/.test(c.sql));

test('catálogo: toda espécie tem raças, cachorro e gato têm vira-lata, e há três fases de vida', () => {
    assert.ok(ESPECIES.length >= 8);
    for (const especie of ESPECIES) assert.ok(especie.racas.length > 0, especie.nome);
    for (const nome of ['Cachorro', 'Gato']) {
        assert.ok(ESPECIES.find((e) => e.nome === nome).racas.includes('Sem raça definida (vira-lata)'), nome);
    }
    assert.deepEqual(FASES_VIDA.map((f) => f.id), ['filhote', 'adulto', 'senior']);
});

test('GET /pets/opcoes exige login e devolve espécies, raças e fases', async (t) => {
    banco(t);
    const r = await comServidor('/pets', petsRoutes, async (b) => [await pedir(b, 'GET', '/pets/opcoes', null), await pedir(b, 'GET', '/pets/opcoes', USUARIOS.cliente)]);
    assert.equal(r[0].status, 401);
    assert.equal(r[1].status, 200);
    assert.deepEqual(r[1].body.especies, ESPECIES);
    assert.deepEqual(r[1].body.fases, FASES_VIDA);
});

test('cadastro grava os nomes do catálogo (sem diferenciar maiúsculas e acentos) e a fase de vida', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/pets', petsRoutes, (b) =>
        pedir(b, 'POST', '/pets', USUARIOS.cliente, { nome: ' Mia ', especie: 'gato', raca: 'siames', fase_vida: 'filhote' }));
    assert.equal(r.status, 201);
    const [insert] = gravacoes(consultas);
    assert.deepEqual(insert.values.slice(0, 5).map(String), ['10', 'Mia', 'Gato', 'Siamês', 'filhote']);
});

test('espécie fora da lista, raça de outra espécie, fase inválida ou campo faltando: 400 sem gravar', async (t) => {
    const consultas = banco(t);
    const base = { nome: 'Rex', especie: 'Cachorro', raca: 'Pug', fase_vida: 'adulto' };
    const invalidos = [
        { ...base, especie: 'Dinossauro' },
        { ...base, especie: 'Gato', raca: 'Pug' },
        { ...base, raca: '' },
        { ...base, fase_vida: '3 anos' },
        { nome: 'Rex', especie: 'Cachorro', raca: 'Pug' },
        { ...base, nome: '   ' }
    ];
    const r = await comServidor('/pets', petsRoutes, async (b) => {
        const respostas = [];
        for (const corpo of invalidos) respostas.push(await pedir(b, 'POST', '/pets', USUARIOS.cliente, corpo));
        return respostas;
    });
    assert.deepEqual(r.map((x) => x.status), invalidos.map(() => 400));
    assert.equal(gravacoes(consultas).length, 0);
});

test('edição: só a fase muda só a fase; espécie sem raça válida é recusada; pet de outro usuário dá 404', async (t) => {
    const consultas = banco(t);
    const r = await comServidor('/pets', petsRoutes, async (b) => [
        await pedir(b, 'PUT', '/pets/5', USUARIOS.cliente, { fase_vida: 'senior' }),
        await pedir(b, 'PUT', '/pets/5', USUARIOS.cliente, { especie: 'Gato' }),
        await pedir(b, 'PUT', '/pets/5', USUARIOS.outroCliente, { fase_vida: 'adulto' })
    ]);
    assert.deepEqual(r.map((x) => x.status), [200, 400, 404]);
    const updates = gravacoes(consultas);
    assert.equal(updates.length, 1);
    assert.match(updates[0].sql, /SET fase_vida = \? WHERE id = \? AND usuario_id = \?/);
    assert.deepEqual(updates[0].values.map(String), ['senior', '5', '10']);
});
