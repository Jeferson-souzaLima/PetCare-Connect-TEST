import { CalendarDays, Heart, Package } from "lucide-react";

const OPCOES = [
  { rota: "/meus-pedidos", label: "Meus pedidos", icon: Package },
  { rota: "/meus-agendamentos", label: "Meus agendamentos", icon: CalendarDays },
  { rota: "/favoritos", label: "Favoritos", icon: Heart },
];

/** Menu do long press em "Conta": pedidos, agendamentos e favoritos. */
export default function MenuConta({ onSelecionar }) {
  return (
    <div
      className="
        absolute
        bottom-full
        left-1/2
        -translate-x-1/2
        w-[170px]
        mb-3
        bg-white
        border
        border-gray-200
        rounded-2xl
        shadow-xl
        overflow-hidden
        p-1
      "
    >
      {OPCOES.map(({ rota, label, icon: Icon }) => (
        <button
          key={rota}
          type="button"
          onClick={() => onSelecionar(rota)}
          className="
            w-full
            flex
            items-center
            gap-3
            px-3
            py-2.5
            rounded-xl
            text-gray-700
            font-semibold
            text-xs
            hover:bg-green-50
            hover:text-[#0E5617]
            transition-colors
          "
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
