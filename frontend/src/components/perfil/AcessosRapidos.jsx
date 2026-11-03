import { FaCalendarAlt, FaHeart, FaShoppingBag } from "react-icons/fa";

const ACESSOS = [
  {
    rota: "/favoritos",
    icon: FaHeart,
    titulo: "Favoritos",
    descricao: "Produtos e lojas salvos",
    corIcone: "bg-red-50 text-red-500",
    classeExtra: "",
  },
  {
    rota: "/meus-agendamentos",
    icon: FaCalendarAlt,
    titulo: "Agendamentos",
    descricao: "Consulte seus horários",
    corIcone: "bg-blue-50 text-blue-600",
    classeExtra: "",
  },
  {
    rota: "/meus-pedidos",
    icon: FaShoppingBag,
    titulo: "Meus pedidos",
    descricao: "Acompanhe suas compras",
    corIcone: "bg-green-50 text-[#0E5617]",
    classeExtra: "col-span-2 md:col-span-1 ",
  },
];

/** Atalhos para favoritos, agendamentos e pedidos. */
export default function AcessosRapidos({ onNavegar }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Acesso rápido
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Acesse rapidamente as principais áreas da sua conta.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {ACESSOS.map((acesso) => {
          const Icon = acesso.icon;

          return (
            <button
              key={acesso.rota}
              type="button"
              onClick={() => onNavegar(acesso.rota)}
              className={`${acesso.classeExtra}group bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all`}
            >
              <div className={`w-11 h-11 rounded-xl ${acesso.corIcone} flex items-center justify-center mb-4 group-hover:scale-105 transition`}>
                <Icon />
              </div>

              <h3 className="font-bold text-gray-800">
                {acesso.titulo}
              </h3>

              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {acesso.descricao}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
