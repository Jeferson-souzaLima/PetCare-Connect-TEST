import { FaArrowLeft, FaBoxOpen, FaSyncAlt } from "react-icons/fa";

/** Cabeçalho da página com "voltar ao painel" e botão de atualizar. */
export default function CabecalhoPedidos({ onVoltar, onAtualizar, atualizando }) {
  return (
    <header className="rounded-b-3xl bg-gradient-to-r from-green-200 to-green-300 p-8 shadow-md sm:p-10">

    <button
        type="button"
        onClick={onVoltar}
        className="mb-5 flex items-center gap-2 text-sm font-semibold text-green-900 hover:underline"
    >
        <FaArrowLeft />
        Voltar ao painel
    </button>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

        <div className="flex items-center gap-4">

        <div className="rounded-full bg-green-900 p-4 text-2xl text-white">
            <FaBoxOpen />
        </div>

        <div>
            <h1 className="text-3xl font-bold text-green-900">
            Meus Pedidos
            </h1>

            <p className="mt-1 text-green-800">
            Gerencie e acompanhe os pedidos da sua loja.
            </p>
        </div>

        </div>

        <button
        onClick={onAtualizar}
        disabled={atualizando}
        className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-green-900 shadow transition hover:shadow-md disabled:opacity-60"
        >
        <FaSyncAlt
            className={atualizando ? "animate-spin" : ""}
        />

        {atualizando
            ? "Atualizando..."
            : "Atualizar"}
        </button>

    </div>

    </header>
  );
}
