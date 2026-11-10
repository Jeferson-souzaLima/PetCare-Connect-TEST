import { FaEnvelope, FaPen, FaPhone, FaUser } from "react-icons/fa";

const camposPerfil = [
  {
    campo: "nome",
    icon: <FaUser />,
    label: "Nome"
  },
  {
    campo: "email",
    icon: <FaEnvelope />,
    label: "E-mail",
    bloqueado: true
  },
  {
    campo: "telefone",
    icon: <FaPhone />,
    label: "Telefone"
  }
];

/** Lista os dados pessoais com edição campo a campo (e-mail bloqueado). */
export default function DadosPessoais({
  usuario,
  campoEditando,
  valorEditando,
  setValorEditando,
  iniciarEdicao,
  cancelarEdicao,
  salvarCampo,
  salvandoPerfil,
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <FaUser className="text-[#0E5617]" />

        <h3 className="font-bold text-gray-800">
          Dados pessoais
        </h3>
      </div>

      <div className="space-y-2">

        {camposPerfil.map((item) => {
          const estaEditando =
            campoEditando === item.campo;

          const valorExibido =
            usuario[item.campo] ||
            "Não informado";

          return (
            <div
              key={item.campo}
              className="rounded-xl border border-gray-100 bg-gray-50 p-3 md:p-4"
            >
              {!estaEditando ? (
                <div className="flex items-center justify-between gap-4">

                  <div className="flex items-center gap-3 min-w-0">

                    <div className="w-9 h-9 rounded-lg bg-white text-[#0E5617] flex items-center justify-center shrink-0 shadow-sm">
                      {item.icon}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">
                        {item.label}
                      </p>

                      <p className="font-medium text-gray-800 truncate">
                        {valorExibido}
                      </p>
                    </div>

                  </div>

                  {item.bloqueado ? (
                    <span
                      className="text-xs text-gray-400 px-2"
                      title="O e-mail não pode ser alterado por aqui."
                    >
                      🔒
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        iniciarEdicao(item.campo)
                      }
                      className="w-9 h-9 rounded-lg bg-white text-[#0E5617] flex items-center justify-center shadow-sm hover:bg-green-50 transition"
                      aria-label={`Editar ${item.label}`}
                    >
                      <FaPen className="text-sm" />
                    </button>
                  )}

                </div>
              ) : (
                <div className="space-y-3">

                  <div className="flex items-center gap-2 text-[#0E5617]">
                    {item.icon}

                    <span className="text-sm font-semibold">
                      Editando {item.label}
                    </span>
                  </div>

                  <input
                    type={
                      item.campo === "telefone"
                        ? "tel"
                        : "text"
                    }
                    value={valorEditando}
                    onChange={(e) =>
                      setValorEditando(
                        e.target.value
                      )
                    }
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    placeholder={`Digite seu ${item.label.toLowerCase()}`}
                  />

                  <div className="flex justify-end gap-2">

                    <button
                      type="button"
                      onClick={cancelarEdicao}
                      disabled={salvandoPerfil}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={salvarCampo}
                      disabled={salvandoPerfil}
                      className="px-4 py-2 rounded-xl bg-[#0E5617] text-white hover:bg-[#0B4312] transition disabled:opacity-50"
                    >
                      {salvandoPerfil
                        ? "Salvando..."
                        : "Salvar"}
                    </button>

                  </div>

                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
