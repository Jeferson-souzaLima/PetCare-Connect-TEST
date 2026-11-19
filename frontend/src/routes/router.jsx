import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../layout/Layout";
import LayoutLojista from "../layout/LayoutLojista";
import { useAuth } from "../hooks/useAuth";

// Páginas públicas
import NovaHomePage from "../pages/NovaHomePage";
import ExplorarPage from "../pages/ExplorarPage";
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

  // A home do lojista é o painel da área do lojista; cliente e visitante usam a
  // nova home, que tem cabeçalho e barra inferior próprios.
  if (usuario?.tipo === "lojista") return <Navigate to="/perfil-lojista" replace />;

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
  { path: "/lojas", element: <ExplorarPage key="lojas" tipo="lojas" /> },
  { path: "/produtos", element: <ExplorarPage key="produtos" tipo="produtos" /> },
  { path: "/servicos", element: <ExplorarPage key="servicos" tipo="servicos" /> },

  // ===============================
  // LOJISTA (cabeçalho, menu lateral e barra inferior próprios)
  // ===============================
  {
    element: (
      <PrivateRoute role="lojista">
        <LayoutLojista />
      </PrivateRoute>
    ),
    children: [
      { path: "/perfil-lojista", element: <PainelLojistaPage /> },
      { path: "/lojista/pedidos", element: <MeusPedidosLojistaPage /> },
      { path: "/lojista/produtos", element: <ProdutosLojistaPage /> },
      { path: "/lojista/perfil", element: <DadosLojaPage /> },
      { path: "/lojista/servicos", element: <ServicosLojistaPage /> },
      { path: "/lojista/agenda", element: <AgendaLojistaPage /> },
      { path: "/lojista/agenda/configuracoes", element: <ConfiguracoesAgendaPage /> },
      { path: "/lojista/ajuda-suporte", element: <AjudaSuportePage /> },
      { path: "/lojista/relatorios", element: <RelatoriosPage /> },
    ],
  },

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
