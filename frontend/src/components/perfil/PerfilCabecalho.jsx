import { useState } from "react";
import { PawPrint, Settings } from "lucide-react";
import { primeiroNome } from "@/utils/perfil";
import FotoPerfil from "./FotoPerfil";

const ILUSTRACAO_PETS = "/midia/site/lojista/boas-vindas-pets.png";

/**
 * Cartão verde "Minha conta" (foto ou iniciais com o lápis para trocar, saudação e e-mail).
 * Celular: a engrenagem abre `children` (as configurações) por baixo do cartão, como uma peça só.
 * Desktop: botão "Editar perfil" e a ilustração dos pets à direita.
 */
export default function PerfilCabecalho({ usuario, desktop, configAberta, onConfig, children }) {
  const nome = desktop ? usuario.nome : primeiroNome(usuario.nome);
  const [erroFoto, setErroFoto] = useState(null);

  return (
    <section aria-label="Minha conta" className="overflow-hidden rounded-[28px] bg-white shadow-pc-card">
      <div className="relative overflow-hidden bg-gradient-to-br from-pc-verde-900 to-pc-verde-700 px-5 py-5 text-white md:px-8 md:py-6">
        {desktop ? (
          <img
            src={ILUSTRACAO_PETS}
            alt=""
            className="pointer-events-none absolute inset-y-0 right-0 h-full w-auto object-cover [mask-image:linear-gradient(to_right,transparent,black_35%)]"
          />
        ) : (
          <PawPrint aria-hidden="true" className="pointer-events-none absolute -bottom-4 right-16 h-24 w-24 rotate-[-18deg] text-white/10" />
        )}

        <div className="relative flex items-center gap-4 md:gap-6">
          <FotoPerfil usuario={usuario} onErro={setErroFoto} />

          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/80">Minha conta</p>
            <h1 className="truncate text-2xl font-bold md:text-3xl">Olá, {nome}!</h1>
            <p className="mt-0.5 truncate text-sm text-white/80">{usuario.email}</p>
            {erroFoto && (
              <p role="alert" className="mt-1.5 inline-block rounded-lg bg-red-600/90 px-2 py-1 text-xs font-medium text-white">
                {erroFoto}
              </p>
            )}
          </div>

          {desktop ? (
            <button
              type="button"
              onClick={onConfig}
              className="relative mr-[min(14rem,22%)] inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-pc-pill bg-white/15 px-5 text-sm font-semibold backdrop-blur-sm hover:bg-white/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60"
            >
              <Settings size={18} aria-hidden="true" />
              Editar perfil
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfig}
              aria-expanded={configAberta}
              aria-controls="configuracoes-conta"
              aria-label="Configurações da conta"
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-[background-color,color] duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60 ${
                configAberta ? "bg-white text-pc-verde-900" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <Settings size={24} aria-hidden="true" className={`transition-transform duration-300 ${configAberta ? "rotate-90" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {children && (
        // Gaveta: anima a altura de 0 até o conteúdo (grid 0fr → 1fr); fechada, fica fora do foco.
        <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${configAberta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="min-h-0 overflow-hidden" {...(configAberta ? {} : { inert: "", "aria-hidden": true })}>
            {children}
          </div>
        </div>
      )}
    </section>
  );
}
