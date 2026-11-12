import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarHeart, MapPin } from "lucide-react";
import { ImagemSite } from "@/components/ui/ImagemSite";
import { urlMidiaSite } from "@/utils/home";

// A imagem é decorativa (alt vazio): o texto do card já diz o que ele faz.
const CARDS = [
  {
    titulo: "Agende Serviços",
    texto: "Banho · Tosa · Vet · Vacinas · Exames",
    destino: "/servicos",
    icone: CalendarHeart,
    imagem: "site/home/agende-servicos",
    fundo: "bg-pc-pessego",
  },
  {
    titulo: "Lojas perto de você",
    texto: "Veja as opções na sua região.",
    destino: "/lojas",
    icone: MapPin,
    imagem: "site/home/lojas-perto",
    fundo: "bg-pc-verde-100",
  },
];

/**
 * Card com a imagem do R2 quando ela existe. No celular, a imagem e a seta ficam numa linha
 * abaixo do texto (o card tem ~165 px); a partir do sm, tudo numa linha só.
 * Sem VITE_MEDIA_URL ou com erro no arquivo, volta ao card de antes, com o ícone.
 */
function CardDestaque({ titulo, texto, destino, icone: Icone, imagem, fundo }) {
  const [falhou, setFalhou] = useState(false);
  const celular = urlMidiaSite(`${imagem}-celular.webp`);
  const comImagem = Boolean(celular) && !falhou;

  return (
    <Link
      to={destino}
      className={`min-h-[112px] overflow-hidden rounded-pc-card p-3 shadow-pc-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-verde-700/40 sm:flex sm:items-center sm:gap-3 sm:p-4 ${
        comImagem ? "grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-2" : "flex items-center gap-2"
      } ${fundo}`}
    >
      {comImagem ? (
        <ImagemSite
          celular={celular}
          desktop={urlMidiaSite(`${imagem}-desktop.webp`)}
          larguras={[160, 256]}
          sizes="(min-width: 640px) 96px, 64px"
          alt=""
          aoFalhar={() => setFalhou(true)}
          className="row-start-2 -mb-3 -ml-1 h-auto w-16 shrink-0 self-end sm:-mb-4 sm:w-24"
        />
      ) : (
        <Icone size={30} aria-hidden="true" className="hidden shrink-0 text-pc-verde-700 sm:block" />
      )}
      <span className="col-span-3 min-w-0 flex-1">
        <span className="block text-base font-bold leading-tight text-pc-verde-900 sm:text-lg">{titulo}</span>
        <span className="mt-1 block text-xs text-pc-texto sm:text-sm">{texto}</span>
      </span>
      <span aria-hidden="true" className="col-start-3 row-start-2 flex h-9 w-9 shrink-0 items-center justify-center self-end justify-self-end rounded-full bg-pc-verde-700 text-white sm:self-auto">
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}

export function CardsDestaque() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CARDS.map((card) => (
        <CardDestaque key={card.titulo} {...card} />
      ))}
    </div>
  );
}
