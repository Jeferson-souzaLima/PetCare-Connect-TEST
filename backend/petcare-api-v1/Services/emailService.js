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

async function enviarEmailRedefinicaoSenha(email, token, validadeMinutos) {
    const redefinicaoUrl = new URL('/redefinir-senha', process.env.APP_URL);
    redefinicaoUrl.searchParams.set('token', token);

    await getTransporter().sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: 'Redefinição de senha no PetCare Connect',
        text: `Para criar uma nova senha no PetCare Connect, acesse: ${redefinicaoUrl.toString()} . O link expira em ${validadeMinutos} minutos e só pode ser usado uma vez. Se você não pediu a troca de senha, ignore este e-mail: sua senha atual continua valendo.`,
        html: `<p>Olá!</p><p>Recebemos um pedido para criar uma nova senha na sua conta do PetCare Connect.</p><p><a href="${redefinicaoUrl.toString()}">Criar nova senha</a></p><p>O link expira em ${validadeMinutos} minutos e só pode ser usado uma vez.</p><p>Se você não pediu a troca de senha, ignore este e-mail: sua senha atual continua valendo.</p>`
    });
}

module.exports.enviarEmailRedefinicaoSenha = enviarEmailRedefinicaoSenha;

// ===============================
// ESTORNO RECUSADO PELO MERCADO PAGO
// ===============================

const escaparHtml = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const descreverVenda = ({ tipo, referenciaId }) => (tipo === 'pedido' ? `pedido #${referenciaId}` : `agendamento #${referenciaId}`);
const formatarReais = (valor) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/*
 * Alerta aos administradores. Sem dados do cliente: só a venda, a loja, o
 * valor e o erro do Mercado Pago. "obrigatorio" = a venda já não existe e o
 * sistema vai tentar de novo sozinho.
 */
async function enviarAlertaEstornoAdmin(destinatarios, { pagamentoId, tipo, referenciaId, valor, loja, erro, obrigatorio }) {
    if (!destinatarios.length) return;
    const venda = descreverVenda({ tipo, referenciaId });
    const situacao = obrigatorio
        ? 'A venda já foi cancelada e o dinheiro precisa voltar ao cliente. O sistema tenta de novo a cada 30 minutos.'
        : 'O cancelamento não foi feito porque o estorno falhou. O cliente ou a loja podem tentar de novo.';
    const painelUrl = new URL('/admin', process.env.APP_URL).toString();

    await getTransporter().sendMail({
        from: process.env.MAIL_FROM,
        to: destinatarios.join(', '),
        subject: `[PetCare] Estorno recusado: ${venda} (${formatarReais(valor)})`,
        text: `O Mercado Pago recusou o estorno do pagamento ${pagamentoId} (${venda}, loja ${loja || 'não identificada'}, ${formatarReais(valor)}). ${situacao} Erro: ${erro}. Acompanhe em ${painelUrl} (aba Estornos).`,
        html: `<p>O Mercado Pago recusou o estorno do pagamento <strong>${pagamentoId}</strong>.</p>`
            + `<ul><li>Venda: ${escaparHtml(venda)}</li><li>Loja: ${escaparHtml(loja || 'não identificada')}</li><li>Valor: ${formatarReais(valor)}</li><li>Erro: ${escaparHtml(erro)}</li></ul>`
            + `<p>${escaparHtml(situacao)}</p><p>Causa mais comum: a loja está sem saldo no Mercado Pago. <a href="${painelUrl}">Abrir o painel (aba Estornos)</a>.</p>`
    });
}

/** Aviso ao lojista: o estorno precisa de saldo na conta Mercado Pago da loja. */
async function enviarAvisoEstornoLoja(email, { tipo, referenciaId, valor, nomeLoja, obrigatorio }) {
    const venda = descreverVenda({ tipo, referenciaId });
    const proximoPasso = obrigatorio
        ? 'Assim que houver saldo, a devolução é feita automaticamente (tentamos a cada 30 minutos).'
        : 'Assim que houver saldo, o cancelamento pode ser feito de novo.';

    await getTransporter().sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: `Devolução pendente de ${formatarReais(valor)} no PetCare Connect`,
        text: `Olá! Não conseguimos devolver ${formatarReais(valor)} ao cliente do ${venda} da loja ${nomeLoja}. O Mercado Pago recusou a devolução, normalmente por falta de saldo na conta Mercado Pago da loja. Deixe saldo disponível na conta. ${proximoPasso}`,
        html: `<p>Olá!</p><p>Não conseguimos devolver <strong>${formatarReais(valor)}</strong> ao cliente do ${escaparHtml(venda)} da loja <strong>${escaparHtml(nomeLoja)}</strong>.</p>`
            + `<p>O Mercado Pago recusou a devolução, normalmente por falta de saldo na conta Mercado Pago da loja. Deixe saldo disponível na conta.</p><p>${escaparHtml(proximoPasso)}</p>`
    });
}

module.exports.enviarAlertaEstornoAdmin = enviarAlertaEstornoAdmin;
module.exports.enviarAvisoEstornoLoja = enviarAvisoEstornoLoja;
