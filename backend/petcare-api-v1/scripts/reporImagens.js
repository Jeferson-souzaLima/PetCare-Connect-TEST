/*
 * Repõe no R2 as imagens antigas que apontam para /uploads/... (arquivos que não existem mais:
 * o disco do Render é apagado a cada deploy). Por padrão só LISTA; nada é alterado sem --aplicar.
 *
 *   node --env-file=.env.teste scripts/reporImagens.js                      lista o que está quebrado
 *   node --env-file=.env.teste scripts/reporImagens.js mapa.json            simula a troca
 *   node --env-file=.env.teste scripts/reporImagens.js mapa.json --aplicar  envia ao R2 e grava
 *
 * mapa.json: { "lojas": { "6": "lojas/joao.png" }, "produtos": { "41": "produtos/bola.jpg" }, "pets": {} }
 * (chave = id da loja, da linha de produtoimagens ou do pet; caminho do arquivo JPEG/PNG a partir do mapa).
 *
 * Fora do ambiente de teste, exige também --producao: rode só depois de um backup do banco.
 * Cada registro só é gravado se ainda tiver o caminho antigo (rodar de novo não troca duas vezes).
 */
const fs = require('node:fs');
const path = require('node:path');
const { errosAmbienteTeste } = require('./ambienteTeste');

const FONTES = {
    lojas: { pasta: 'lojas', listar: "SELECT id, imagem AS caminho FROM lojas WHERE imagem LIKE '%uploads/%'", atualizar: 'UPDATE lojas SET imagem = ? WHERE id = ? AND imagem = ?' },
    produtos: { pasta: 'produtos', listar: "SELECT id, caminho FROM produtoimagens WHERE caminho LIKE '%uploads/%'", atualizar: 'UPDATE produtoimagens SET caminho = ? WHERE id = ? AND caminho = ?' },
    pets: { pasta: 'pets', listar: "SELECT id, imagem AS caminho FROM pets WHERE imagem LIKE '%uploads/%'", atualizar: 'UPDATE pets SET imagem = ? WHERE id = ? AND imagem = ?' }
};
const TIPOS = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

/** Caminho antigo, gravado em disco (não é URL do R2). */
function estaQuebrada(caminho) {
    return typeof caminho === 'string' && /^\/?uploads\//.test(caminho);
}

/** { trocar, semArquivo, sobrando } a partir dos registros quebrados e do mapa informado. */
function montarPlano(quebrados, mapa = {}) {
    const trocar = [];
    const semArquivo = [];
    const usados = new Set();
    for (const registro of quebrados) {
        const arquivo = mapa[registro.fonte]?.[registro.id];
        if (arquivo) {
            trocar.push({ ...registro, arquivo });
            usados.add(`${registro.fonte} ${registro.id}`);
        } else semArquivo.push(registro);
    }
    const sobrando = Object.entries(mapa)
        .flatMap(([fonte, ids]) => Object.keys(ids || {}).map((id) => `${fonte} ${id}`))
        .filter((chave) => !usados.has(chave));
    return { trocar, semArquivo, sobrando };
}

async function main() {
    const argumentos = process.argv.slice(2);
    const aplicar = argumentos.includes('--aplicar');
    const arquivoMapa = argumentos.find((a) => !a.startsWith('--'));
    const foraDoTeste = errosAmbienteTeste(process.env);
    if (aplicar && foraDoTeste.length && !argumentos.includes('--producao')) {
        throw new Error('Este não é o ambiente de teste. Para gravar em produção, faça um backup e repita com --producao.');
    }

    const db = require('../db');
    const consultar = (sql, valores) => new Promise((ok, falha) => db.query(sql, valores, (e, r) => (e ? falha(e) : ok(r))));
    try {
        const quebrados = [];
        for (const [fonte, { listar }] of Object.entries(FONTES)) {
            for (const linha of await consultar(listar)) if (estaQuebrada(linha.caminho)) quebrados.push({ fonte, id: linha.id, caminho: linha.caminho });
        }
        console.log(`Banco: ${process.env.DB_NAME} em ${process.env.DB_HOST}${foraDoTeste.length ? ' (NÃO é o ambiente de teste)' : ' (teste)'}`);
        console.log(`${quebrados.length} imagem(ns) apontando para /uploads:`);
        quebrados.forEach((q) => console.log(`  ${q.fonte} ${q.id}: ${q.caminho}`));
        if (!arquivoMapa) return;

        const pastaMapa = path.dirname(path.resolve(arquivoMapa));
        const plano = montarPlano(quebrados, JSON.parse(fs.readFileSync(arquivoMapa, 'utf8')));
        plano.semArquivo.forEach((q) => console.log(`Sem arquivo no mapa (fica como está): ${q.fonte} ${q.id}`));
        plano.sobrando.forEach((chave) => console.log(`No mapa, mas não está quebrado (ignorado): ${chave}`));

        const r2Storage = require('../Services/r2Storage');
        let trocadas = 0;
        for (const item of plano.trocar) {
            const origem = path.resolve(pastaMapa, item.arquivo);
            const file = { buffer: fs.readFileSync(origem), originalname: path.basename(origem), mimetype: TIPOS[path.extname(origem).toLowerCase()] };
            r2Storage.validateImage(file);
            if (!aplicar) {
                console.log(`[simulação] ${item.fonte} ${item.id}: ${item.caminho} -> ${item.arquivo}`);
                continue;
            }
            const { key, url } = await r2Storage.upload(file, FONTES[item.fonte].pasta);
            const resultado = await consultar(FONTES[item.fonte].atualizar, [url, item.id, item.caminho]);
            if (resultado.affectedRows === 1) {
                trocadas += 1;
                console.log(`${item.fonte} ${item.id}: ${url}`);
            } else {
                await r2Storage.deleteByKey(key); // o registro mudou no meio do caminho: desfaz o envio
                console.log(`${item.fonte} ${item.id}: não gravado (o registro mudou); envio desfeito.`);
            }
        }
        console.log(aplicar ? `${trocadas} imagem(ns) reposta(s).` : `Simulação: ${plano.trocar.length} seria(m) trocada(s). Repita com --aplicar para gravar.`);
    } finally {
        db.end(() => {});
    }
}

if (require.main === module) {
    main().catch((erro) => {
        console.error(erro.message);
        process.exit(1);
    });
}

module.exports = { FONTES, estaQuebrada, montarPlano };
