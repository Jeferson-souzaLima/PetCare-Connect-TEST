import { Link } from "react-router-dom";
import { ArrowRight, CalendarHeart, MapPin } from "lucide-react";

const CARDS = [
  {
    titulo: "Agende Serviços",
    texto: "Banho · Tosa · Vet · Vacinas · Exames",
    destino: "/?categoria=servicos#explorar",
    icone: CalendarHeart,
    fundo: "bg-pc-pessego",
  },
  {
    titulo: "Lojas perto de você",
    texto: "Veja as opções na sua região.",
    destino: "/?categoria=lojas#explorar",
    icone: MapPin,
    fundo: "bg-pc-verde-100",
  },
];

export function CardsDestaque() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CARDS.map(({ titulo, texto, destino, icone: Icone, fundo }) => (
        <Link
          key={titulo}
          to={destino}
          className={`flex min-h-[112px] items-center gap-2 rounded-pc-card p-3 shadow-pc-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40 sm:gap-3 sm:p-4 ${fundo}`}
        >
          <Icone size={30} aria-hidden="true" className="hidden shrink-0 text-pc-verde-700 sm:block" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold leading-tight text-pc-verde-900 sm:text-lg">{titulo}</span>
            <span className="mt-1 block text-xs text-pc-texto sm:text-sm">{texto}</span>
          </span>
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pc-verde-700 text-white">
            <ArrowRight size={18} />
          </span>
        </Link>
      ))}
    </div>
  );
}
