import { createBrowserRouter } from "react-router-dom";
import Layout from "../layout/Layout";
import { useAuth } from "../hooks/useAuth";

// Páginas públicas
import NovaHomePage from "../pages/NovaHomePage";
import HomeLojistaPage from "../pages/lojista/HomeLojistaPage";
import ProdutoDetalhes from "../pages/ProdutoDetalhes";
import LojaDetalhes from "../pages/LojaDetalhes";
import ResultadosBuscaPage from "../pages/ResultadosBuscaPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import RegisterLojista from "../pages/RegisterLojista";
import VerificarEmailPage from "../pages/VerificarEmailPage";
import EsqueciSenhaPage from "../pages/EsqueciSenhaPage";
import RedefinirSenhaPage from "../pages/RedefinirSenhaPage";
import TermosUsoPage from "../pages/legal/TermosUsoPage";
import PoliticaPrivacidadePage from "../pages/legal/PoliticaPrivacidadePage";

// Cliente
import PerfilPage from "../pages/cliente/PerfilPage";
import CarrinhoPage from "../pages/CarrinhoPage";
import Agendamento from "../pages/Agendamento";
import MeusAgendamentosPage from "../pages/cliente/MeusAgendamentosPage";
import FavoritosPage from "../pages/cliente/FavoritosPage";
import PagamentoRetornoPage from "../pages/PagamentoRetornoPage";
import MeusPedidosPage from "../pages/cliente/MeusPedidosPage";

// Lojista
import PainelLojistaPage from "../pages/lojista/PainelLojistaPage";
import ProdutosLojistaPage from "../pages/lojista/ProdutosLojistaPage";
import AgendaLojistaPage from "../pages/lojista/AgendaLojistaPage";
import ConfiguracoesAgendaPage from "../pages/lojista/ConfiguracoesAgendaPage";
import DadosLojaPage from "../pages/lojista/DadosLojaPage";
import AjudaSuportePage from "../pages/lojista/AjudaSuportePage";
import RelatoriosPage from "../pages/lojista/RelatoriosPage";
import MeusPedidosLojistaPage from "../pages/lojista/MeusPedidosPage";

// Proteção
import PrivateRoute from "../components/navigation/PrivateRoute";
import ServicosLojistaPage from "../pages/lojista/ServicosLojistaPage";

// Admin
import AdminPage from "../pages/admin/AdminPage";


function HomeRoute() {
  const { usuario } = useAuth();

  // O lojista mantém a home e o Layout atuais; cliente e visitante usam a nova home,
  // que tem cabeçalho e barra inferior próprios.
  if (usuario?.tipo === "lojista") {
    return (
      <Layout>
        <HomeLojistaPage />
      </Layout>
    );
  }

  return <NovaHomePage />;
}


export const router = createBrowserRouter([
  // ===============================
  // PÚBLICAS
  // ===============================
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/register-lojista", element: <RegisterLojista /> },
  { path: "/verificar-email", element: <VerificarEmailPage /> },
  { path: "/esqueci-senha", element: <EsqueciSenhaPage /> },
  { path: "/redefinir-senha", element: <RedefinirSenhaPage /> },
  { path: "/termos", element: <TermosUsoPage /> },
  { path: "/privacidade", element: <PoliticaPrivacidadePage /> },
  { path: "/", element: <HomeRoute /> },

  {
    element: <Layout />,
    children: [
      { path: "/busca", element: <ResultadosBuscaPage /> },
      { path: "/produtos/:id", element: <ProdutoDetalhes /> },
      { path: "/lojas/:id", element: <LojaDetalhes /> },
      { path: "/pagamento/:estado", element: <PagamentoRetornoPage /> },

      // ===============================
      // CLIENTE
      // ===============================
      {
        path: "/perfil",
        element: (
          <PrivateRoute role="cliente">
            <PerfilPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/meus-pedidos",
        element: (
          <PrivateRoute role="cliente">
            <MeusPedidosPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/carrinho",
        element: (
          <PrivateRoute role="cliente">
            <CarrinhoPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/agendar/:lojaId/:servicoId",
        element: (
          <PrivateRoute role="cliente">
            <Agendamento />
          </PrivateRoute>
        ),
      },
      {
        path: "/meus-agendamentos",
        element: (
          <PrivateRoute role="cliente">
            <MeusAgendamentosPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/favoritos",
        element: (
          <PrivateRoute role="cliente">
            <FavoritosPage />
          </PrivateRoute>
        ),
      },

      // ===============================
      // LOJISTA
      // ===============================
      {
        path: "/perfil-lojista",
        element: (
          <PrivateRoute role="lojista">
            <PainelLojistaPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/lojista/pedidos",
        element: (
          <PrivateRoute role="lojista">
            <MeusPedidosLojistaPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/lojista/produtos",
        element: (
          <PrivateRoute role="lojista">
            <ProdutosLojistaPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/lojista/perfil",
        element: (
          <PrivateRoute role="lojista">
            <DadosLojaPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/lojista/servicos",
        element: (
          <PrivateRoute role="lojista">
            <ServicosLojistaPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/lojista/agenda",
        element: (
          <PrivateRoute role="lojista">
            <AgendaLojistaPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/lojista/agenda/configuracoes",
        element: (
          <PrivateRoute role="lojista">
            <ConfiguracoesAgendaPage />
          </PrivateRoute>
        ),
      },
      {
        path: "/lojista/ajuda-suporte",
        element: (
          <PrivateRoute role="lojista">
            <AjudaSuportePage />
          </PrivateRoute>
        ),
      },
      {
        path: "/lojista/relatorios",
        element: (
          <PrivateRoute role="lojista">
            <RelatoriosPage />
          </PrivateRoute>
        ),
      },

      // ===============================
      // ADMIN
      // ===============================
      {
        path: "/admin",
        element: (
          <PrivateRoute role="admin">
            <AdminPage />
          </PrivateRoute>
        ),
      }
    ],
  },
]);
