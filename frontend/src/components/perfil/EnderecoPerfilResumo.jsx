import { FaCheckCircle, FaMapPin } from "react-icons/fa";

/** Exibe o endereço salvo no perfil (ou aviso de que não há endereço). */
export default function EnderecoPerfilResumo({ usuario }) {
  const enderecoTemDados = Boolean(
    usuario.logradouro ||
    usuario.bairro ||
    usuario.cidade ||
    usuario.cep
  );

  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">

      {enderecoTemDados ? (
        <div className="space-y-2 text-sm">

          {usuario.logradouro && (
            <p className="font-medium text-gray-800">
              {usuario.logradouro}
              {usuario.numero
                ? `, ${usuario.numero}`
                : ""}
            </p>
          )}

          {usuario.complemento && (
            <p className="text-gray-600">
              {usuario.complemento}
            </p>
          )}

          {usuario.bairro && (
            <p className="text-gray-600">
              {usuario.bairro}
            </p>
          )}

          {usuario.cidade && (
            <p className="text-gray-600">
              {usuario.cidade}
              {usuario.uf
                ? ` - ${usuario.uf}`
                : ""}
            </p>
          )}

          {usuario.cep && (
            <p className="text-gray-500">
              CEP: {usuario.cep}
            </p>
          )}

          {usuario.latitude != null &&
            usuario.longitude != null && (
              <div className="flex items-center gap-2 text-xs text-green-700 pt-2">
                <FaCheckCircle />
                <span>
                  Localização definida
                </span>
              </div>
            )}

        </div>
      ) : (
        <div className="text-center py-4">

          <FaMapPin className="mx-auto text-2xl text-gray-300 mb-2" />

          <p className="font-medium text-gray-700">
            Nenhum endereço cadastrado
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Cadastre seu endereço para facilitar suas entregas.
          </p>

        </div>
      )}

    </div>
  );
}
