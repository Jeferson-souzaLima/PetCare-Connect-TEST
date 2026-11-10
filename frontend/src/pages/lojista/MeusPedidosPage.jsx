import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaSyncAlt,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import pedidoService from "../../services/pedidoService";
import CabecalhoPedidos from "../../components/pedidos-lojista/CabecalhoPedidos";
import ResumoCard from "../../components/pedidos-lojista/ResumoCard";
import AlertaPedidosAntigos from "../../components/pedidos-lojista/AlertaPedidosAntigos";
import FiltrosPedidos from "../../components/pedidos-lojista/FiltrosPedidos";
import PedidoCard from "../../components/pedidos-lojista/PedidoCard";
import {
  filtrarPedidos,
  pedidoEhDeHoje,
  pedidoEstaEmAndamento,
} from "../../utils/filtrosPedidos";

export default function MeusPedidosPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const [pedidoAberto, setPedidoAberto] = useState(null);

  const [periodo, setPeriodo] = useState("hoje");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState("recentes");

  async function carregarPedidos(exibirCarregamento = true) {
    try {
      if (exibirCarregamento) {
        setCarregando(true);
      } else {
        setAtualizando(true);
      }

      setErro("");

      const response = await pedidoService.listarPedidosLoja(token);

      setPedidos(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);

      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os pedidos."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    if (token) {
      carregarPedidos();
    }
  }, [token]);

  /*
   * Pedidos antigos que ainda precisam de atenção.
   */
  const pedidosAntigosEmAndamento = useMemo(() => {
    return pedidos.filter(
      (pedido) =>
        !pedidoEhDeHoje(pedido) &&
        pedidoEstaEmAndamento(pedido)
    );
  }, [pedidos]);

  /*
   * =========================================================
   * INDICADORES
   * =========================================================
   */

  const quantidadeHoje = useMemo(() => {
    return pedidos.filter(pedidoEhDeHoje).length;
  }, [pedidos]);

  const quantidadeEmAndamento = useMemo(() => {
    return pedidos.filter(pedidoEstaEmAndamento).length;
  }, [pedidos]);

  const quantidadeEntregues = useMemo(() => {
    return pedidos.filter(
      (pedido) => pedido.status === "entregue"
    ).length;
  }, [pedidos]);

  const quantidadeCancelados = useMemo(() => {
    return pedidos.filter(
      (pedido) => pedido.status === "cancelado"
    ).length;
  }, [pedidos]);

  /*
   * =========================================================
   * FILTROS
   * =========================================================
   */

  const pedidosFiltrados = useMemo(
    () => filtrarPedidos(pedidos, { periodo, statusFiltro, busca, ordenacao }),
    [pedidos, periodo, statusFiltro, busca, ordenacao]
  );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  if (carregando) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-center py-20">
          <FaSyncAlt className="animate-spin text-green-900 text-2xl mr-3" />

          <p className="text-gray-600 text-lg">
            Carregando pedidos...
          </p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-700 font-medium">
            {erro}
          </p>

          <button
            onClick={() => carregarPedidos()}
            className="mt-4 px-5 py-2 rounded-xl bg-green-900 text-white hover:bg-green-800 transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">

      <CabecalhoPedidos
        onVoltar={() => navigate("/perfil-lojista")}
        onAtualizar={() => carregarPedidos(false)}
        atualizando={atualizando}
      />

      {/* =====================================================
          INDICADORES
      ====================================================== */}

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2 mb-6">

        <ResumoCard
          icon={<FaCalendarAlt />}
          titulo="Hoje"
          valor={quantidadeHoje}
        />

        <ResumoCard
          icon={<FaClock />}
          titulo="Em andamento"
          valor={quantidadeEmAndamento}
          destaque={
            pedidosAntigosEmAndamento.length > 0
          }
        />

        <ResumoCard
          icon={<FaCheckCircle />}
          titulo="Entregues"
          valor={quantidadeEntregues}
        />

        <ResumoCard
          icon={<FaExclamationTriangle />}
          titulo="Cancelados"
          valor={quantidadeCancelados}
        />

      </section>

      {pedidosAntigosEmAndamento.length > 0 && (
        <AlertaPedidosAntigos
          quantidade={pedidosAntigosEmAndamento.length}
          onVerPedidos={() => {
            setPeriodo("todos");
            setStatusFiltro("andamento");
          }}
        />
      )}

      <FiltrosPedidos
        busca={busca}
        setBusca={setBusca}
        periodo={periodo}
        setPeriodo={setPeriodo}
        statusFiltro={statusFiltro}
        setStatusFiltro={setStatusFiltro}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
      />

      {/* =====================================================
          RESULTADO
      ====================================================== */}

      <section className="px-2">

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="text-lg font-semibold text-green-900">
              Pedidos
            </h2>

            <p className="text-sm text-gray-500">
              {pedidosFiltrados.length}{" "}
              {pedidosFiltrados.length === 1
                ? "pedido encontrado"
                : "pedidos encontrados"}
            </p>
          </div>

        </div>

        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-10 text-center">

            <div className="flex justify-center mb-4">
              <div className="p-5 rounded-full bg-green-100 text-green-900 text-3xl">
                <FaBoxOpen />
              </div>
            </div>

            <h2 className="text-xl font-semibold text-green-900">
              Nenhum pedido encontrado
            </h2>

            <p className="text-gray-600 mt-2">
              Tente alterar os filtros ou realizar uma nova busca.
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {pedidosFiltrados.map((pedido) => (
              <PedidoCard
                key={pedido.id}
                pedido={pedido}
                aberto={pedidoAberto === pedido.id}
                onToggle={() =>
                  setPedidoAberto(
                    pedidoAberto === pedido.id
                      ? null
                      : pedido.id
                  )
                }
              />
            ))}

          </div>
        )}

      </section>
    </div>
  );
}
