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
        // Logos costumam ter o nome escrito: object-contain mostra o logo inteiro, sem cortar o texto.
        className="mr-4 h-16 w-16 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-black/5"
        onError={(e) => {
          // Troca uma vez só: se a imagem padrão também falhar, não entra em loop.
          if (!e.currentTarget.src.endsWith(IMAGEM_PADRAO_LOJA)) e.currentTarget.src = IMAGEM_PADRAO_LOJA;
        }}
      />

      {/* pr-10: o texto não passa por baixo do coração de favoritar */}
      <div className="flex min-w-0 flex-col justify-center pr-10">

          <p className="line-clamp-2 font-semibold text-gray-800">
              {loja.nome_fantasia}
          </p>

          {loja.distancia !== undefined && (

              <p className="text-xs font-medium text-green-700">

                  📍 {formatarDistancia(loja.distancia)}

              </p>

          )}

          <p className="line-clamp-2 text-sm text-gray-600">
              {loja.endereco}
          </p>

      </div>

    </Link>
  );
}
