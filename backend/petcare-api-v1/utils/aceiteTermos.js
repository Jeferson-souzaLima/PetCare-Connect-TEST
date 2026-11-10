const { VERSAO_TERMOS, VERSAO_PRIVACIDADE } = require('../Config/documentosLegais');

const MENSAGEM_ACEITE_OBRIGATORIO =
    'Para criar a conta, aceite os Termos de Uso e declare ciência da Política de Privacidade.';

/** O aceite precisa ser o booleano true (marcado na tela), não texto ou ausente. */
function aceitouTermos(body) {
    return body?.aceiteTermos === true;
}

/*
 * Colunas e valores do aceite para o INSERT em usuarios. A data vem do
 * servidor (NOW()) e as versões, da configuração: nada disso é aceito do cliente.
 * Requer a migração database/migrations/20261103_aceite_termos_privacidade.sql.
 */
const COLUNAS_ACEITE = 'termos_aceitos_em, termos_versao, privacidade_versao';
const VALORES_ACEITE_SQL = 'NOW(), ?, ?';
const valoresAceite = () => [VERSAO_TERMOS, VERSAO_PRIVACIDADE];

module.exports = { MENSAGEM_ACEITE_OBRIGATORIO, aceitouTermos, COLUNAS_ACEITE, VALORES_ACEITE_SQL, valoresAceite };
