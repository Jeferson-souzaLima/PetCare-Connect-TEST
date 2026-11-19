import { Link } from "react-router-dom";
import { CirclePlus, Megaphone, Scissors, ShoppingCart, Zap } from "lucide-react";

const ACOES = [
  { rotulo: "Cadastrar Produto", icone: CirclePlus, destino: "/lojista/produtos" },
  { rotulo: "Cadastrar Serviço", icone: Scissors, destino: "/lojista/servicos" },
  { rotulo: "Comprar de Distribuidores", icone: ShoppingCart, emBreve: true },
  { rotulo: "Criar Promoção", icone: Megaphone, emBreve: true },
];

const CARTAO = "flex h-full min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white px-2 py-3 text-center text-sm font-medium shadow-sm";

export function AcoesRapidas() {
  return (
    <section aria-labelledby="titulo-acoes-rapidas" className="rounded-pc-card bg-white p-4 shadow-pc-card sm:p-6">
      <h2 id="titulo-acoes-rapidas" className="mb-4 flex items-center gap-2 text-lg font-bold text-pc-texto sm:text-xl">
        <Zap aria-hidden="true" className="h-6 w-6 fill-pc-verde-700 text-pc-verde-700" />
        Ações Rápidas
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACOES.map(({ rotulo, icone: Icone, destino, emBreve }) => (
          <li key={rotulo}>
            {emBreve ? (
              <div aria-disabled="true" className={`${CARTAO} cursor-default text-gray-400`}>
                <Icone aria-hidden="true" className="h-7 w-7" />
                {rotulo}
                <span className="rounded-pc-pill bg-pc-verde-100 px-2 py-0.5 text-[11px] font-semibold text-pc-verde-700">Em breve</span>
              </div>
            ) : (
              <Link
                to={destino}
                className={`${CARTAO} text-pc-texto hover:border-pc-verde-700/30 hover:bg-pc-verde-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60`}
              >
                <Icone aria-hidden="true" className="h-7 w-7 text-pc-verde-700" />
                {rotulo}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
