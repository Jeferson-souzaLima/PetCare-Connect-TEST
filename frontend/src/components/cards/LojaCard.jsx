import { getMediaUrl, IMAGEM_PADRAO_LOJA } from "@/services/mediaUrl";
import { Link } from "react-router-dom";
import { FavoriteButton } from "../ui/FavoriteButton";
import { formatarDistancia } from "@/utils/formatarDistancia";

export function LojaCard({
  loja,
  className = "",
}) {

  const imagemUrl = getMediaUrl(loja.imagem, IMAGEM_PADRAO_LOJA);

  return (
    <Link
      to={`/lojas/${loja.id}`}
      className={`
        relative
        flex
        items-center
        bg-white
        p-4
        rounded-xl
        shadow-sm
        hover:shadow-md
        transition
        w-full
        ${className}
      `}
    >

      <FavoriteButton
        tipo="loja"
        referenciaId={loja.id}
        className="absolute top-3 right-3 z-10"
      />

      <img
        src={imagemUrl}
        alt={loja.nome_fantasia}
        className="w-16 h-16 rounded-full object-cover mr-4"
        onError={(e) => {
          // Troca uma vez só: se a imagem padrão também falhar, não entra em loop.
          if (!e.currentTarget.src.endsWith(IMAGEM_PADRAO_LOJA)) e.currentTarget.src = IMAGEM_PADRAO_LOJA;
        }}
      />

      <div className="flex flex-col justify-center">

          <p className="font-semibold text-gray-800">
              {loja.nome_fantasia}
          </p>

          {loja.distancia !== undefined && (

              <p className="text-xs font-medium text-green-700">

                  📍 {formatarDistancia(loja.distancia)}

              </p>

          )}

          <p className="text-sm text-gray-600">
              {loja.endereco}
          </p>

      </div>

    </Link>
  );
}
