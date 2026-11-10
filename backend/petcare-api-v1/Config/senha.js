/*
 * Custo do bcrypt para novas senhas. Senhas já gravadas com outro custo
 * continuam válidas: o custo fica registrado no próprio hash.
 */
module.exports = { CUSTO_BCRYPT: 12 };
