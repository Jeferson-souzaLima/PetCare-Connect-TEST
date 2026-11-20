import { useCallback, useEffect, useState } from "react";
import MensagemStatus from "@/components/ui/MensagemStatus";
import { listarEstornosAdmin, tentarEstornoAdmin } from "@/services/adminService";
import { formatarDataHora, formatarMoeda } from "@/utils/formatadores";
import { mensagemDeErro } from "./mensagemDeErro";

const descreverVenda = (estorno) =>
  `${estorno.tipo_referencia === "pedido" ? "Pedido" : "Agendamento"} #${estorno.referencia_id}`;

export default function EstornosAdmin() {
  const [estornos, setEstornos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tentando, setTentando] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setEstornos(await listarEstornosAdmin());
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível carregar os estornos.") });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function tentar(estorno) {
    if (!window.confirm(`Tentar de novo o estorno de ${formatarMoeda(estorno.valor)} (${descreverVenda(estorno)})?`)) return;

    setTentando(estorno.id);
    try {
      const resposta = await tentarEstornoAdmin(estorno.id);
      setMensagem({ tipo: "sucesso", texto: resposta.mensagem });
      carregar();
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "O estorno foi recusado de novo.") });
      carregar();
    } finally {
      setTentando(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 text-sm text-gray-700 shadow">
        <p>
          Estornos que o Mercado Pago recusou. A causa mais comum é a loja estar sem saldo: no split, a devolução sai
          da conta Mercado Pago da loja. Os administradores e a loja recebem um e-mail quando isso acontece.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Pendente:</strong> a venda já foi cancelada e o dinheiro precisa voltar ao cliente. O sistema tenta de novo a cada 30 minutos.</li>
          <li><strong>Cancelamento não concluído:</strong> alguém tentou cancelar e o estorno falhou, então a venda continua ativa. Fale com a loja e, depois, cancele de novo.</li>
        </ul>
      </div>

      <MensagemStatus mensagem={mensagem} />
      {carregando && <p className="text-gray-600">Carregando estornos...</p>}
      {!carregando && estornos.length === 0 && <p className="text-gray-600">Nenhum estorno com problema. Tudo certo.</p>}

      {estornos.length > 0 && (
        <div className="overflow-x-auto rounded-2xl bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-green-50 text-green-900">
              <tr>
                <th className="px-4 py-3">Venda</th>
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3">Última recusa</th>
                <th className="px-4 py-3">Erro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {estornos.map((estorno) => (
                <tr key={estorno.id} className="border-t align-top">
                  <td className="px-4 py-3 font-semibold">{descreverVenda(estorno)}</td>
                  <td className="px-4 py-3">{estorno.loja || "—"}</td>
                  <td className="px-4 py-3">{formatarMoeda(estorno.valor)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${estorno.pendente ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {estorno.pendente ? "Pendente" : "Cancelamento não concluído"}
                    </span>
                    {estorno.pendente && (
                      <span className="mt-1 block text-xs text-gray-500">desde {formatarDataHora(estorno.estorno_pendente_desde)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatarDataHora(estorno.estorno_ultima_falha_em)}</td>
                  <td className="max-w-[240px] break-words px-4 py-3 text-xs text-gray-600">{estorno.estorno_ultimo_erro}</td>
                  <td className="px-4 py-3">
                    {estorno.pendente && (
                      <button
                        type="button"
                        disabled={tentando === estorno.id}
                        onClick={() => tentar(estorno)}
                        className="whitespace-nowrap rounded-lg bg-green-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                      >
                        {tentando === estorno.id ? "Tentando..." : "Tentar de novo"}
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
