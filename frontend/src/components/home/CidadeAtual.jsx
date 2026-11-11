import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { rotuloLocalizacao } from "@/utils/home";

/** Cidade atual (sem troca nesta etapa). Sem localização, leva ao perfil ou ao login. */
export function CidadeAtual({ usuario, coords, carregando }) {
  if (carregando) {
    return <span className="h-9 w-36 animate-pulse rounded-pc-pill bg-white/15" aria-hidden="true" />;
  }

  const { texto, destino } = rotuloLocalizacao({ usuario, coords });
  const classes =
    "inline-flex min-h-[36px] max-w-[11rem] items-center gap-1.5 truncate rounded-pc-pill bg-white/10 px-3 text-sm font-medium text-white";
  const conteudo = (
    <>
      <MapPin size={16} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{texto}</span>
    </>
  );

  return destino ? (
    <Link to={destino} className={`${classes} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60`}>
      {conteudo}
    </Link>
  ) : (
    <span className={classes}>
      <span className="sr-only">Localização: </span>
      {conteudo}
    </span>
  );
}
