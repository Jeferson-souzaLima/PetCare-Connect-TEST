const nodemailer = require('nodemailer');

function getTransporter() {
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'APP_URL'];
    const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

    if (missingEnvVars.length > 0) {
        throw new Error(`Configuração de e-mail ausente: ${missingEnvVars.join(', ')}`);
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
}

async function enviarEmailConfirmacao(email, token) {
    const confirmationUrl = new URL('/verificar-email', process.env.APP_URL);
    confirmationUrl.searchParams.set('token', token);

    await getTransporter().sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: 'Confirme seu e-mail no PetCare Connect',
        text: `Confirme seu e-mail acessando: ${confirmationUrl.toString()}`,
        html: `<p>Olá!</p><p>Confirme seu e-mail para ativar sua conta no PetCare Connect.</p><p><a href="${confirmationUrl.toString()}">Confirmar meu e-mail</a></p><p>Este link expira em 24 horas.</p>`
    });
}

module.exports = { enviarEmailConfirmacao };

/*
 * Aviso enviado quando alguém tenta cadastrar um e-mail que já tem conta
 * confirmada. A API responde ao cadastro como se fosse novo (não revela
 * que o e-mail existe); só o dono do e-mail fica sabendo da tentativa.
 */
async function enviarAvisoCadastroExistente(email) {
    const loginUrl = new URL('/login', process.env.APP_URL);

    await getTransporter().sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: 'Tentativa de cadastro com o seu e-mail no PetCare Connect',
        text: `Alguém tentou criar uma conta no PetCare Connect com este e-mail, mas você já tem uma conta. Se foi você, entre em ${loginUrl.toString()} com a sua senha. Se não foi, pode ignorar esta mensagem: nada foi alterado na sua conta.`,
        html: `<p>Olá!</p><p>Alguém tentou criar uma conta no PetCare Connect com este e-mail, mas você já tem uma conta.</p><p>Se foi você, <a href="${loginUrl.toString()}">entre com a sua senha</a>.</p><p>Se não foi, pode ignorar esta mensagem: nada foi alterado na sua conta.</p>`
    });
}

module.exports.enviarAvisoCadastroExistente = enviarAvisoCadastroExistente;
