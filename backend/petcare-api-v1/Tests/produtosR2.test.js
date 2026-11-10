const assert = require('node:assert/strict');
const test = require('node:test');

// db.js exige estas variáveis ao ser carregado; nenhum teste abre conexão real.
for (const nome of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET']) {
    process.env[nome] = process.env[nome] || (nome === 'JWT_SECRET' ? 'segredo-de-teste-com-mais-de-32-caracteres' : 'test');
}
const produtosModel = require('../Models/produtosModel');
const r2Storage = require('../Services/r2Storage');
const controller = require('../Controllers/produtosController');

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function invoke(handler, req) {
    return new Promise((resolve) => {
        const res = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(body) { resolve({ statusCode: this.statusCode, body }); return this; }
        };
        handler(req, res);
    });
}

function replace(target, replacements) {
    const original = {};
    for (const [key, value] of Object.entries(replacements)) {
        original[key] = target[key];
        target[key] = value;
    }
    return () => Object.assign(target, original);
}

test('persists public URLs only after all R2 uploads succeed', async () => {
    const saved = [];
    const original = replace(produtosModel, {
        getById: (_id, callback) => callback(null, { loja_id: 7 }),
        saveImagens: (images, callback) => { saved.push(...images); callback(null, {}); }
    });
    const storageOriginal = replace(r2Storage, {
        upload: async (file) => ({ key: `produtos/${file.originalname}`, url: `https://cdn.example/${file.originalname}` }),
        deleteByKey: async () => {}
    });
    try {
        const result = await invoke(controller.uploadImagensProduto, {
            params: { id: '15' }, usuario: { loja_id: 7 },
            files: [{ originalname: 'a.png', buffer: png }, { originalname: 'b.png', buffer: png }]
        });
        assert.equal(result.statusCode, 200);
        assert.deepEqual(saved.map((image) => image.caminho), ['https://cdn.example/a.png', 'https://cdn.example/b.png']);
    } finally {
        original();
        storageOriginal();
    }
});

test('cleans up successfully uploaded objects after a partial R2 failure', async () => {
    const deleted = [];
    const original = replace(produtosModel, { getById: (_id, callback) => callback(null, { loja_id: 7 }) });
    const storageOriginal = replace(r2Storage, {
        upload: async (file) => {
            if (file.originalname === 'b.png') throw Object.assign(new Error('private failure'), { name: 'S3Error' });
            return { key: 'produtos/a.png', url: 'https://cdn.example/a.png' };
        },
        deleteByKey: async (key) => deleted.push(key)
    });
    try {
        const result = await invoke(controller.uploadImagensProduto, {
            params: { id: '15' }, usuario: { loja_id: 7 },
            files: [{ originalname: 'a.png', buffer: png }, { originalname: 'b.png', buffer: png }]
        });
        assert.equal(result.statusCode, 500);
        assert.deepEqual(deleted, ['produtos/a.png']);
    } finally {
        original();
        storageOriginal();
    }
});

test('removes uploaded objects when database persistence fails', async () => {
    const deleted = [];
    const original = replace(produtosModel, {
        getById: (_id, callback) => callback(null, { loja_id: 7 }),
        saveImagens: (_images, callback) => callback(Object.assign(new Error('database failure'), { code: 'DB_TEST' }))
    });
    const storageOriginal = replace(r2Storage, {
        upload: async () => ({ key: 'produtos/a.png', url: 'https://cdn.example/a.png' }),
        deleteByKey: async (key) => deleted.push(key)
    });
    try {
        const result = await invoke(controller.uploadImagensProduto, {
            params: { id: '15' }, usuario: { loja_id: 7 }, files: [{ originalname: 'a.png', buffer: png }]
        });
        assert.equal(result.statusCode, 500);
        assert.deepEqual(deleted, ['produtos/a.png']);
        assert.doesNotMatch(JSON.stringify(result.body), /DB_TEST|database failure/);
    } finally {
        original();
        storageOriginal();
    }
});
