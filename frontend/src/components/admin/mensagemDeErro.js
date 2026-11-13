/** Mensagem da API (campo "mensagem") ou um texto padrão. */
export function mensagemDeErro(erro, padrao) {
  return erro?.response?.data?.mensagem || padrao;
}
