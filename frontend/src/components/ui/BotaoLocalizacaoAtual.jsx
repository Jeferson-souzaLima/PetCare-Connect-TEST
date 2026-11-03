import { LocateFixed } from "lucide-react";

const ESTILOS = {
  link: "inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0E5617] transition disabled:opacity-60",
  contorno:
    "flex items-center justify-center gap-2 rounded-xl bg-white border px-4 py-3 text-sm font-semibold text-gray-700 hover:border-green-500 hover:text-[#0E5617] transition disabled:opacity-60",
};

/**
 * Botão "Usar minha localização atual".
 * `className` complementa o estilo base (margem, largura, cor da borda).
 */
export default function BotaoLocalizacaoAtual({
  onClick,
  carregando,
  variante = "contorno",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={carregando}
      className={`${ESTILOS[variante]} ${className}`}
    >
      <LocateFixed className="w-4 h-4" />

      {carregando
        ? "Obtendo localização..."
        : "Usar minha localização atual"}
    </button>
  );
}
