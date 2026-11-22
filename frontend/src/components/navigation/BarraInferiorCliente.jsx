import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, Home, Package, Search, ShoppingCart, User } from "lucide-react";
import { useCarrinho } from "@/context/CarrinhoContext";
import { useAuth } from "@/hooks/useAuth";
import { useToqueProlongado } from "@/hooks/useToqueProlongado";
import { itemAtivo, rotuloContador, unidadesNoCarrinho } from "@/utils/navegacaoInferior";
import { AvisoCarrinho } from "./AvisoCarrinho";
import { PainelExplorar } from "./PainelExplorar";
import { JanelaRapida } from "./mobile/JanelaRapida";
import { MiniCarrinho } from "./mobile/MiniCarrinho";
import { ResumoAgenda, ResumoConta, ResumoPedidos } from "./mobile/ResumosRapidos";

const JANELA_ID = "janela-barra-inferior";

/*
 * Toque rápido: vai para `destino`; o carrinho (sem destino) abre o mini carrinho.
 * Toque prolongado: abre a `janela` sem sair da página. Início não tem janela.
 */
const ITENS = [
  { id: "explorar", rotulo: "Explorar", destino: "/produtos", icone: Search, janela: PainelExplorar, titulo: "Explorar" },
  { id: "agenda", rotulo: "Agenda", destino: "/meus-agendamentos", icone: CalendarDays, janela: ResumoAgenda, titulo: "Próximos agendamentos" },
  { id: "inicio", rotulo: "Início", destino: "/", icone: Home },
  { id: "pedidos", rotulo: "Pedidos", destino: "/meus-pedidos", icone: Package, janela: ResumoPedidos, titulo: "Pedidos recentes" },
  { id: "carrinho", rotulo: "Carrinho", icone: ShoppingCart, janela: MiniCarrinho, titulo: "Carrinho" },
  { id: "conta", rotulo: "Conta", destino: "/perfil", icone: User, janela: ResumoConta, titulo: "Sua conta" },
];

const ITEM =
  "relative flex min-h-[52px] w-full select-none flex-col items-center justify-center gap-0.5 overflow-hidden whitespace-nowrap rounded-pc-pill text-[10px] font-medium tracking-tight transition-colors [-webkit-touch-callout:none] max-[359px]:text-[9.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 focus-visible:ring-offset-2";

function classeItem({ ativo, aberto }) {
  if (ativo) return `${ITEM} bg-pc-verde-700 text-white shadow-sm`;
  if (aberto) return `${ITEM} bg-pc-verde-100 text-pc-verde-900`;
  return `${ITEM} text-pc-texto-suave`;
}

/**
 * Barra inferior flutuante do cliente e do visitante (abaixo de 768 px), igual em todas as páginas.
 * O destaque verde acompanha a página atual. O lojista não vê esta barra.
 */
export function BarraInferiorCliente() {
  const { usuario } = useAuth();
  const { carrinho } = useCarrinho();
  const { pathname } = useLocation();
  const [janela, setJanela] = useState(null);
  const navRef = useRef(null);
  const { pressionando, propsDe } = useToqueProlongado(setJanela);

  // Fecha a janela ao trocar de página.
  useEffect(() => {
    setJanela(null);
  }, [pathname]);

  useEffect(() => {
    if (!janela) return undefined;
    function aoTeclar(evento) {
      if (evento.key !== "Escape") return;
      setJanela(null);
      navRef.current?.querySelector(`[data-item="${janela}"]`)?.focus();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [janela]);

  if (usuario?.tipo === "lojista") return null;

  const aberto = ITENS.find((item) => item.id === janela);
  const Conteudo = aberto?.janela;
  const fechar = () => setJanela(null);
  const unidades = unidadesNoCarrinho(carrinho);

  // Com uma janela aberta, tocar no ícone dela só fecha; tocar em outro fecha e segue para a página.
  function aoTocarItem(evento, id) {
    if (!janela) return;
    if (janela === id) evento.preventDefault();
    fechar();
  }

  // O carrinho abre e fecha o mini carrinho no toque rápido.
  function aoTocarCarrinho() {
    setJanela((atual) => (atual === "carrinho" ? null : "carrinho"));
  }

  return (
    <>
      {/* Com uma janela aberta o aviso ficaria sobre ela. */}
      {!Conteudo && <AvisoCarrinho />}
      {/* Toque fora da janela só a fecha: a camada recebe o toque, que não chega ao que está atrás. */}
      {Conteudo && <div aria-hidden="true" onClick={fechar} className="fixed inset-0 z-40 md:hidden" />}
      <nav
        ref={navRef}
        aria-label="Navegação principal"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-pc-pill border border-black/5 bg-white/95 p-1.5 shadow-[0_8px_24px_rgba(2,63,30,0.18)] backdrop-blur max-[359px]:inset-x-2 md:hidden"
      >
        {Conteudo && (
          <JanelaRapida key={aberto.id} id={JANELA_ID} rotulo={aberto.titulo}>
            <Conteudo aoFechar={fechar} />
          </JanelaRapida>
        )}
        <ul className="grid grid-cols-6 items-center gap-0.5">
          {ITENS.map(({ id, rotulo, destino, icone: Icone, janela: temJanela }) => {
            const ativo = itemAtivo(pathname) === id;
            const comuns = {
              "data-item": id,
              "aria-current": ativo ? "page" : undefined,
              "aria-expanded": temJanela ? janela === id : undefined,
              "aria-controls": temJanela && janela === id ? JANELA_ID : undefined,
              className: classeItem({ ativo, aberto: janela === id }),
              ...(temJanela ? propsDe(id) : {}),
            };
            const conteudo = (
              <>
                {/* Enche enquanto o dedo segura: mostra que vai abrir a janela. */}
                {temJanela && (
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 origin-left rounded-pc-pill bg-pc-verde-700/15 transition-transform ease-linear ${
                      pressionando === id ? "scale-x-100 duration-[450ms]" : "scale-x-0 duration-0"
                    }`}
                  />
                )}
                <span className="relative">
                  <Icone size={22} aria-hidden="true" />
                  {id === "carrinho" && unidades > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pc-lima px-1 text-[10px] font-bold leading-none text-pc-verde-900">
                      {rotuloContador(unidades)}
                    </span>
                  )}
                </span>
                <span className="relative">{rotulo}</span>
              </>
            );

            return (
              <li key={id}>
                {destino ? (
                  <Link to={destino} onClick={(evento) => aoTocarItem(evento, id)} {...comuns}>
                    {conteudo}
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-label={unidades ? `${rotulo} (${unidades} ${unidades === 1 ? "item" : "itens"})` : rotulo}
                    onClick={aoTocarCarrinho}
                    {...comuns}
                  >
                    {conteudo}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
