import { useState } from "react";
import { MapPin } from "lucide-react";
import { useLocalizacao } from "@/hooks/useLocalizacao";
import { rotuloLocalizacao } from "@/utils/localizacao";
import { PainelLocalizacao } from "@/components/localizacao/PainelLocalizacao";

/** Botão da cidade no cabeçalho: mostra a localização escolhida e abre o painel para trocá-la. */
export function CidadeAtual({ usuario }) {
  const { localizacao } = useLocalizacao();
  const [aberto, setAberto] = useState(false);
  const texto = rotuloLocalizacao({ localizacao, usuario });

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label={`Localização: ${texto}. Trocar localização`}
        className="inline-flex min-h-[36px] max-w-[11rem] items-center gap-1.5 truncate rounded-pc-pill bg-white/10 px-3 text-sm font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60"
      >
        <MapPin size={16} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{texto}</span>
      </button>
      {aberto && <PainelLocalizacao usuario={usuario} aoFechar={() => setAberto(false)} />}
    </>
  );
}
