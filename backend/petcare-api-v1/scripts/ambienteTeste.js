/*
 * Trava dos scripts do ambiente de teste (verificação do banco local e seed de demonstração).
 * Só libera com PETCARE_AMBIENTE=teste, MySQL local, banco "…teste…" e bucket R2 "…-teste".
 * Qualquer variável apontando para produção bloqueia a execução antes de abrir conexão.
 */
const HOSTS_LOCAIS = ['127.0.0.1', 'localhost', '::1'];

function errosAmbienteTeste(env) {
    const erros = [];
    if (env.PETCARE_AMBIENTE !== 'teste') erros.push('PETCARE_AMBIENTE precisa ser "teste".');
    if (env.NODE_ENV === 'production') erros.push('NODE_ENV=production não é permitido aqui.');
    if (!HOSTS_LOCAIS.includes(String(env.DB_HOST || '').trim().toLowerCase())) {
        erros.push('DB_HOST precisa ser o MySQL local (127.0.0.1 ou localhost).');
    }
    if (!/teste/i.test(String(env.DB_NAME || ''))) erros.push('DB_NAME precisa ser o banco de teste (com "teste" no nome).');
    if (env.R2_BUCKET_NAME && !/-teste$/.test(env.R2_BUCKET_NAME.trim())) {
        erros.push('R2_BUCKET_NAME precisa ser o bucket de teste (terminado em "-teste").');
    }
    return erros;
}

function exigirAmbienteTeste(env = process.env) {
    const erros = errosAmbienteTeste(env);
    if (!erros.length) return;
    const erro = new Error(`Bloqueado: este script só roda no ambiente de teste local.\n- ${erros.join('\n- ')}`);
    erro.code = 'AMBIENTE_NAO_E_TESTE';
    throw erro;
}

module.exports = { errosAmbienteTeste, exigirAmbienteTeste };
