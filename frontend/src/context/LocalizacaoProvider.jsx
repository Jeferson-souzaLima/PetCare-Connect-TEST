import { useCallback, useMemo, useState } from "react";
import { lerLocalizacao, salvarLocalizacao } from "@/utils/localizacao";
import { LocalizacaoContexto } from "./LocalizacaoContexto";

/**
 * Guarda a localização escolhida (GPS, endereço do perfil ou CEP/cidade digitados) e a mantém
 * no navegador, para continuar valendo ao recarregar a página.
 */
export function LocalizacaoProvider({ children }) {
  const [localizacao, setLocalizacao] = useState(() => lerLocalizacao());

  const definirLocalizacao = useCallback((nova) => {
    setLocalizacao(nova);
    salvarLocalizacao(nova);
  }, []);

  const valor = useMemo(() => ({ localizacao, definirLocalizacao }), [localizacao, definirLocalizacao]);

  return <LocalizacaoContexto.Provider value={valor}>{children}</LocalizacaoContexto.Provider>;
}
