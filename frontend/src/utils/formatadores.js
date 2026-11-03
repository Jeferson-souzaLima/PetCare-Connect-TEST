/** Formata um valor numérico como moeda brasileira (R$). */
export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Converte uma data "AAAA-MM-DD" (input type=date) para "DD/MM/AAAA". */
export function formatarDataISO(dataISO) {
  return new Date(`${dataISO}T00:00:00`).toLocaleDateString("pt-BR");
}

/** Data e hora curtas (ex.: 03/11/2026 10:47). */
export function formatarDataHora(data) {
  if (!data) {
    return "Não informado";
  }

  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
