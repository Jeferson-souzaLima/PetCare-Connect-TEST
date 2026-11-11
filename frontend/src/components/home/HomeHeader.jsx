import { Link } from "react-router-dom";
import { AcoesCabecalho } from "./AcoesCabecalho";
import { BuscaHome } from "./BuscaHome";
import { CidadeAtual } from "./CidadeAtual";

/** Cabeçalho exclusivo da nova home (o Header das outras páginas não muda). */
export function HomeHeader({ usuario, logout, coords, carregandoLocalizacao }) {
  return (
    <header className="bg-gradient-to-b from-pc-verde-900 to-pc-verde-700 px-4 pb-4 pt-3 md:px-6 md:pb-3">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-3 gap-y-3">
        <Link to="/" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60" aria-label="PetCare Connect, página inicial">
          <img src="/logo.png" alt="" className="h-10 w-auto md:h-12" />
        </Link>
        <CidadeAtual usuario={usuario} coords={coords} carregando={carregandoLocalizacao} />
        <div className="order-last w-full md:order-none md:w-auto md:flex-1 md:px-4">
          <BuscaHome />
        </div>
        <div className="ml-auto md:ml-0">
          <AcoesCabecalho usuario={usuario} logout={logout} />
        </div>
      </div>
    </header>
  );
}
