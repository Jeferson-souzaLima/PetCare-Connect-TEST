import api from "@/services/api";

/** Números da home do lojista: indicadores de 30 dias, vendas por dia, próximos agendamentos e pendências. */
export async function obterPainelLojista() {
  const { data } = await api.get("/relatorios/painel");
  return data;
}
