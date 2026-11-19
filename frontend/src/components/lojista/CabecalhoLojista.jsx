import { Link } from "react-router-dom";
import { Bell, CalendarCog, CalendarDays, ChevronDown, CircleHelp, ExternalLink, LogOut, PackageCheck, Search, Settings, Store } from "lucide-react";
import { LogoPetCare } from "@/components/ui/LogoPetCare";
import { useMenuSuspenso } from "@/hooks/useMenuSuspenso";
import { AvatarLoja } from "./AvatarLoja";
import { SeloEmBreve } from "./ItemMenuLojista";
import { INICIO_LOJISTA } from "./itensMenuLojista";

const FOCO = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60";
const BOTAO_ICONE = `relative flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 ${FOCO}`;
const MENU = "absolute top-full z-50 mt-2 w-64 overflow-hidden rounded-pc-card bg-white py-2 text-pc-texto shadow-xl ring-1 ring-black/5";
const ITEM_MENU = "flex min-h-[44px] w-full items-center gap-3 px-4 text-left text-sm hover:bg-pc-fundo focus-visible:bg-pc-fundo focus-visible:outline-none";

function MenuAreaLojista({ loja }) {
  const menu = useMenuSuspenso();
  const vitrineDisponivel = loja?.id && loja.ativo;

  return (
    <div ref={menu.refContainer} className="relative">
      <button
        ref={menu.refBotao}
        type="button"
        aria-expanded={menu.aberto}
        aria-controls="menu-area-lojista"
        onClick={menu.alternar}
        className={`flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-pc-pill bg-white/10 px-2.5 text-sm font-semibold text-white hover:bg-white/15 sm:gap-2 sm:px-4 sm:text-[15px] ${FOCO}`}
      >
        <Store aria-hidden="true" className="hidden h-5 w-5 shrink-0 min-[400px]:block" />
        Área do Lojista
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
      </button>
      {menu.aberto && (
        <ul id="menu-area-lojista" className={`${MENU} left-0`}>
          <li>
            <Link to={INICIO_LOJISTA} onClick={menu.fechar} className={ITEM_MENU}>
              <Store aria-hidden="true" className="h-4 w-4 text-pc-verde-700" /> Painel do lojista
            </Link>
          </li>
          <li>
            {vitrineDisponivel ? (
              <Link to={`/lojas/${loja.id}`} onClick={menu.fechar} className={ITEM_MENU}>
                <ExternalLink aria-hidden="true" className="h-4 w-4 text-pc-verde-700" /> Ver minha loja no site
              </Link>
            ) : (
              <p className="px-4 py-2 text-sm text-pc-texto-suave">Sua loja aparece no site depois da aprovação.</p>
            )}
          </li>
        </ul>
      )}
    </div>
  );
}

function MenuPendencias({ pendencias }) {
  const menu = useMenuSuspenso();
  const pedidos = Number(pendencias?.pedidos_a_preparar || 0);
  const agendamentos = Number(pendencias?.agendamentos_hoje || 0);
  const total = pedidos + agendamentos;

  return (
    <div ref={menu.refContainer} className="relative">
      <button
        ref={menu.refBotao}
        type="button"
        aria-expanded={menu.aberto}
        aria-controls="menu-pendencias-lojista"
        aria-label={total ? `Pendências: ${total}` : "Pendências"}
        onClick={menu.alternar}
        className={BOTAO_ICONE}
      >
        <Bell aria-hidden="true" className="h-6 w-6" />
        {total > 0 && (
          <span aria-hidden="true" className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {total}
          </span>
        )}
      </button>
      {menu.aberto && (
        <div id="menu-pendencias-lojista" className={`${MENU} right-0`}>
          <p className="px-4 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-pc-texto-suave">Pendências</p>
          {total === 0 && <p className="px-4 py-3 text-sm text-pc-texto-suave">Nada pendente agora.</p>}
          {pedidos > 0 && (
            <Link to="/lojista/pedidos" onClick={menu.fechar} className={ITEM_MENU}>
              <PackageCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-pc-verde-700" />
              {pedidos === 1 ? "1 pedido pago para preparar" : `${pedidos} pedidos pagos para preparar`}
            </Link>
          )}
          {agendamentos > 0 && (
            <Link to="/lojista/agenda" onClick={menu.fechar} className={ITEM_MENU}>
              <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-pc-verde-700" />
              {agendamentos === 1 ? "1 agendamento hoje" : `${agendamentos} agendamentos hoje`}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function SituacaoLoja({ ativa }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-pc-pill px-2 py-0.5 text-xs font-semibold ${ativa ? "bg-white/15 text-white" : "bg-amber-300 text-amber-950"}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full border-2 ${ativa ? "border-pc-lima" : "border-amber-900"}`} />
      {ativa ? "Loja ativa" : "Aguardando aprovação"}
    </span>
  );
}

function MenuLoja({ loja, aoSair }) {
  const menu = useMenuSuspenso();
  const nome = loja?.nome_fantasia || "Minha loja";

  return (
    <div ref={menu.refContainer} className="relative">
      <button
        ref={menu.refBotao}
        type="button"
        aria-expanded={menu.aberto}
        aria-controls="menu-loja"
        aria-label={`Menu da loja ${nome}`}
        onClick={menu.alternar}
        className={`flex min-h-[44px] items-center gap-3 rounded-pc-pill text-left text-white md:pr-2 ${FOCO}`}
      >
        <AvatarLoja loja={loja} className="h-11 w-11 ring-2 ring-white/20 sm:h-12 sm:w-12" />
        <span className="hidden max-w-[180px] md:block">
          <span className="block truncate text-[15px] font-semibold">{nome}</span>
          {loja && <SituacaoLoja ativa={Boolean(loja.ativo)} />}
        </span>
        <ChevronDown aria-hidden="true" className="hidden h-4 w-4 md:block" />
      </button>
      {menu.aberto && (
        <ul id="menu-loja" className={`${MENU} right-0`}>
          <li className="px-4 pb-2 pt-1 md:hidden">
            <p className="truncate font-semibold">{nome}</p>
            <p className="text-xs text-pc-texto-suave">{loja?.ativo ? "Loja ativa" : "Aguardando aprovação"}</p>
          </li>
          <li>
            <Link to="/lojista/perfil" onClick={menu.fechar} className={ITEM_MENU}>
              <Settings aria-hidden="true" className="h-4 w-4 text-pc-verde-700" /> Dados da loja
            </Link>
          </li>
          <li>
            <Link to="/lojista/agenda/configuracoes" onClick={menu.fechar} className={ITEM_MENU}>
              <CalendarCog aria-hidden="true" className="h-4 w-4 text-pc-verde-700" /> Horários da agenda
            </Link>
          </li>
          <li>
            <button type="button" onClick={() => { menu.fechar(); aoSair(); }} className={`${ITEM_MENU} text-red-700`}>
              <LogOut aria-hidden="true" className="h-4 w-4" /> Sair
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

/** Cabeçalho verde da área do lojista. */
export function CabecalhoLojista({ loja, pendencias, aoSair }) {
  return (
    <header className="sticky top-0 z-40 bg-[#01351A] text-white shadow-md">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-6 lg:px-6">
        <Link to={INICIO_LOJISTA} aria-label="PetCare Connect, painel do lojista" className={`shrink-0 rounded-lg ${FOCO}`}>
          <LogoPetCare alt="" className="h-8 sm:h-10 lg:h-11" />
        </Link>

        <div className="min-w-0 flex-1 md:flex-none">
          <MenuAreaLojista loja={loja} />
        </div>

        <div className="hidden flex-1 md:block">
          <label className="relative mx-auto block max-w-[700px]" title="Busca do painel: em breve">
            <span className="sr-only">Buscar pedidos, produtos e clientes (em breve)</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              disabled
              placeholder="Buscar pedidos, produtos, clientes..."
              className="h-12 w-full cursor-not-allowed rounded-xl bg-white pl-12 pr-28 text-[15px] text-pc-texto placeholder:text-gray-500"
            />
            <span className="absolute right-3 top-1/2 flex -translate-y-1/2"><SeloEmBreve /></span>
          </label>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 lg:gap-3">
          <MenuPendencias pendencias={pendencias} />
          <Link to="/lojista/ajuda-suporte" aria-label="Ajuda e suporte" className={`hidden sm:flex ${BOTAO_ICONE}`}>
            <CircleHelp aria-hidden="true" className="h-6 w-6" />
          </Link>
          <MenuLoja loja={loja} aoSair={aoSair} />
        </div>
      </div>
    </header>
  );
}
