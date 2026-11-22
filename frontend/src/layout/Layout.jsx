import { Outlet, useLocation } from "react-router-dom";
import { HomeHeader } from "../components/home/HomeHeader";
import { BarraInferiorCliente } from "../components/navigation/BarraInferiorCliente";

export default function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <>
      {/* A busca geral fica na home e nos resultados de busca (para buscar outra coisa sem voltar). */}
      <HomeHeader busca={pathname === "/busca"} />

      {/* Espaço para a barra inferior flutuante (altura + distância da borda + safe-area). */}
      <main className="pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
        {children ?? <Outlet />}
      </main>

      <BarraInferiorCliente />
    </>
  );
}
