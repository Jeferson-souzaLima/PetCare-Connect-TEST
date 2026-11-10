const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const EMAIL_TAMANHO_MAXIMO = 100;
const SENHA_TAMANHO_MINIMO = 8;

const normalizarEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

const emailValido = (email) => email.length <= EMAIL_TAMANHO_MAXIMO && EMAIL_REGEX.test(email);

/** Mensagem de erro da senha para o usuário, ou null se a senha for aceita. */
function erroDaSenha(senha, confirmacaoSenha) {
    if (typeof senha !== 'string' || senha.length < SENHA_TAMANHO_MINIMO) {
        return `A senha deve ter pelo menos ${SENHA_TAMANHO_MINIMO} caracteres.`;
    }
    if (senha !== confirmacaoSenha) {
        return 'A confirmação de senha não confere.';
    }
    return null;
}

module.exports = { EMAIL_REGEX, normalizarEmail, emailValido, erroDaSenha };
