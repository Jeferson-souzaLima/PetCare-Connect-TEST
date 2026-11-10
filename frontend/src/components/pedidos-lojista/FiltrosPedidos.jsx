import { FaSearch } from "react-icons/fa";

import FiltroSelect from "./FiltroSelect";

/** Busca textual + selects de período, status e ordenação. */
export default function FiltrosPedidos({
  busca,
  setBusca,
  periodo,
  setPeriodo,
  statusFiltro,
  setStatusFiltro,
  ordenacao,
  setOrdenacao,
}) {
  return (
    <section className="px-2 mb-6">

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">

        {/* BUSCA */}

        <div className="relative mb-5">

          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pedido, cliente, telefone ou produto..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300"
          />

        </div>

        {/* FILTROS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <FiltroSelect
            label="Período"
            value={periodo}
            onChange={setPeriodo}
            options={[
              ["hoje", "Hoje"],
              ["ontem", "Ontem"],
              ["7dias", "Últimos 7 dias"],
              ["30dias", "Últimos 30 dias"],
              ["todos", "Todos"],
            ]}
          />

          <FiltroSelect
            label="Status"
            value={statusFiltro}
            onChange={setStatusFiltro}
            options={[
              ["todos", "Todos os status"],
              ["aguardando_pagamento", "Aguardando pagamento"],
              ["pago", "Pago"],
              ["em_preparo", "Em preparo"],
              [
                "pronto_para_retirada",
                "Pronto para retirada",
              ],
              ["em_entrega", "Em entrega"],
              ["entregue", "Entregues"],
              ["cancelado", "Cancelados"],
              ["andamento", "Em andamento"],
              ["finais", "Finalizados"],
            ]}
          />

          <FiltroSelect
            label="Ordenação"
            value={ordenacao}
            onChange={setOrdenacao}
            options={[
              ["recentes", "Mais recentes"],
              ["antigos", "Mais antigos"],
              ["maior_valor", "Maior valor"],
              ["menor_valor", "Menor valor"],
            ]}
          />

        </div>

      </div>
    </section>
  );
}
