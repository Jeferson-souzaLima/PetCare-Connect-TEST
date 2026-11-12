const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { PALAVRAS_POR_TIPO } = require('../utils/filtrosCatalogo');

// A imagem padrão do serviço (frontend) usa as mesmas palavras do filtro por tipo (API).
test('palavras dos tipos de serviço iguais no filtro da API e na imagem padrão do site', async () => {
    const arquivo = path.resolve(__dirname, '../../../frontend/src/utils/servicos.js');
    const { PALAVRAS_POR_TIPO_SERVICO } = await import(pathToFileURL(arquivo).href);
    assert.deepEqual(PALAVRAS_POR_TIPO_SERVICO, PALAVRAS_POR_TIPO);
});
