import { Outlet } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { BarraInferiorCliente } from "../components/navigation/BarraInferiorCliente";

export default function Layout({ children }) {
  return (
    <>
      <Header />

      {/* Espaço para a barra inferior flutuante (altura + distância da borda + safe-area). */}
      <main className="pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-0">
        {children ?? <Outlet />}
      </main>

      <BarraInferiorCliente />
    </>
  );
}