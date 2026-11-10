import {
  FaBoxOpen,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaMapMarkerAlt,
  FaPhone,
  FaStickyNote,
  FaStore,
  FaTruck,
  FaUser,
} from "react-icons/fa";

import AcoesPedido from "./AcoesPedido";
import InfoItem from "./InfoItem";
import LinhaValor from "./LinhaValor";
import StatusBadge from "./StatusBadge";
import { formatarDataHora as formatarData, formatarMoeda } from "../../utils/formatadores";

/** Card expansível com resumo, itens, entrega, valores e ações de um pedido. */
export default function PedidoCard({
  pedido,
  aberto,
  onToggle,
}) {
  return (
    <article
      className={`bg-white rounded-2xl shadow-md border transition ${
        aberto
          ? "border-green-200 shadow-lg"
          : "border-gray-100 hover:shadow-lg"
      }`}
    >

      {/* RESUMO */}

      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-5 sm:p-6"
      >

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="flex-1">

            <div className="flex flex-wrap items-center gap-3">

              <h3 className="text-xl font-bold text-green-900">
                #{pedido.id}
              </h3>

              <StatusBadge status={pedido.status} />

            </div>

            <p className="font-medium text-gray-800 mt-2">
              {pedido.nome_contato || "Cliente não informado"}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-2">

              <span className="flex items-center gap-1">
                <FaCalendarAlt />
                {formatarData(pedido.data_pedido)}
              </span>

              <span className="flex items-center gap-1">
                {pedido.modalidade_entrega === "entrega" ? (
                  <FaTruck />
                ) : (
                  <FaStore />
                )}

                {pedido.modalidade_entrega === "entrega"
                  ? "Entrega"
                  : "Retirada"}
              </span>

              <span className="flex items-center gap-1">
                <FaBoxOpen />
                {pedido.itens?.length || 0}{" "}
                {pedido.itens?.length === 1
                  ? "item"
                  : "itens"}
              </span>

            </div>

          </div>

          <div className="flex items-center justify-between lg:justify-end gap-5">

            <div className="text-left lg:text-right">

              <p className="text-xs text-gray-500">
                Total
              </p>

              <p className="text-xl font-bold text-green-900">
                {formatarMoeda(pedido.total)}
              </p>

            </div>

            <div className="p-3 rounded-full bg-green-50 text-green-900">
              {aberto ? (
                <FaChevronUp />
              ) : (
                <FaChevronDown />
              )}
            </div>

          </div>

        </div>

      </button>

      {/* DETALHES */}

      {aberto && (
        <div className="border-t border-gray-100 p-5 sm:p-6">

          {/* CLIENTE */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <InfoItem
              icon={<FaUser />}
              label="Cliente"
              value={
                pedido.nome_contato ||
                "Não informado"
              }
            />

            <InfoItem
              icon={<FaPhone />}
              label="Telefone"
              value={
                pedido.telefone_contato ||
                "Não informado"
              }
            />

          </div>

          {/* ITENS */}

          <div className="mt-6">

            <h4 className="font-semibold text-green-900 mb-3">
              Itens do pedido
            </h4>

            <div className="space-y-3">

              {pedido.itens?.map((item) => (
                <div
                  key={item.item_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50 rounded-xl p-4"
                >

                  <div>

                    <p className="font-medium text-gray-800">
                      {item.nome_item}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.quantidade}x{" "}
                      {formatarMoeda(
                        item.preco_unitario
                      )}
                    </p>

                  </div>

                  <p className="font-semibold text-green-900">
                    {formatarMoeda(
                      Number(item.preco_unitario) *
                        Number(item.quantidade)
                    )}
                  </p>

                </div>
              ))}

            </div>

          </div>

          {/* ENTREGA */}

          {pedido.modalidade_entrega === "entrega" && (
            <div className="mt-6">

              <h4 className="font-semibold text-green-900 mb-3">
                Endereço de entrega
              </h4>

              <div className="bg-gray-50 rounded-xl p-4">

                <div className="flex items-start gap-3">

                  <div className="p-3 rounded-xl bg-green-50 text-green-900">
                    <FaMapMarkerAlt />
                  </div>

                  <div className="text-sm text-gray-700">

                    <p>
                      {pedido.endereco_entrega},{" "}
                      {pedido.numero_entrega}
                    </p>

                    {pedido.complemento_entrega && (
                      <p>
                        {pedido.complemento_entrega}
                      </p>
                    )}

                    <p>
                      {pedido.bairro_entrega}
                    </p>

                    <p>
                      {pedido.cidade_entrega} -{" "}
                      {pedido.uf_entrega}
                    </p>

                    <p>
                      CEP: {pedido.cep_entrega}
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* OBSERVAÇÃO */}

          {pedido.observacao && (
            <div className="mt-6">

              <h4 className="font-semibold text-green-900 mb-3">
                Observação
              </h4>

              <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-xl p-4">

                <div className="text-yellow-700 mt-1">
                  <FaStickyNote />
                </div>

                <p className="text-sm text-gray-700">
                  {pedido.observacao}
                </p>

              </div>

            </div>
          )}

          {/* VALORES */}

          <div className="border-t border-gray-100 mt-6 pt-5">

            <div className="space-y-2 text-sm">

              <LinhaValor
                label="Subtotal"
                valor={pedido.subtotal}
              />

              <LinhaValor
                label={
                  pedido.modalidade_entrega ===
                  "entrega"
                    ? "Taxa de entrega"
                    : "Entrega"
                }
                valor={pedido.valor_entrega}
              />

              <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">

                <span className="font-bold text-gray-800">
                  Total
                </span>

                <span className="text-xl font-bold text-green-900">
                  {formatarMoeda(pedido.total)}
                </span>

              </div>

            </div>

          </div>

          {/* AÇÕES DE STATUS */}

          <AcoesPedido pedido={pedido} />

        </div>
      )}

    </article>
  );
}
