// Formatação dos números da home do lojista (os cálculos ficam no backend).

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Variação percentual para exibição, ou null quando não há período anterior para comparar. */
export function descreverVariacao(variacao) {
  if (variacao === null || variacao === undefined || !Number.isFinite(Number(variacao))) return null;
  const valor = Number(variacao);
  const tendencia = valor > 0 ? "alta" : valor < 0 ? "baixa" : "estavel";
  const sinal = valor > 0 ? "+" : valor < 0 ? "−" : "";
  const numero = Math.abs(valor).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return { tendencia, texto: `${sinal}${numero}%` };
}

/** Passo "redondo" (1, 2, 2,5 ou 5 × 10ⁿ) para que o eixo tenha até 6 marcas. */
function passoRedondo(bruto) {
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const fator = [1, 2, 2.5, 5, 10].find((f) => f * potencia >= bruto);
  return fator * potencia;
}

/** Topo e marcas do eixo de valores do gráfico de vendas. */
export function escalaDoGrafico(valores, marcasDesejadas = 6) {
  const maior = Math.max(0, ...valores.map(Number));
  if (maior === 0) return { topo: 100, marcas: [0, 20, 40, 60, 80, 100] };

  const passo = passoRedondo(maior / marcasDesejadas);
  const topo = Math.ceil(maior / passo) * passo;
  const marcas = Array.from({ length: Math.round(topo / passo) + 1 }, (_, i) => Number((i * passo).toFixed(2)));
  return { topo, marcas };
}

/** "2026-11-14" → "14 Nov". */
export function rotuloDia(data) {
  const [, mes, dia] = String(data).split("-").map(Number);
  return mes ? `${String(dia).padStart(2, "0")} ${MESES_CURTOS[mes - 1]}` : "";
}

/** "2026-11-14T10:00:00" (horário da loja) → "14 Nov • 10:00". */
export function rotuloAgendamento(dataHora) {
  const [data, hora = ""] = String(dataHora).split("T");
  const rotulo = rotuloDia(data);
  return rotulo ? `${rotulo} • ${hora.slice(0, 5)}` : "";
}

/** Valores do eixo em reais, sem centavos: 1200 → "R$ 1.200". */
export function moedaDoEixo(valor) {
  return `R$ ${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}
