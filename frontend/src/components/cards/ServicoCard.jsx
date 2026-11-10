import { getMediaUrl } from "@/services/mediaUrl";
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "../ui/FavoriteButton";

export function ServicoCard({
  servico,
  className = "",
}) {

  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate(`/agendar/${servico.loja_id}/${servico.id}`)
      }
      className={`
        relative
        bg-white
        border
        border-gray-100
        rounded-2xl
        shadow-sm
        hover:shadow-md
        transition-all
        duration-200
        p-4
        cursor-pointer
        ${className}
      `}
    >

      <FavoriteButton
        tipo="servico"
        referenciaId={servico.id}
        className="absolute top-3 right-3 z-10"
      />

      {/* Cabeçalho */}

      <div className="flex items-start gap-3 pr-10">

      {/* Logo da loja */}
      <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm flex items-center justify-center flex-shrink-0">
        <img
          src={
            getMediaUrl(servico.loja_imagem, "/images/loja-padrao.png")
          }
          alt={servico.loja_nome || "Logo da loja"}
          className="w-full h-full object-contain p-2"
        />
      </div>

      {/* Informações */}
        <div className="flex-1 min-w-0">

          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {servico.nome}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            {servico.loja_nome}
          </p>

        </div>

      </div>

      {/* Rodapé */}

      <div className="flex items-center justify-between mt-4">

        <div className="flex items-center gap-4 text-sm text-gray-600">

          <span>
            ⏱ {servico.duracao_min} min
          </span>

          <span className="font-bold text-[#0E5617]">
            R$ {Number(servico.preco).toFixed(2)}
          </span>

        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();

            navigate(
              `/agendar/${servico.loja_id}/${servico.id}`
            );
          }}
          className="bg-[#0E5617] hover:bg-[#0B4712] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Agendar
        </button>

      </div>

    </div>
  );

}
