import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { ItemMenuLojista } from "./ItemMenuLojista";
import { INICIO_LOJISTA, ITENS_BARRA_INFERIOR, ITENS_CONTA, ITENS_PRINCIPAIS } from "./itensMenuLojista";

const FOCO = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60";
const ITENS_DA_BARRA = ITENS_BARRA_INFERIOR.map((id) => ITENS_PRINCIPAIS.find((item) => item.id === id));
const ITENS_DO_MAIS = [...ITENS_PRINCIPAIS.filter((item) => !ITENS_BARRA_INFERIOR.includes(item.id)), ...ITENS_CONTA];
const ROTULO_CURTO = { painel: "Início", agenda: "Agenda" };

function PainelMais({ pendencias, aoFechar, aoSair }) {
  const refFechar = useRef(null);

  useEffect(() => {
    refFechar.current?.focus();
    const fecharComEsc = (evento) => { if (evento.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", fecharComEsc);
    return () => document.removeEventListener("keydown", fecharComEsc);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="titulo-mais-lojista">
      <button type="button" aria-label="Fechar menu" onClick={aoFechar} className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="titulo-mais-lojista" className="text-lg font-bold text-pc-verde-900">Mais opções</h2>
          <button ref={refFechar} type="button" aria-label="Fechar" onClick={aoFechar} className={`flex h-11 w-11 items-center justify-center rounded-full hover:bg-pc-fundo ${FOCO}`}>
            <X aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
        <ul className="space-y-1">
          {ITENS_DO_MAIS.map((item) => (
            <li key={item.id}><ItemMenuLojista item={item} pendencias={pendencias} aoNavegar={aoFechar} /></li>
          ))}
          <li>
            <button type="button" onClick={() => { aoFechar(); aoSair(); }} className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-red-700 hover:bg-red-50 ${FOCO}`}>
              <LogOut aria-hidden="true" className="h-5 w-5" /> Sair
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Barra inferior da área do lojista (celular e tablet). */
export function BarraInferiorLojista({ pendencias, aoSair }) {
  const [maisAberto, setMaisAberto] = useState(false);
  const fecharMais = useCallback(() => setMaisAberto(false), []);

  return (
    <>
      <nav aria-label="Menu do lojista" className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 lg:hidden">
        <ul className="flex items-stretch justify-between rounded-[28px] bg-white p-1.5 shadow-[0_8px_30px_rgba(2,63,30,0.18)]">
          {ITENS_DA_BARRA.map((item) => {
            const Icone = item.icone;
            return (
              <li key={item.id} className="flex-1">
                <NavLink
                  to={item.destino}
                  end={item.destino === INICIO_LOJISTA}
                  className={({ isActive }) =>
                    `flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-[22px] text-xs font-medium ${FOCO} ${
                      isActive ? "bg-pc-verde-700 text-white" : "text-pc-texto-suave hover:text-pc-verde-700"
                    }`
                  }
                >
                  <Icone aria-hidden="true" className="h-6 w-6" />
                  {ROTULO_CURTO[item.id] || item.rotulo}
                </NavLink>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={maisAberto}
              onClick={() => setMaisAberto(true)}
              className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-[22px] text-xs font-medium text-pc-texto-suave hover:text-pc-verde-700 ${FOCO}`}
            >
              <Menu aria-hidden="true" className="h-6 w-6" />
              Mais
            </button>
          </li>
        </ul>
      </nav>
      {maisAberto && <PainelMais pendencias={pendencias} aoFechar={fecharMais} aoSair={aoSair} />}
    </>
  );
}
