import { useCallback, useEffect, useState } from "react";
import MensagemStatus from "@/components/ui/MensagemStatus";
import { cancelarPedidoAdmin, listarPedidosAdmin } from "@/services/adminService";
import { formatarDataHora, formatarMoeda } from "@/utils/formatadores";
import { STATUS_PEDIDO, formatarStatus } from "@/utils/statusPedido";
import { mensagemDeErro } from "./mensagemDeErro";

// Mesma regra do backend: pedidos que já saíram da loja não são cancelados.
const CANCELAVEIS = ["aguardando_pagamento", "pago", "em_preparo", "pronto_para_retirada"];

const ROTULO_PAGAMENTO = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
  expirado: "Expirado",
  estornado: "Estornado",
};

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [cancelando, setCancelando] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setPedidos(await listarPedidosAdmin());
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível carregar os pedidos.") });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function cancelar(pedido) {
    const aviso = pedido.pagamento_status === "aprovado"
      ? `Cancelar o pedido #${pedido.id}? O valor pago será estornado ao cliente pelo Mercado Pago.`
      : `Cancelar o pedido #${pedido.id}?`;
    if (!window.confirm(aviso)) return;

    setCancelando(pedido.id);
    try {
      const resposta = await cancelarPedidoAdmin(pedido.id);
      setMensagem({ tipo: "sucesso", texto: resposta.mensagem });
      carregar();
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível cancelar o pedido.") });
    } finally {
      setCancelando(null);
    }
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-gray-600">Os 200 pedidos mais recentes.</p>
      <MensagemStatus mensagem={mensagem} />
      {carregando && <p className="text-gray-600">Carregando pedidos...</p>}
      {!carregando && pedidos.length === 0 && <p className="text-gray-600">Nenhum pedido ainda.</p>}

      {pedidos.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-green-50 text-green-900">
              <tr>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="border-t">
                  <td className="px-4 py-3 font-semibold">#{pedido.id}</td>
                  <td className="px-4 py-3">{formatarDataHora(pedido.data_pedido)}</td>
                  <td className="px-4 py-3">{pedido.loja}</td>
                  <td className="px-4 py-3">{pedido.cliente}</td>
                  <td className="px-4 py-3">{formatarMoeda(pedido.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_PEDIDO[pedido.status]?.classes || "bg-gray-100 text-gray-700"}`}>
                      {formatarStatus(pedido.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{ROTULO_PAGAMENTO[pedido.pagamento_status] || "Sem pagamento"}</td>
                  <td className="px-4 py-3">
                    {CANCELAVEIS.includes(pedido.status) && (
                      <button
                        type="button"
                        disabled={cancelando === pedido.id}
                        onClick={() => cancelar(pedido)}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancelando === pedido.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
