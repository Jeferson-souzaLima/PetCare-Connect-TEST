export const ENDERECO_VAZIO = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
};

/** Extrai os campos de endereço de um objeto (perfil/usuário), usando "" quando ausentes. */
export function extrairEndereco(origem) {
  return {
    cep: origem?.cep || "",
    logradouro: origem?.logradouro || "",
    numero: origem?.numero || "",
    complemento: origem?.complemento || "",
    bairro: origem?.bairro || "",
    cidade: origem?.cidade || "",
    uf: origem?.uf || "",
  };
}

/** Indica se todos os campos obrigatórios do endereço estão preenchidos. */
export function enderecoEstaCompleto(endereco) {
  return Boolean(
    endereco?.cep &&
      endereco?.logradouro &&
      endereco?.numero &&
      endereco?.bairro &&
      endereco?.cidade &&
      endereco?.uf
  );
}

/** Remove espaços, deixa só dígitos no CEP e UF em maiúsculas. */
export function normalizarEndereco(endereco) {
  return {
    ...endereco,
    cep: endereco.cep.replace(/\D/g, ""),
    logradouro: endereco.logradouro.trim(),
    numero: endereco.numero.trim(),
    complemento: endereco.complemento.trim(),
    bairro: endereco.bairro.trim(),
    cidade: endereco.cidade.trim(),
    uf: endereco.uf.trim().toUpperCase(),
  };
}

/**
 * Valida um endereço já normalizado.
 * Retorna a mensagem do primeiro problema encontrado ou "" quando válido.
 */
export function validarEnderecoNormalizado(endereco) {
  if (!/^\d{8}$/.test(endereco.cep)) return "Informe um CEP válido.";
  if (!endereco.logradouro) return "Informe o endereço.";
  if (!endereco.numero) return "Informe o número.";
  if (!endereco.bairro) return "Informe o bairro.";
  if (!endereco.cidade) return "Informe a cidade.";
  if (!/^[A-Z]{2}$/.test(endereco.uf)) return "Informe uma UF válida.";
  return "";
}
