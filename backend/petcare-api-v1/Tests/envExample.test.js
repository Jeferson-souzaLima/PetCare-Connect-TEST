const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const RAIZ = path.join(__dirname, '..');

function arquivosJs(pasta) {
    return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
        const caminho = path.join(pasta, item.name);
        if (item.isDirectory()) return ['node_modules', 'Tests'].includes(item.name) ? [] : arquivosJs(caminho);
        return item.name.endsWith('.js') ? [caminho] : [];
    });
}

test('.env.example documenta todas as variáveis de ambiente usadas pelo backend', () => {
    const usadas = new Set();
    for (const arquivo of arquivosJs(RAIZ)) {
        const codigo = fs.readFileSync(arquivo, 'utf8');
        for (const m of codigo.matchAll(/process\.env\.([A-Z0-9_]+)/g)) usadas.add(m[1]);
        for (const m of codigo.matchAll(/env\.([A-Z][A-Z0-9_]+)/g)) usadas.add(m[1]);
        // Nomes 'R2_*' entre aspas (lista de obrigatórias do r2Storage); códigos de erro (_ERROR/_MISSING) ficam de fora.
        for (const m of codigo.matchAll(/['"](R2_[A-Z_]+)['"]/g)) if (!/_(ERROR|MISSING)$/.test(m[1])) usadas.add(m[1]);
    }
    usadas.delete('NODE_ENV');

    const exemplo = fs.readFileSync(path.join(RAIZ, '.env.example'), 'utf8');
    const documentadas = new Set([...exemplo.matchAll(/^#?\s*([A-Z0-9_]+)=/gm)].map((m) => m[1]));

    const faltando = [...usadas].filter((nome) => !documentadas.has(nome)).sort();
    assert.deepEqual(faltando, []);
});

test('.env.example não contém valores que pareçam credenciais reais', () => {
    const exemplo = fs.readFileSync(path.join(RAIZ, '.env.example'), 'utf8');
    for (const linha of exemplo.split('\n')) {
        assert.doesNotMatch(linha, /APP_USR-|TEST-\d{6,}|AKIA[0-9A-Z]{12,}|-----BEGIN|aivencloud\.com/, linha);
    }
});
