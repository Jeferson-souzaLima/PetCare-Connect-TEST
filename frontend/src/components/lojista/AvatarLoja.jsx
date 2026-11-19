import { Store } from "lucide-react";
import { getMediaUrl } from "@/services/mediaUrl";

/** Logo da loja em círculo branco; sem imagem, mostra o ícone de loja. */
export function AvatarLoja({ loja, className = "" }) {
  const imagem = getMediaUrl(loja?.imagem);
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ${className}`}>
      {imagem
        ? <img src={imagem} alt="" className="h-full w-full object-cover" />
        : <Store aria-hidden="true" className="h-1/2 w-1/2 text-pc-verde-900" />}
    </span>
  );
}
