const assert = require('node:assert/strict');
const test = require('node:test');
const net = require('node:net');

/*
 * A6: o envio do e-mail de confirmação é testado de ponta a ponta com a
 * versão atual do nodemailer, contra um servidor SMTP mínimo local
 * (EHLO, AUTH PLAIN, MAIL, RCPT e DATA). Nada sai da máquina.
 */
function servidorSmtp() {
    const mensagens = [];
    const server = net.createServer((socket) => {
        let lendoDados = false;
        let dados = '';
        let atual = {};
        let buffer = '';
        const responder = (linha) => socket.write(`${linha}\r\n`);
        responder('220 localhost ESMTP teste');

        socket.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
            let fim;
            while ((fim = buffer.indexOf('\r\n')) >= 0) {
                const linha = buffer.slice(0, fim);
                buffer = buffer.slice(fim + 2);

                if (lendoDados) {
                    if (linha === '.') {
                        lendoDados = false;
                        mensagens.push({ ...atual, dados });
                        dados = '';
                        responder('250 OK: mensagem recebida');
                    } else {
                        dados += `${linha.startsWith('..') ? linha.slice(1) : linha}\n`;
                    }
                    continue;
                }

                const comando = linha.toUpperCase();
                if (comando.startsWith('EHLO') || comando.startsWith('HELO')) {
                    responder('250-localhost');
                    responder('250 AUTH PLAIN LOGIN');
                } else if (comando.startsWith('AUTH PLAIN')) {
                    const [, usuario, senha] = Buffer.from(linha.split(' ')[2] || '', 'base64').toString('utf8').split('\0');
                    atual = { usuario, senha };
                    responder('235 Autenticado');
                } else if (comando.startsWith('MAIL FROM')) {
                    atual.de = linha;
                    responder('250 OK');
                } else if (comando.startsWith('RCPT TO')) {
                    atual.para = linha;
                    responder('250 OK');
                } else if (comando === 'DATA') {
                    lendoDados = true;
                    responder('354 Pode enviar');
                } else if (comando === 'QUIT') {
                    responder('221 Tchau');
                    socket.end();
                } else {
                    responder('250 OK');
                }
            }
        });
    });
    return { server, mensagens };
}

test('enviarEmailConfirmacao entrega pelo SMTP configurado, com o link de confirmação', async () => {
    const { server, mensagens } = servidorSmtp();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    Object.assign(process.env, {
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: String(server.address().port),
        SMTP_SECURE: 'false',
        SMTP_USER: 'usuario-smtp',
        SMTP_PASS: 'senha-smtp',
        MAIL_FROM: 'PetCare Connect <nao-responda@petcare.test>',
        APP_URL: 'https://app.petcare.test'
    });

    try {
        const { enviarEmailConfirmacao } = require('../Services/emailService');
        await enviarEmailConfirmacao('cliente@exemplo.com', 'a'.repeat(64));

        assert.equal(mensagens.length, 1);
        const [mensagem] = mensagens;
        assert.equal(mensagem.usuario, 'usuario-smtp');
        assert.equal(mensagem.senha, 'senha-smtp');
        assert.match(mensagem.de, /nao-responda@petcare\.test/);
        assert.match(mensagem.para, /<cliente@exemplo\.com>/);
        assert.match(mensagem.dados, /^Subject: Confirme seu e-mail no PetCare Connect/m);
        const corpo = mensagem.dados.replace(/=\n/g, '').replace(/=3D/g, '=');
        assert.match(corpo, new RegExp(`https://app\\.petcare\\.test/verificar-email\\?token=${'a'.repeat(64)}`));
    } finally {
        server.close();
    }
});

test('configuração de e-mail incompleta falha sem tentar enviar', async () => {
    const salvo = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;
    try {
        const { enviarEmailConfirmacao } = require('../Services/emailService');
        await assert.rejects(enviarEmailConfirmacao('cliente@exemplo.com', 'b'.repeat(64)), /SMTP_HOST/);
    } finally {
        if (salvo !== undefined) process.env.SMTP_HOST = salvo;
    }
});
