import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
export default function RelatoriosPage() {
  const navigate = useNavigate();

  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const carregarRelatorio = async (inicio = "", fim = "") => {
    try {
      setCarregando(true);
      setErro("");

      const params = {};

      if (inicio && fim) {
        params.data_inicial = inicio;
        params.data_final = fim;
      }

      const resposta = await api.get("/relatorios", { params });

      setRelatorio(resposta.data);
    } catch (error) {
      console.error("Erro ao carregar relatório:", error?.response?.status ?? error?.message);

      setErro(
        error.response?.data?.mensagem ||
        "Não foi possível carregar os relatórios."
      );
    } finally {
      setCarregando(false);
    }
  };

  const aplicarFiltro = () => {
    if (!dataInicial || !dataFinal) {
      setErro("Informe a data inicial e a data final.");
      return;
    }

    if (dataInicial > dataFinal) {
      setErro("A data inicial não pode ser posterior à data final.");
      return;
    }

    carregarRelatorio(dataInicial, dataFinal);
  };

  const carregarMesAtual = () => {
    setDataInicial("");
    setDataFinal("");
    carregarRelatorio();
  };

  useEffect(() => {
    carregarRelatorio();
  }, []);

  function formatarStatus(status) {
    const statusMap = {
      aguardando_pagamento: "Aguardando pagamento",
      confirmado: "Confirmado",
      pago: "Pago",
      em_preparo: "Em preparo",
      pronto_para_retirada: "Pronto para retirada",
      em_entrega: "Em entrega",
      entregue: "Entregue",
      cancelado: "Cancelado",
      concluido: "Concluído",
      expirado: "Expirado",
      recusado: "Recusado",
    };

    return statusMap[status] || status;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* HEADER */}
      <header className="rounded-b-3xl bg-gradient-to-r from-green-200 to-green-300 p-8 shadow-md sm:p-10">
        <button
          type="button"
          onClick={() => navigate("/perfil-lojista")}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-green-900 hover:underline"
        >
          <FaArrowLeft />
          Voltar ao painel
        </button>

        <h1 className="text-3xl font-bold text-green-900">
          Relatórios
        </h1>

        <p className="mt-2 text-green-800">
          Acompanhe as vendas, receitas e o desempenho da sua loja.
        </p>
      </header>

      {/* CARREGANDO */}
      {carregando && (
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <p className="text-gray-600">
            Carregando relatórios...
          </p>
        </div>
      )}

      {/* ERRO */}
      {!carregando && erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">
            Não foi possível carregar os relatórios
          </p>

          <p className="mt-1 text-sm">
            {erro}
          </p>

          <button
            type="button"
            onClick={carregarRelatorio}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* CONTEÚDO */}
      {!carregando && !erro && relatorio && (
        <>
          {/* FILTRO DE PERÍODO */}
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-lg font-bold text-gray-800">
              Período
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="data-inicial"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Data inicial
                </label>

                <input
                  id="data-inicial"
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <label
                  htmlFor="data-final"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Data final
                </label>

                <input
                  id="data-final"
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={aplicarFiltro}
                  className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
                >
                  Aplicar
                </button>

                <button
                  type="button"
                  onClick={carregarMesAtual}
                  className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Mês atual
                </button>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Exibindo:{" "}
              <strong>
                {relatorio.periodo.data_inicial}
              </strong>{" "}
              até{" "}
              <strong>
                {relatorio.periodo.data_final}
              </strong>
            </p>
          </section>

          {/* RESUMO FINANCEIRO */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              Resumo financeiro
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CardResumo
                titulo="Receita total"
                valor={`R$ ${Number(
                  relatorio.resumo_financeiro.receita_total
                ).toFixed(2)}`}
              />

              <CardResumo
                titulo="Receita de produtos"
                valor={`R$ ${Number(
                  relatorio.resumo_financeiro.receita_produtos
                ).toFixed(2)}`}
              />

              <CardResumo
                titulo="Receita de serviços"
                valor={`R$ ${Number(
                  relatorio.resumo_financeiro.receita_servicos
                ).toFixed(2)}`}
              />

              <CardResumo
                titulo="Pedidos pagos"
                valor={relatorio.resumo_financeiro.pedidos_pagos}
              />

              <CardResumo
                titulo="Agendamentos pagos"
                valor={relatorio.resumo_financeiro.agendamentos_pagos}
              />

              <CardResumo
                titulo="Ticket médio"
                valor={`R$ ${Number(
                  relatorio.resumo_financeiro.ticket_medio_pedido
                ).toFixed(2)}`}
              />

              <CardResumo
                titulo="Comissão PetCare"
                valor={formatarMoeda(relatorio.resumo_financeiro.comissao_total)}
              />

              <CardResumo
                titulo="Tarifa Mercado Pago"
                valor={formatarMoeda(relatorio.resumo_financeiro.tarifa_total)}
              />

              <CardResumo
                titulo="Valor líquido (seu)"
                valor={formatarMoeda(relatorio.resumo_financeiro.valor_liquido)}
              />
            </div>
          </section>

          {/* DIVISÃO DE CADA VENDA */}
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-800">
              Vendas e valores recebidos
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              O pagamento cai na sua conta Mercado Pago já com a comissão da PetCare e a tarifa do Mercado Pago descontadas.
            </p>

            {!relatorio.vendas?.length ? (
              <p className="mt-4 text-gray-500">
                Nenhuma venda paga no período.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-600">
                      <th className="px-3 py-3">Data</th>
                      <th className="px-3 py-3">Venda</th>
                      <th className="px-3 py-3">Total pago</th>
                      <th className="px-3 py-3">Tarifa MP</th>
                      <th className="px-3 py-3">Comissão</th>
                      <th className="px-3 py-3">Você recebe</th>
                    </tr>
                  </thead>

                  <tbody>
                    {relatorio.vendas.map((venda) => {
                      const estornada = venda.status === "estornado";
                      return (
                        <tr
                          key={venda.pagamento_id}
                          className={`border-b last:border-0 ${estornada ? "text-gray-400" : ""}`}
                        >
                          <td className="px-3 py-3">
                            {new Date(venda.data).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-3 py-3">
                            {venda.tipo === "pedido" ? "Pedido" : "Agendamento"} #{venda.referencia_id}
                            {estornada && (
                              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                Estornada
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">{formatarMoeda(venda.valor)}</td>
                          <td className="px-3 py-3">
                            {venda.tarifa_gateway === null ? "—" : formatarMoeda(venda.tarifa_gateway)}
                          </td>
                          <td className="px-3 py-3">
                            {venda.comissao === null ? "—" : formatarMoeda(venda.comissao)}
                          </td>
                          <td className="px-3 py-3 font-semibold">
                            {estornada ? formatarMoeda(0) : formatarMoeda(venda.valor_liquido)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-gray-500">
                  "—" indica valor ainda não informado pelo Mercado Pago ou venda anterior ao novo modelo de recebimento.
                </p>
              </div>
            )}
          </section>

          {/* VENDAS POR PERÍODO */}
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-800">
              Vendas por período
            </h2>

            {relatorio.vendas_por_periodo.length === 0 ? (
              <p className="mt-4 text-gray-500">
                Nenhuma venda encontrada no período.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-600">
                      <th className="px-3 py-3">Data</th>
                      <th className="px-3 py-3">Produtos</th>
                      <th className="px-3 py-3">Serviços</th>
                      <th className="px-3 py-3">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {relatorio.vendas_por_periodo.map((venda) => (
                      <tr
                        key={venda.data}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-3">
                          {new Date(venda.data).toLocaleDateString("pt-BR")}
                        </td>

                        <td className="px-3 py-3">
                          R$ {Number(venda.receita_produtos).toFixed(2)}
                        </td>

                        <td className="px-3 py-3">
                          R$ {Number(venda.receita_servicos).toFixed(2)}
                        </td>

                        <td className="px-3 py-3 font-semibold">
                          R$ {Number(venda.receita_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* PRODUTOS */}
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-800">
              Produtos mais vendidos
            </h2>

            {relatorio.produtos_mais_vendidos.length === 0 ? (
              <p className="mt-4 text-gray-500">
                Nenhum produto vendido no período.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {relatorio.produtos_mais_vendidos.map((produto) => (
                  <div
                    key={produto.produto_id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {produto.nome}
                      </p>

                      <p className="text-sm text-gray-500">
                        {produto.quantidade_vendida} unidades
                      </p>
                    </div>

                    <p className="font-semibold text-gray-800">
                      R$ {Number(produto.receita).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* AGENDAMENTOS */}
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-800">
              Agendamentos
            </h2>

            <p className="mt-2 text-gray-600">
              Total no período:{" "}
              <strong>
                {relatorio.agendamentos_servicos.total}
              </strong>
            </p>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-800">
                Por status
              </h3>

              <div className="mt-3 space-y-2">
                {relatorio.agendamentos_servicos.porStatus.map(
                  (item) => (
                    <div
                      key={item.status}
                      className="flex justify-between rounded-lg bg-gray-50 px-4 py-3"
                    >
                      <span>{formatarStatus(item.status)}</span>
                      <strong>{item.total}</strong>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-gray-800">
                Serviços mais agendados
              </h3>

              <div className="mt-3 space-y-3">
                {relatorio.agendamentos_servicos.servicosMaisAgendados.map(
                  (servico) => (
                    <div
                      key={servico.servico_id}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {servico.nome}
                        </p>

                        <p className="text-sm text-gray-500">
                          {servico.total_agendamentos} agendamentos
                        </p>
                      </div>

                      <div className="text-right text-sm">
                        <p>
                          Concluídos: {servico.concluidos}
                        </p>

                        <p>
                          Cancelados: {servico.cancelados}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CardResumo({ titulo, valor }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <p className="text-sm font-medium text-gray-500">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-bold text-green-700">
        {valor}
      </p>
    </div>
  );
}