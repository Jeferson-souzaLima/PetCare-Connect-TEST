import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import pedidoService from "../../services/pedidoService";
import MensagemStatus from "@/components/ui/MensagemStatus";

// O cliente só cancela antes do preparo (regra validada no backend).
const STATUS_CANCELAVEIS = ["aguardando_pagamento", "pago"];


const statusLabels = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_preparo: "Em preparo",
  pronto_para_retirada: "Pronto para retirada",
  em_entrega: "Em entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const statusClasses = {
  aguardando_pagamento: "bg-amber-100 text-amber-800",
  pago: "bg-blue-100 text-blue-800",
  em_preparo: "bg-violet-100 text-violet-800",
  pronto_para_retirada: "bg-cyan-100 text-cyan-800",
  em_entrega: "bg-indigo-100 text-indigo-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

function formatarData(data) {
  if (!data) return "Data não disponível";

  const valor = new Date(data);
  return Number.isNaN(valor.getTime())
    ? "Data não disponível"
    : valor.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

export default function MeusPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [pedidoAberto, setPedidoAberto] = useState(null);
  const [cancelando, setCancelando] = useState(null);
  const [aviso, setAviso] = useState(null);

  const navigate = useNavigate();

  const cancelarPedido = async (pedido) => {
    const confirmacao = pedido.status === "pago"
      ? `Cancelar o pedido #${pedido.id}? O valor pago será devolvido pelo Mercado Pago na mesma forma de pagamento.`
      : `Cancelar o pedido #${pedido.id}?`;

    if (!window.confirm(confirmacao)) return;

    setCancelando(pedido.id);
    setAviso(null);
    try {
      const resposta = await pedidoService.cancelarMeuPedido(pedido.id);
      setPedidos((atuais) => atuais.map((p) => (p.id === pedido.id ? { ...p, status: "cancelado" } : p)));
      setAviso({ tipo: "sucesso", texto: resposta.mensagem || "Pedido cancelado." });
    } catch (error) {
      setAviso({
        tipo: "erro",
        texto: error.response?.data?.mensagem || "Não foi possível cancelar o pedido."
      });
    } finally {
      setCancelando(null);
    }
  };

  useEffect(() => {
    let ativo = true;

    async function carregarPedidos() {
      try {
        const resposta = await api.get("/pedidos/meus");
        if (ativo) setPedidos(resposta.data);
      } catch (error) {
        if (ativo) {
          setErro(
            error.response?.data?.mensagem ||
              "Não foi possível carregar seus pedidos."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarPedidos();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <header className="rounded-b-3xl bg-gradient-to-r from-green-200 to-green-300 p-6 shadow-md">
        <button
          type="button"
          onClick={() => navigate("/perfil")}
          className="mb-4 font-medium text-green-900 transition hover:text-green-700"
        >
          ← Voltar ao perfil
        </button>
        <h1 className="text-2xl font-bold text-green-900">Meus pedidos</h1>
        <p className="mt-1 text-sm text-green-800">
          Acompanhe o status das suas compras.
        </p>
      </header>

      <main className="px-4">
        {carregando && (
          <p className="py-10 text-center text-gray-500">Carregando pedidos...</p>
        )}

        {!carregando && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            {erro}
          </div>
        )}

        {!carregando && !erro && pedidos.length === 0 && (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">Nenhum pedido encontrado</h2>
            <p className="mt-2 text-gray-500">
              Quando você finalizar uma compra, ela aparecerá aqui.
            </p>
          </div>
        )}

        {!carregando && !erro && pedidos.length > 0 && (
          <div className="space-y-4">
            <MensagemStatus mensagem={aviso} />
            {pedidos.map((pedido) => {
  const aberto = pedidoAberto === pedido.id;

  return (
    <article
      key={pedido.id}
      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
    >
      {/* RESUMO DO PEDIDO */}
      <button
        type="button"
        onClick={() =>
          setPedidoAberto(aberto ? null : pedido.id)
        }
        className="w-full p-5 text-left transition hover:bg-gray-50"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">
              Pedido #{pedido.id}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {pedido.nome_loja}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Realizado em {formatarData(pedido.data_pedido)}
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusClasses[pedido.status] ||
              "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabels[pedido.status] || pedido.status}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <div>
            <span className="text-sm text-gray-500">Total</span>
            <strong className="ml-2 text-lg text-green-800">
              {Number(pedido.total || 0).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </strong>
          </div>

          <span className="text-sm font-semibold text-green-700">
            {aberto ? "Ocultar detalhes ▲" : "Ver detalhes ▼"}
          </span>
        </div>
      </button>

      {/* DETALHES */}
      {aberto && (
        <div className="border-t bg-gray-50 px-5 py-5">
          <h3 className="font-semibold text-gray-800">
            Itens do pedido
          </h3>

          <div className="mt-3 space-y-3">
            {pedido.itens.map((item) => (
              <div
                key={item.item_id}
                className="flex items-center justify-between gap-4 rounded-xl bg-white p-3"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {item.nome_item}
                  </p>

                  <p className="text-sm text-gray-500">
                    {item.quantidade}x ·{" "}
                    {Number(item.preco_unitario).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )}
                  </p>
                </div>

                <strong className="text-gray-800">
                  {Number(
                    item.preco_unitario * item.quantidade
                  ).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
            ))}
          </div>

          {/* ENTREGA */}
          <div className="mt-5 rounded-xl bg-white p-4">
            <h3 className="font-semibold text-gray-800">
              Forma de recebimento
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {pedido.modalidade_entrega === "entrega"
                ? "🚚 Entrega"
                : "🏪 Retirada na loja"}
            </p>
          </div>

          {/* VALORES */}
          <div className="mt-5 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>
                {Number(pedido.subtotal || 0).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Entrega</span>
              <span>
                {Number(pedido.valor_entrega || 0).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )}
              </span>
            </div>

            <div className="flex justify-between border-t pt-3 text-base font-bold">
              <span>Total</span>
              <span className="text-green-800">
                {Number(pedido.total || 0).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                )}
              </span>
            </div>
          </div>

          {STATUS_CANCELAVEIS.includes(pedido.status) && (
            <div className="mt-5 border-t pt-4">
              <button
                type="button"
                onClick={() => cancelarPedido(pedido)}
                disabled={cancelando === pedido.id}
                className="w-full rounded-xl border border-red-200 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 sm:w-auto sm:px-6"
              >
                {cancelando === pedido.id ? "Cancelando..." : "Cancelar pedido"}
              </button>
              {pedido.status === "pago" && (
                <p className="mt-2 text-xs text-gray-500">
                  Pedidos pagos podem ser cancelados até a loja começar o preparo. O valor é devolvido pelo Mercado Pago.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
})}
          </div>
        )}
      </main>
    </div>
  );
}
