import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Headset, Heart, Package, PawPrint, Settings, ShieldCheck, UserRound } from "lucide-react";
import { EMAIL_SUPORTE } from "@/utils/ajudaLojista";

const ITEM =
  "flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700";

/**
 * Menu lateral da "Minha conta" (desktop). Itens desta página rolam até a seção (`secao`);
 * os demais levam para as páginas que já existem.
 */
export default function MenuLateralPerfil({ onIrPara }) {
  const principais = [
    { rotulo: "Minha conta", icone: UserRound, secao: "topo", ativo: true },
    { rotulo: "Meus pets", icone: PawPrint, secao: "meus-pets" },
    { rotulo: "Meus pedidos", icone: Package, destino: "/meus-pedidos" },
    { rotulo: "Agendamentos", icone: CalendarDays, destino: "/meus-agendamentos" },
    { rotulo: "Favoritos", icone: Heart, destino: "/favoritos" },
  ];
  const conta = [
    { rotulo: "Configurações", icone: Settings, secao: "configuracoes" },
    { rotulo: "Privacidade e dados", icone: ShieldCheck, secao: "privacidade" },
  ];

  function item({ rotulo, icone: Icone, secao, destino, ativo }) {
    const classe = `${ITEM} ${ativo ? "bg-pc-verde-700 text-white" : "text-pc-texto hover:bg-pc-fundo"}`;
    const conteudo = (
      <>
        <Icone size={20} aria-hidden="true" />
        {rotulo}
      </>
    );
    return (
      <li key={rotulo}>
        {destino ? (
          <Link to={destino} className={classe}>
            {conteudo}
          </Link>
        ) : (
          <button type="button" onClick={() => onIrPara(secao)} aria-current={ativo ? "page" : undefined} className={classe}>
            {conteudo}
          </button>
        )}
      </li>
    );
  }

  return (
    <nav aria-label="Minha conta" className="sticky top-24 flex flex-col rounded-pc-card bg-white p-3 shadow-pc-card">
      <ul className="space-y-1">{principais.map(item)}</ul>
      <hr className="my-3 border-black/5" />
      <ul className="space-y-1">{conta.map(item)}</ul>

      <div className="relative mt-6 overflow-hidden rounded-2xl bg-pc-verde-100 p-4">
        <PawPrint aria-hidden="true" className="pointer-events-none absolute -bottom-3 -right-3 h-16 w-16 text-pc-verde-700/10" />
        <p className="flex items-center gap-2 text-sm font-bold text-pc-verde-900">
          <Headset size={18} aria-hidden="true" />
          Precisa de ajuda?
        </p>
        <p className="mt-1 text-xs text-pc-texto-suave">Fale com nosso suporte</p>
        <a
          href={`mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent("Ajuda com minha conta")}`}
          className="relative mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-pc-pill border border-pc-verde-700/30 bg-white px-4 text-xs font-semibold text-pc-verde-700 hover:bg-pc-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
        >
          Abrir atendimento
          <ArrowRight size={14} aria-hidden="true" />
        </a>
      </div>
    </nav>
  );
}
