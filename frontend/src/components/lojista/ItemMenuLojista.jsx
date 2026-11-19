import { NavLink } from "react-router-dom";
import { INICIO_LOJISTA } from "./itensMenuLojista";

const BASE = "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] font-medium";

export function SeloEmBreve() {
  return (
    <span className="ml-auto whitespace-nowrap rounded-pc-pill bg-pc-verde-100 px-2 py-0.5 text-[11px] font-semibold text-pc-verde-700">
      Em breve
    </span>
  );
}

/** Item do menu do lojista: link com estado ativo, contador de pendências ou "Em breve". */
export function ItemMenuLojista({ item, pendencias, aoNavegar }) {
  const Icone = item.icone;
  const total = item.contador ? Number(pendencias?.[item.contador] || 0) : 0;

  if (item.emBreve) {
    return (
      <div aria-disabled="true" className={`${BASE} cursor-default text-gray-400`}>
        <Icone aria-hidden="true" className="h-5 w-5 shrink-0" />
        <span>{item.rotulo}</span>
        <SeloEmBreve />
      </div>
    );
  }

  return (
    <NavLink
      to={item.destino}
      end={item.destino === INICIO_LOJISTA}
      onClick={aoNavegar}
      className={({ isActive }) =>
        `${BASE} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60 ${
          isActive ? "bg-[#17790F] text-white shadow-sm" : "text-pc-texto hover:bg-pc-verde-100"
        }`
      }
    >
      <Icone aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span>{item.rotulo}</span>
      {total > 0 && (
        <span className="ml-auto flex h-6 min-w-[24px] items-center justify-center rounded-pc-pill bg-[#086E08] px-1.5 text-xs font-bold text-white">
          {total}
          <span className="sr-only"> pendente(s)</span>
        </span>
      )}
    </NavLink>
  );
}
