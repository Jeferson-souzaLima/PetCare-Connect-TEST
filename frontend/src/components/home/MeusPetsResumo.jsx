import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { getMediaUrl } from "@/services/mediaUrl";
import { BlocoResumo } from "./BlocoResumo";

export function MeusPetsResumo({ estado, itens }) {
  return (
    <BlocoResumo
      titulo="Meus Pets"
      icone={PawPrint}
      estado={estado}
      link={{ destino: "/perfil", rotulo: "Ver todos" }}
      vazio={
        <Link to="/perfil" className="block rounded-xl bg-pc-fundo p-3 text-sm text-pc-verde-700 hover:underline">
          Cadastre seu pet para agendar serviços mais rápido.
        </Link>
      }
    >
      <ul className="flex gap-3 overflow-x-auto">
        {itens.slice(0, 4).map((pet) => {
          const foto = getMediaUrl(pet.imagem);
          return (
            <li key={pet.id} className="w-16 shrink-0 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-pc-verde-100">
                {foto ? <img src={foto} alt="" className="h-full w-full object-cover" /> : <PawPrint size={22} aria-hidden="true" className="text-pc-verde-700" />}
              </span>
              <span className="mt-1 block truncate text-xs font-medium text-pc-texto">{pet.nome}</span>
            </li>
          );
        })}
      </ul>
    </BlocoResumo>
  );
}
