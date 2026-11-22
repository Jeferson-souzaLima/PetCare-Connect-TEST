import { Link } from "react-router-dom";
import { FaixaAdmin } from "@/components/navigation/FaixaAdmin";
import { LogoPetCare } from "@/components/ui/LogoPetCare";
import { useAuth } from "@/hooks/useAuth";
import { AcoesCabecalho } from "./AcoesCabecalho";
import { BuscaHome } from "./BuscaHome";
import { CidadeAtual } from "./CidadeAtual";

/**
 * Cabeçalho único do site (cliente, visitante e admin), fixo no topo durante a rolagem.
 * - `busca={false}`: sem a busca geral (Lojas, Produtos e Serviços têm a sua).
 * - Com o mini carrinho aberto o cabeçalho sobe acima da barra inferior (toque nela só fecha a janela).
 * - `faixaBanner`: só na home; no celular o verde continua abaixo do cabeçalho, atrás dos cantos
 *   arredondados da folha clara. A faixa fica fora do cabeçalho fixo para que
 *   ele tenha sempre a mesma altura (sem saltos na rolagem).
 */
export function HomeHeader({ busca = true, faixaBanner = false }) {
  const { usuario, logout } = useAuth();

  return (
    <>
      <FaixaAdmin />
      {/* No celular o verde vai de ponta a ponta, inclusive sob a barra de status (safe-area). */}
      <header className="sticky top-0 z-40 has-[[data-janela-aberta]]:z-50 bg-gradient-to-b from-pc-verde-900 to-pc-verde-700 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] shadow-[0_2px_12px_rgba(2,63,30,0.18)] md:px-6 md:pb-3 md:pt-3">
        <div className="mx-auto flex max-w-pc-pagina flex-wrap items-center gap-x-3 gap-y-3.5 md:gap-y-3">
          <Link to="/" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60" aria-label="PetCare Connect, página inicial">
            <LogoPetCare alt="" className="h-10 md:h-12" />
          </Link>
          <CidadeAtual usuario={usuario} />
          {busca ? (
            <div className="order-last w-full md:order-none md:w-auto md:flex-1 md:px-4">
              <BuscaHome />
            </div>
          ) : (
            <div className="hidden md:block md:flex-1" />
          )}
          <div className="ml-auto md:ml-0">
            <AcoesCabecalho usuario={usuario} logout={logout} />
          </div>
        </div>
      </header>
      {faixaBanner && <div aria-hidden="true" className="h-7 bg-pc-verde-700 md:hidden" />}
    </>
  );
}
