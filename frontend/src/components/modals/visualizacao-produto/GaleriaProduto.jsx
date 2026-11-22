import { useState } from "react";
import { getMediaUrl, IMAGEM_PADRAO_PRODUTO } from "@/services/mediaUrl";

/** Miniaturas em coluna e a imagem grande do produto. */
export function GaleriaProduto({ produto }) {
  const [ativa, setAtiva] = useState(0);
  const imagens = produto.imagens?.length ? produto.imagens : [{ id: "padrao", caminho: IMAGEM_PADRAO_PRODUTO }];
  const atual = imagens[ativa] || imagens[0];

  return (
    <div className="flex gap-3">
      {imagens.length > 1 && (
        <ul className="flex max-h-[26rem] w-[4.5rem] shrink-0 flex-col gap-2 overflow-y-auto p-0.5" aria-label="Imagens do produto">
          {imagens.map((imagem, indice) => (
            <li key={imagem.id ?? indice}>
              <button
                type="button"
                onClick={() => setAtiva(indice)}
                aria-label={`Ver imagem ${indice + 1} de ${imagens.length}`}
                aria-pressed={ativa === indice}
                className={`flex h-[4.25rem] w-[4.25rem] items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 ${
                  ativa === indice ? "border-pc-verde-700 shadow-sm" : "border-black/5 hover:border-pc-verde-700/40"
                }`}
              >
                <img src={getMediaUrl(imagem.caminho, IMAGEM_PADRAO_PRODUTO)} alt="" className="h-full w-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex aspect-square min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-pc-fundo">
        <img src={getMediaUrl(atual.caminho, IMAGEM_PADRAO_PRODUTO)} alt={produto.nome} className="h-full w-full object-contain p-6" />
      </div>
    </div>
  );
}
