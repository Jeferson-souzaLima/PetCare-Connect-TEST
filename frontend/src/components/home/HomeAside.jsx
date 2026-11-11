import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { MeusPetsResumo } from "./MeusPetsResumo";
import { PedidosRecentes } from "./PedidosRecentes";
import { ProximosAgendamentos } from "./ProximosAgendamentos";

/** Coluna direita da home no desktop (a partir de 1280 px). */
export function HomeAside({ resumo, logado }) {
  return (
    <aside aria-label="Resumo da sua conta" className="hidden w-80 shrink-0 space-y-4 xl:block">
      {logado && resumo.pets.estado !== "inativo" ? (
        <>
          <MeusPetsResumo {...resumo.pets} />
          <ProximosAgendamentos {...resumo.agendamentos} />
          <PedidosRecentes {...resumo.pedidos} />
        </>
      ) : (
        <section className="rounded-pc-card bg-white p-5 text-center shadow-pc-card">
          <UserRound size={32} aria-hidden="true" className="mx-auto text-pc-verde-700" />
          <h2 className="mt-2 text-base font-bold text-pc-texto">Entre para ver seus pets, pedidos e agendamentos</h2>
          <Link to="/login" className="mt-3 inline-flex min-h-[44px] items-center rounded-pc-pill bg-pc-verde-700 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima">
            Entrar
          </Link>
        </section>
      )}
    </aside>
  );
}
