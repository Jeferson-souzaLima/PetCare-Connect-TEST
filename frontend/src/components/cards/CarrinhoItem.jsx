import { getMediaUrl, IMAGEM_PADRAO_PRODUTO } from "@/services/mediaUrl";

export default function CarrinhoItem({
  item,
  onIncrease,
  onDecrease,
  onRemove
}) {
  const precoUnitario = Number(item.preco_unitario);
  const subtotal = precoUnitario * item.quantidade;

  const precoFormatado = precoUnitario.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const subtotalFormatado = subtotal.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const imagemProduto = getMediaUrl(item.imagem, IMAGEM_PADRAO_PRODUTO);

  return (
    <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border">
      
      {/* Imagem */}
      <img
        src={imagemProduto}
        alt={item.nome_item}
        className="w-20 h-20 object-cover rounded-lg"
      />

      {/* Infos */}
      <div className="flex-1">
        <p className="font-semibold text-gray-800">
          {item.nome_item}
        </p>

        {/* Loja */}
        {item.loja_nome && (
          <p className="text-xs text-gray-500 mt-1">
            Vendido por <span className="font-medium">{item.loja_nome}</span>
          </p>
        )}

        <p className="text-sm text-gray-600 mt-2">
          {precoFormatado}
        </p>

        {/* Quantidade */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={onDecrease}
            className="w-8 h-8 rounded-full border text-lg flex items-center justify-center hover:bg-gray-100"
          >
            −
          </button>

          <span className="font-medium">
            {item.quantidade}
          </span>

          <button
            onClick={onIncrease}
            className="w-8 h-8 rounded-full border text-lg flex items-center justify-center hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* Subtotal + remover */}
      <div className="flex flex-col items-end justify-between">
        <p className="font-semibold text-green-700">
          {subtotalFormatado}
        </p>

        <button
          onClick={onRemove}
          className="text-xs text-red-500 hover:underline"
        >
          Remover
        </button>
      </div>
    </div>
  );
}
