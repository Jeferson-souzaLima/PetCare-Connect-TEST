// Estados do cabeçalho recolhível da home no celular (sem React), testados em headerRecolhivel.test.js.

/**
 * Limites de rolagem (px). Entrar e sair de cada estado usa limites diferentes, para pequenas
 * oscilações da rolagem não ficarem alternando o cabeçalho.
 */
export const LIMITES_HEADER = {
  topo: 8, // até aqui volta sempre ao completo
  compacto: 48, // do completo para o compacto
  recolher: 320, // do compacto para o recolhido (só descendo)
  reabrir: 200, // do recolhido de volta ao compacto (subindo)
};

/**
 * Próximo estado do cabeçalho: "completo", "compacto" ou "recolhido".
 * `fixado` é a escolha feita pelo toque na aba ("compacto" ou "recolhido"): vale até voltar ao topo.
 */
export function proximoEstadoHeader({ atual, y, descendo, fixado = null }) {
  if (y <= LIMITES_HEADER.topo) return "completo";
  if (fixado) return fixado;
  if (atual === "completo") return y >= LIMITES_HEADER.compacto ? "compacto" : "completo";
  if (atual === "compacto") return descendo && y >= LIMITES_HEADER.recolher ? "recolhido" : "compacto";
  return y < LIMITES_HEADER.reabrir ? "compacto" : "recolhido";
}
