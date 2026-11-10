import { Package, Scissors, Store } from "lucide-react";

const OPCOES = [
  { categoria: "produtos", label: "Produtos", icon: Package },
  { categoria: "lojas", label: "Lojas", icon: Store },
  { categoria: "servicos", label: "Serviços", icon: Scissors },
];

/** Menu do long press em "Início": atalhos para produtos, lojas e serviços. */
export default function MenuInicio({ onSelecionar }) {
  return (
    <div
      className="
        absolute
        bottom-full
        left-1/2
        -translate-x-1/2
        w-[92px]
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
      {OPCOES.map(({ categoria, label, icon: Icon }) => (
        <button
          key={categoria}
          type="button"
          onClick={() => onSelecionar(categoria)}
          className="
            w-full
            flex
            flex-col
            items-center
            justify-center
            gap-1
            py-2.5
            rounded-xl
            text-gray-700
            font-semibold
            text-[10px]
            hover:bg-green-50
            hover:text-[#0E5617]
            transition-colors
          "
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
