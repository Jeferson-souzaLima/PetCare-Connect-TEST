import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight, Heart, Package, PawPrint } from "lucide-react";
import { numeroCard, rotuloQuantidade } from "@/utils/perfil";

const CARD =
  "flex h-full w-full items-center gap-2 rounded-2xl bg-white p-3 text-left shadow-pc-card sm:gap-3 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 sm:p-4";

/** Atalhos com números: favoritos, próximos agendamentos, pedidos e pets. */
export default function AcessosRapidos({ contadores, onIrParaPets }) {
  const acessos = [
    { id: "favoritos", destino: "/favoritos", titulo: "Favoritos", icone: Heart, cor: "bg-red-50 text-red-500", texto: () => "Itens salvos" },
    { id: "agendamentos", destino: "/meus-agendamentos", titulo: "Agendamentos", icone: CalendarDays, cor: "bg-blue-50 text-blue-600", texto: () => "Próximos serviços" },
    { id: "pedidos", destino: "/meus-pedidos", titulo: "Meus pedidos", icone: Package, cor: "bg-pc-verde-100 text-pc-verde-700", texto: (n) => rotuloQuantidade(n, "Compra realizada", "Compras realizadas") },
    { id: "pets", titulo: "Meus pets", icone: PawPrint, cor: "bg-pc-verde-100 text-pc-verde-700", texto: (n) => rotuloQuantidade(n, "Pet cadastrado", "Pets cadastrados") },
  ];

  return (
    <section aria-labelledby="titulo-acesso-rapido">
      <h2 id="titulo-acesso-rapido" className="text-xl font-bold text-pc-texto">Acesso rápido</h2>
      <p className="mt-0.5 text-sm text-pc-texto-suave">Gerencie seus pedidos, agendamentos, favoritos e pets.</p>

      <ul className="mt-3 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))]">
        {acessos.map(({ id, destino, titulo, icone: Icone, cor, texto }) => {
          const valor = contadores[id];
          const conteudo = (
            <>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${cor}`}>
                <Icone size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold leading-tight text-pc-texto sm:text-sm">{titulo}</span>
                <span className="block text-2xl font-bold leading-tight text-pc-verde-700">{numeroCard(valor)}</span>
                <span className="block text-[11px] leading-tight text-pc-texto-suave sm:text-xs">{texto(valor)}</span>
              </span>
              <ChevronRight size={16} aria-hidden="true" className="-mr-1 shrink-0 text-pc-texto-suave max-[374px]:hidden" />
            </>
          );
          return (
            <li key={id}>
              {destino ? (
                <Link to={destino} className={CARD}>
                  {conteudo}
                </Link>
              ) : (
                <button type="button" onClick={onIrParaPets} className={CARD}>
                  {conteudo}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
