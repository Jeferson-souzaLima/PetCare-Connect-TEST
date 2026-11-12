import { Link } from "react-router-dom";
import { AcoesCabecalho } from "./AcoesCabecalho";
import { BuscaHome } from "./BuscaHome";
import { CidadeAtual } from "./CidadeAtual";

/**
 * Cabeçalho da nova home. Com `pagina` (Lojas, Produtos e Serviços), fica sem a busca geral,
 * porque a página tem a sua, e sem o espaço extra para o banner subir.
 */
export function HomeHeader({ usuario, logout, pagina = false }) {
  return (
    // No celular o verde vai de ponta a ponta, inclusive sob a barra de status (safe-area),
    // e continua abaixo da busca, onde a folha clara da página e o banner sobem sobre ele.
    <header
      className={`bg-gradient-to-b from-pc-verde-900 to-pc-verde-700 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] md:px-6 md:pb-3 md:pt-3 ${
        pagina ? "pb-3" : "pb-[4.5rem]"
      }`}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-3">
        <Link to="/" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60" aria-label="PetCare Connect, página inicial">
          <img src="/logo.png" alt="" className="h-10 w-auto md:h-12" />
        </Link>
        <CidadeAtual usuario={usuario} />
        {pagina ? (
          <div className="hidden md:block md:flex-1" />
        ) : (
          <div className="order-last w-full md:order-none md:w-auto md:flex-1 md:px-4">
            <BuscaHome />
          </div>
        )}
        <div className="ml-auto md:ml-0">
          <AcoesCabecalho usuario={usuario} logout={logout} />
        </div>
      </div>
    </header>
  );
}
