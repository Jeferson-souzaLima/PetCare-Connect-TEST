import { Search, X } from "lucide-react";

/** Menu do long press em "Explorar": pesquisas recentes. */
export default function MenuHistoricoBusca({
  historicoBusca,
  onAbrirTermo,
  onRemoverTermo,
}) {
  return (
    <div
      className="
        absolute
        bottom-full
        left-1/2
        -translate-x-1/2
        w-[180px]
        mb-3
        bg-white
        border
        border-gray-200
        rounded-2xl
        shadow-xl
        p-2
        max-h-[260px]
        overflow-y-auto
      "
    >
      {historicoBusca.length === 0 ? (
        <div className="px-3 py-4 text-center">
          <Search className="w-5 h-5 mx-auto text-gray-400 mb-2" />

          <p className="text-xs font-semibold text-gray-600">
            Nenhuma pesquisa recente
          </p>

          <p className="text-[10px] text-gray-400 mt-1">
            Suas pesquisas aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {historicoBusca.map(
            (termo) => (
              <div
                key={termo}
                className="
                  flex
                  items-center
                  gap-2
                  bg-gray-50
                  border
                  border-gray-100
                  rounded-xl
                  px-2.5
                  py-2
                "
              >
                <button
                  type="button"
                  onClick={() => onAbrirTermo(termo)}
                  className="
                    flex-1
                    min-w-0
                    text-left
                    text-xs
                    font-semibold
                    text-gray-700
                    truncate
                    hover:text-[#0E5617]
                  "
                >
                  {termo}
                </button>

                <button
                  type="button"
                  onClick={() => onRemoverTermo(termo)}
                  aria-label={`Excluir pesquisa ${termo}`}
                  className="
                    shrink-0
                    w-6
                    h-6
                    flex
                    items-center
                    justify-center
                    rounded-full
                    text-gray-400
                    hover:bg-gray-200
                    hover:text-gray-700
                    transition-colors
                  "
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
