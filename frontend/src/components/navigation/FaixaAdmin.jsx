import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/** Faixa no topo do site, só para o administrador, com o caminho de volta ao painel. */
export function FaixaAdmin() {
  const { usuario } = useAuth();
  if (usuario?.tipo !== "admin") return null;

  return (
    <div className="bg-pc-lima px-4 pb-1.5 pt-[calc(0.375rem+env(safe-area-inset-top))] text-pc-verde-900 md:px-6">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          Você está vendo o site como administrador
        </p>
        <Link
          to="/admin"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-pc-pill bg-pc-verde-900 px-4 font-semibold text-white hover:bg-pc-verde-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-900/40"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Voltar ao painel admin
        </Link>
      </div>
    </div>
  );
}
