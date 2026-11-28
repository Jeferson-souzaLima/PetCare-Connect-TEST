import { Link } from "react-router-dom";

const ICONES = "/midia/site/home";

// Atalhos enquanto produtos não têm categoria no banco (ver spec, seção 9).
const ATALHOS = [
  { rotulo: "Produtos", destino: "/produtos", icone: `${ICONES}/categoria-produtos.webp` },
  { rotulo: "Serviços", destino: "/servicos", icone: `${ICONES}/categoria-servicos.webp` },
  { rotulo: "Lojas", destino: "/lojas", icone: `${ICONES}/categoria-lojas.webp` },
  { rotulo: "Clínicas", destino: "/busca?q=veterin%C3%A1ria", icone: `${ICONES}/categoria-clinicas.webp` },
];

export function AtalhosCategorias() {
  return (
    <nav aria-label="Categorias">
      <ul className="grid grid-cols-4 gap-2 sm:gap-3">
        {ATALHOS.map(({ rotulo, destino, icone }) => (
          <li key={rotulo}>
            <Link
              to={destino}
              className="flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-pc-card bg-white p-2 text-center text-xs font-medium text-pc-texto shadow-pc-card transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40 sm:text-sm"
            >
              <img src={icone} alt="" width="44" height="44" decoding="async" className="h-11 w-11 object-contain sm:h-12 sm:w-12" />
              {rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
