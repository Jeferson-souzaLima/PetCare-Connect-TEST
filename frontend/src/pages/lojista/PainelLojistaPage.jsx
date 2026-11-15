import {
  FaBoxOpen,
  FaClipboardList,
  FaChartLine,
  FaUserEdit,
  FaRegCalendarAlt,
  FaHeadset,
  FaSignOutAlt,
  FaBox,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AvisoLojaPendente from "../../components/perfil/AvisoLojaPendente";

export default function PainelLojistaPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600 text-lg">Usuário não logado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">

      {/* ================= HEADER ================= */}
      <header className="bg-gradient-to-r from-green-200 to-green-300 shadow-md rounded-b-3xl p-10 mb-2">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-900">
              Painel de Gestão
            </h1>

            <p className="text-green-800 mt-2">
              Gerencie seus produtos, serviços e operações.
            </p>
          </div>
        </div>
      </header>

      <AvisoLojaPendente />

      {/* ================= MÉTRICAS ================= */}
      {/* <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-4 mb-12">
        <MetricCard title="Produtos Ativos" value="—" />
        <MetricCard title="Serviços Ativos" value="—" />
        <MetricCard title="Pedidos do Mês" value="—" />
      </section> */}

      {/* ================= AÇÕES PRINCIPAIS ================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
        <ActionCard
          icon={<FaBoxOpen />}
          title="Produtos"
          description="Cadastrar, editar e gerenciar produtos"
          onClick={() => navigate("/lojista/produtos")}
        />

        <ActionCard
          icon={<FaClipboardList />}
          title="Serviços"
          description="Adicionar e organizar serviços"
          onClick={() => navigate("/lojista/servicos")}
        />

        <ActionCard
          icon={<FaBox />}
          title="Pedidos"
          description="Visualizar e gerenciar seus pedidos"
          onClick={() => navigate("/lojista/pedidos")}
        />
          
        <ActionCard
          icon={<FaRegCalendarAlt />}
          title="Agenda"
          description="Visualizar e gerenciar seus compromissos"
          onClick={() => navigate("/lojista/agenda")}
        />

        <ActionCard
          icon={<FaChartLine />}
          title="Relatórios"
          description="Visualizar vendas e desempenho"
          onClick={() => navigate("/lojista/relatorios")}
        />

        <ActionCard
          icon={<FaHeadset />}
          title="Ajuda e Suporte"
          description="Dúvidas ou problemas?
          Nossa equipe especializada ajuda você."
          onClick={() => navigate("/lojista/ajuda-suporte")}
        />
      </section>

      {/* ================= CONFIGURAÇÕES ================= */}
      <section className="px-4 mt-14">
        <h2 className="text-lg font-semibold text-green-900 mb-6">
          Configurações
        </h2>

        <div
          onClick={() => navigate("/lojista/perfil")}
          className="flex items-center gap-5 p-6 rounded-2xl shadow bg-white hover:shadow-xl hover:bg-green-50 transition cursor-pointer"
        >
          <div className="p-4 rounded-full bg-green-100 text-green-900 text-xl">
            <FaUserEdit />
          </div>

          <div>
            <p className="font-semibold text-green-900 text-lg">
              Dados da Loja
            </p>
            <p className="text-sm text-gray-600">
              Atualize informações do seu perfil
            </p>
          </div>
        </div>

        <div
          onClick={() => {
            const confirmar = window.confirm(
              "Tem certeza que deseja sair da sua conta?"
            );

            if (confirmar) {
              logout();
              navigate("/login");
            }
          }}
          className="flex items-center gap-5 p-6 mt-4 rounded-2xl shadow bg-white hover:shadow-xl hover:bg-red-50 transition cursor-pointer"
        >
          <div className="p-4 rounded-full bg-red-100 text-red-600 text-xl">
            <FaSignOutAlt />
          </div>

          <div>
            <p className="font-semibold text-red-600 text-lg">
              Sair
            </p>
            <p className="text-sm text-gray-600">
              Encerrar sua sessão
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-6 p-7 rounded-2xl shadow-md bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-transparent hover:border-green-200"
    >
      <div className="p-5 rounded-full bg-green-900 text-white text-2xl group-hover:scale-110 transition">
        {icon}
      </div>

      <div>
        <p className="font-semibold text-green-900 text-lg">{title}</p>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-green-900 mt-2">{value}</p>
    </div>
  );
}