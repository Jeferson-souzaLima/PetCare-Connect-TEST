const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { comServidor, simularBanco } = require('./apoioAcesso');

process.env.MP_WEBHOOK_SECRET = 'segredo-somente-teste';

const db = require('../db');
const MercadoPagoService = require('../Services/mercadoPagoService');
const pagamentosRoutes = require('../Routes/pagamentos');

const DADOS_PESSOAIS = ['pagador@exemplo.com', '12345678909', 'Fulano', 'Rua das Flores'];

function capturarConsole(t) {
    const linhas = [];
    for (const nivel of ['log', 'info', 'warn', 'error', 'debug']) {
        t.mock.method(console, nivel, (...args) => linhas.push(args));
    }
    return () => JSON.stringify(linhas, (_k, v) => (v instanceof Error ? { message: v.message, stack: v.stack } : v));
}

function assinar(dataId, requestId) {
    const ts = String(Math.floor(Date.now() / 1000));
    const manifesto = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifesto).digest('hex');
    return { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId };
}

test('webhook do Mercado Pago não registra CPF, e-mail nem nome do pagador', async (t) => {
    const lerLogs = capturarConsole(t);
    t.mock.method(MercadoPagoService, 'buscarPagamento', async () => ({
        id: 999,
        status: 'approved',
        external_reference: 'agendamento:8',
        transaction_amount: 40,
        payer: {
            email: 'pagador@exemplo.com',
            first_name: 'Fulano',
            identification: { type: 'CPF', number: '12345678909' },
            address: { street_name: 'Rua das Flores' }
        }
    }));
    simularBanco(t, db, [
        [/FROM pagamentos\s+WHERE tipo_referencia/, [{ id: 6, tipo_referencia: 'agendamento', referencia_id: 8, status: 'pendente', valor: 40, observacoes: 'Rua das Flores' }]],
        [/./, { affectedRows: 1 }]
    ]);

    const status = await comServidor('/pagamentos', pagamentosRoutes, async (base) => {
        const r = await fetch(`${base}/pagamentos/webhook?data.id=999&type=payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...assinar('999', 'req-1') },
            body: JSON.stringify({ type: 'payment', action: 'payment.updated', data: { id: '999' } })
        });
        return r.status;
    });
    await new Promise((r) => setImmediate(r));

    assert.equal(status, 200);
    const logs = lerLogs();
    assert.ok(logs.length > 2, 'o webhook deve continuar registrando o andamento');
    for (const dado of DADOS_PESSOAIS) {
        assert.equal(logs.includes(dado), false, `log contém "${dado}": ${logs}`);
    }
});

test('backend não tem mais logs de depuração com endereço, coordenadas ou dados da agenda', () => {
    const raiz = path.join(__dirname, '..');
    const proibidos = [
        /console\.log\(\s*['"]Endereço recebido/,
        /console\.log\(\s*['"]Tentativa \d/,
        /console\.log\(\s*['"]Coordenadas (recebidas|encontradas)/,
        /console\.log\(\s*['"]DEBUG/,
        /console\.log\(\s*['"](Data|DiaSemana|Config|Disponibilidade|Bloqueios|Agendamentos|Hor.rios gerados):/,
        /console\.log\(\s*['"]Pagamento (retornado pelo Mercado Pago|interno encontrado)/
    ];
    const achados = [];
    for (const pasta of ['Controllers', 'Services', 'Models', 'Routes']) {
        for (const arquivo of fs.readdirSync(path.join(raiz, pasta)).filter((a) => a.endsWith('.js'))) {
            const texto = fs.readFileSync(path.join(raiz, pasta, arquivo), 'utf8').replace(/\(\s*\n\s*/g, '(');
            for (const re of proibidos) if (re.test(texto)) achados.push(`${pasta}/${arquivo}: ${re}`);
        }
    }
    assert.deepEqual(achados, []);
});

test('backend não registra o objeto de erro cru (do MySQL ou do SMTP) com console', () => {
    // Erros do mysql2 trazem o SQL com os valores; os do nodemailer, o e-mail do destinatário.
    // Devem passar por registrarErroInterno, que guarda só o código.
    const raiz = path.join(__dirname, '..');
    const cru = /console\.(error|warn|log)\([^)]*?,\s*(err|erro|error|emailErr|saveError|storageError|\w+Err)\s*\)/;
    const achados = [];
    for (const pasta of ['Controllers', 'Services', 'Models', 'Routes', 'middlewares']) {
        for (const arquivo of fs.readdirSync(path.join(raiz, pasta)).filter((a) => a.endsWith('.js'))) {
            const texto = fs.readFileSync(path.join(raiz, pasta, arquivo), 'utf8').replace(/\s*\n\s*/g, ' ');
            const m = texto.match(new RegExp(cru, 'g'));
            if (m) achados.push(...m.map((x) => `${pasta}/${arquivo}: ${x}`));
            if (/console\.error\(\s*err\s*\)/.test(texto)) achados.push(`${pasta}/${arquivo}: console.error(err)`);
        }
    }
    const textoApp = fs.readFileSync(path.join(raiz, 'app.js'), 'utf8');
    if (cru.test(textoApp)) achados.push('app.js');
    assert.deepEqual(achados, []);
});

test('erro de SMTP no log guarda só os códigos, sem o e-mail do destinatário', () => {
    const { resumirErro } = require('../utils/erroInterno');
    // Formato de erro do nodemailer quando o servidor recusa o destinatário.
    const erro = new Error("Can't send mail - all recipients were rejected: 550 5.1.1 <fulano@exemplo.com>: Recipient address rejected");
    erro.code = 'EENVELOPE';
    erro.command = 'RCPT TO';
    erro.responseCode = 550;
    erro.response = '550 5.1.1 <fulano@exemplo.com>: Recipient address rejected';
    erro.rejected = ['fulano@exemplo.com'];
    const resumo = resumirErro(erro);
    assert.equal(JSON.stringify(resumo).includes('fulano@exemplo.com'), false, JSON.stringify(resumo));
    assert.deepEqual(resumo, { nome: 'Error', codigo: 'EENVELOPE', comando: 'RCPT TO', codigoResposta: 550 });
});
