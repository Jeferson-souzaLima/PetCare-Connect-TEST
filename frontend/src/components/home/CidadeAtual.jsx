import { useState } from "react";
import { MapPin } from "lucide-react";
import { useLocalizacao } from "@/hooks/useLocalizacao";
import { rotuloLocalizacao } from "@/utils/localizacao";
import { PainelLocalizacao } from "@/components/localizacao/PainelLocalizacao";

/**
 * Botão da cidade no cabeçalho: mostra a localização escolhida e abre o painel para trocá-la.
 * `compacto`: mais estreito no cabeçalho recolhível; abaixo de 375 px fica só o ícone.
 */
export function CidadeAtual({ usuario, compacto = false }) {
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
        className={`inline-flex min-h-[36px] items-center gap-1.5 truncate rounded-pc-pill bg-white/10 text-sm ${compacto ? "max-w-[5.25rem] px-2.5" : "max-w-[11rem] px-3"} font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60`}
      >
        <MapPin size={16} aria-hidden="true" className="shrink-0" />
        <span className={`truncate ${compacto ? "max-[374px]:sr-only" : ""}`}>{texto}</span>
      </button>
      {aberto && <PainelLocalizacao usuario={usuario} aoFechar={() => setAberto(false)} />}
    </>
  );
}
