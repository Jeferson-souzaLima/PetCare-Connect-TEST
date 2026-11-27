import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Heart, LogIn, LogOut, PawPrint, ShieldCheck, UserRound } from "lucide-react";
import { PedidosRecentes } from "@/components/home/PedidosRecentes";
import { ProximosAgendamentos } from "@/components/home/ProximosAgendamentos";
import { useAuth } from "@/hooks/useAuth";
import { useResumoCliente } from "@/hooks/useResumoCliente";

// Dentro da janela da barra os blocos ficam sem a moldura de card da home.
const SEM_MOLDURA = "p-2";

const LINHA =
  "flex min-h-[48px] items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-pc-texto hover:bg-pc-verde-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700";

function EntrarParaVer({ texto, aoFechar }) {
  return (
    <div className="px-4 py-5 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pc-verde-100 text-pc-verde-700">
        <UserRound size={24} aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-bold text-pc-texto">{texto}</p>
      <Link
        to="/login"
        onClick={aoFechar}
        className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-pc-pill bg-pc-verde-700 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2"
      >
        <LogIn size={16} aria-hidden="true" />
        Entrar
      </Link>
    </div>
  );
}

/** Próximos agendamentos (toque em "Agenda"). */
export function ResumoAgenda({ aoFechar }) {
  const { usuario } = useAuth();
  const resumo = useResumoCliente();
  if (usuario?.tipo !== "cliente") return <EntrarParaVer texto="Entre para ver seus próximos agendamentos" aoFechar={aoFechar} />;
  return <ProximosAgendamentos {...resumo.agendamentos} className={SEM_MOLDURA} />;
}

/** Pedidos recentes e status (toque em "Pedidos"). */
export function ResumoPedidos({ aoFechar }) {
  const { usuario } = useAuth();
  const resumo = useResumoCliente();
  if (usuario?.tipo !== "cliente") return <EntrarParaVer texto="Entre para acompanhar seus pedidos" aoFechar={aoFechar} />;
  return <PedidosRecentes {...resumo.pedidos} className={SEM_MOLDURA} />;
}

/** Atalhos da conta (segurar "Conta"). */
export function ResumoConta({ aoFechar }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return <EntrarParaVer texto="Entre para ver sua conta, pets e favoritos" aoFechar={aoFechar} />;

  const atalhos = [
    usuario.tipo === "admin" && { rotulo: "Administração", destino: "/admin", icone: ShieldCheck },
    { rotulo: "Meu perfil", destino: "/perfil", icone: UserRound },
    { rotulo: "Meus pets", destino: "/perfil", icone: PawPrint },
    { rotulo: "Favoritos", destino: "/favoritos", icone: Heart },
  ].filter(Boolean);

  return (
    <div className="p-1">
      <p className="px-3 pb-2 pt-1 text-base font-bold text-pc-texto">
        Olá, {(usuario.nome || "").split(" ")[0] || "bem-vindo"}
      </p>
      <ul className="space-y-0.5">
        {atalhos.map(({ rotulo, destino, icone: Icone }) => (
          <li key={rotulo}>
            <Link to={destino} onClick={aoFechar} className={LINHA}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pc-verde-100 text-pc-verde-700">
                <Icone size={18} aria-hidden="true" />
              </span>
              <span className="flex-1">{rotulo}</span>
              <ChevronRight size={16} aria-hidden="true" className="text-pc-texto-suave" />
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => {
              aoFechar();
              logout();
              navigate("/");
            }}
            className={`${LINHA} w-full text-left`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
              <LogOut size={18} aria-hidden="true" />
            </span>
            Sair
          </button>
        </li>
      </ul>
    </div>
  );
}
