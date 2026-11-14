import { useContext } from "react";
import { LocalizacaoContexto } from "@/context/LocalizacaoContexto";

/** { localizacao, definirLocalizacao } — localização escolhida pela pessoa (ou null). */
export function useLocalizacao() {
  const contexto = useContext(LocalizacaoContexto);
  if (!contexto) throw new Error("useLocalizacao precisa estar dentro de LocalizacaoProvider.");
  return contexto;
}
