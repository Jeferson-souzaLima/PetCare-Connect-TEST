import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LojasAdmin from "@/components/admin/LojasAdmin";
import UsuariosAdmin from "@/components/admin/UsuariosAdmin";
import PedidosAdmin from "@/components/admin/PedidosAdmin";

const ABAS = [
  { id: "lojas", rotulo: "Lojas", Componente: LojasAdmin },
  { id: "usuarios", rotulo: "Usuários", Componente: UsuariosAdmin },
  { id: "pedidos", rotulo: "Pedidos", Componente: PedidosAdmin },
];

export default function AdminPage() {
  const [abaAtiva, setAbaAtiva] = useState("lojas");
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { Componente } = ABAS.find((aba) => aba.id === abaAtiva);

  function sair() {
    logout();
    navigate("/login");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-b-3xl bg-gradient-to-r from-green-200 to-green-300 p-8 shadow-md">
        <div>
          <h1 className="text-3xl font-bold text-green-900">Administração</h1>
          <p className="mt-1 text-green-800">Aprove lojas, consulte usuários e acompanhe pedidos.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate("/")} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-green-900 shadow hover:bg-green-50">
            Ver site
          </button>
          <button type="button" onClick={sair} className="rounded-xl bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
            Sair
          </button>
        </div>
      </header>

      <nav className="flex gap-2 border-b border-green-200" aria-label="Seções da administração">
        {ABAS.map(({ id, rotulo }) => (
          <button
            key={id}
            type="button"
            aria-current={abaAtiva === id ? "page" : undefined}
            onClick={() => setAbaAtiva(id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${abaAtiva === id ? "border-green-900 text-green-900" : "border-transparent text-gray-500 hover:text-green-900"}`}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      <Componente />
    </div>
  );
}
