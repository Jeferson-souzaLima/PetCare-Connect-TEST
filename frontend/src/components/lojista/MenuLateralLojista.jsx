import { Crown } from "lucide-react";
import { ItemMenuLojista } from "./ItemMenuLojista";
import { ITENS_CONTA, ITENS_PRINCIPAIS } from "./itensMenuLojista";

function CartaoPlano() {
  return (
    <div className="rounded-pc-card bg-[#E2F2E4] p-4">
      <div className="flex items-start gap-3">
        <Crown aria-hidden="true" className="h-8 w-8 shrink-0 text-pc-verde-900" />
        <div>
          <p className="font-bold text-pc-texto">Plano Pro</p>
          <p className="text-sm text-pc-texto-suave">Mais recursos para sua loja</p>
        </div>
      </div>
      <button
        type="button"
        disabled
        className="mt-3 w-full cursor-not-allowed rounded-pc-pill border-2 border-pc-verde-900/40 py-2 text-sm font-bold text-pc-verde-900/60"
      >
        Em breve
      </button>
    </div>
  );
}

/** Menu lateral da área do lojista (telas grandes). */
export function MenuLateralLojista({ pendencias }) {
  return (
    <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[248px] shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-[#FBFBFC] px-4 py-5 lg:flex">
      <nav aria-label="Menu do lojista" className="flex flex-1 flex-col">
        <ul className="space-y-1">
          {ITENS_PRINCIPAIS.map((item) => (
            <li key={item.id}><ItemMenuLojista item={item} pendencias={pendencias} /></li>
          ))}
        </ul>
        <hr className="my-4 border-gray-200" />
        <ul className="space-y-1">
          {ITENS_CONTA.map((item) => (
            <li key={item.id}><ItemMenuLojista item={item} pendencias={pendencias} /></li>
          ))}
        </ul>
      </nav>
      <div className="mt-6"><CartaoPlano /></div>
    </aside>
  );
}
