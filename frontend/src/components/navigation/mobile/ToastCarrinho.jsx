import { Check } from "lucide-react";

/** Aviso flutuante "Produto adicionado ao carrinho!". */
export default function ToastCarrinho() {
  return (
    <div
      className="
        fixed
        left-1/2
        -translate-x-1/2
        bottom-24
        z-[60]
        flex
        items-center
        gap-2
        bg-[#0E5617]
        text-white
        px-4
        py-2.5
        rounded-full
        shadow-xl
        text-sm
        font-semibold
        whitespace-nowrap
        animate-in
        fade-in
        slide-in-from-bottom-2
        duration-200
      "
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
        <Check className="w-3.5 h-3.5" />
      </span>

      Produto adicionado ao carrinho!
    </div>
  );
}
