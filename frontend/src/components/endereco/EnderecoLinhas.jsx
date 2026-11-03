/** Exibe um endereço em três linhas: rua/número/complemento, bairro/cidade/UF e CEP. */
export default function EnderecoLinhas({ endereco }) {
  return (
    <>
      <p className="mt-1 text-sm text-gray-700">
        {endereco.logradouro}, {endereco.numero}
        {endereco.complemento
          ? ` - ${endereco.complemento}`
          : ""}
      </p>

      <p className="text-sm text-gray-600">
        {endereco.bairro} · {endereco.cidade} - {endereco.uf}
      </p>

      <p className="text-sm text-gray-600">
        CEP: {endereco.cep}
      </p>
    </>
  );
}
