import { FaCog, FaUser } from "react-icons/fa";

/** Faixa verde com saudação, e-mail e atalho para as configurações da conta. */
export default function PerfilCabecalho({ usuario, showUserData, onAlternarDados }) {
  return (
    <section className="bg-gradient-to-br from-[#0E5617] to-[#16752A] rounded-3xl shadow-lg overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">

          <div className="flex items-center gap-4 min-w-0">

            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <FaUser className="text-3xl md:text-4xl text-white" />
            </div>

            <div className="min-w-0">
              <p className="text-green-100 text-sm">
                Minha conta
              </p>

              <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
                Olá, {usuario.nome}!
              </h1>

              <p className="text-green-100 text-sm mt-1 truncate">
                {usuario.email}
              </p>
            </div>

          </div>

          <button
            type="button"
            aria-label="Configurações da conta"
            title="Configurações da conta"
            onClick={onAlternarDados}
            className={`
              w-11 h-11 md:w-12 md:h-12
              rounded-full
              flex items-center justify-center
              shrink-0
              transition-all duration-300
              ${
                showUserData
                  ? "bg-white text-[#0E5617] rotate-90"
                  : "bg-white/15 text-white hover:bg-white/25"
              }
            `}
          >
            <FaCog />
          </button>

        </div>
      </div>
    </section>
  );
}
