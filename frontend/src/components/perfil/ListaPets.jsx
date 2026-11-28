import { Link } from "react-router-dom";
import { CalendarDays, Layers, PawPrint, Pencil, Plus } from "lucide-react";
import { getMediaUrl } from "@/services/mediaUrl";
import { especieDoCatalogo, imagemPadraoPet, rotuloFaseVida } from "@/utils/pets";

const BOTAO_ACAO =
  "flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2";

function Dado({ icone: Icone, rotulo, children }) {
  if (!children) return null;
  return (
    <p className="flex items-center gap-2 truncate text-sm text-pc-texto">
      <Icone size={16} aria-hidden="true" className="shrink-0 text-pc-verde-700" />
      <span className="sr-only">{rotulo}: </span>
      <span className="truncate">{children}</span>
    </p>
  );
}

function CartaoPet({ pet, opcoes, onEditar }) {
  // Espécies salvas como texto livre (antes do catálogo) aparecem com o nome da lista quando batem.
  const especie = especieDoCatalogo(opcoes?.especies, pet.especie)?.nome ?? pet.especie;
  return (
    <li className="relative rounded-2xl bg-gradient-to-br from-pc-verde-100 to-green-50 p-3 sm:p-4">
      <div className="flex gap-4">
        <img
          src={getMediaUrl(pet.imagem, imagemPadraoPet(pet.especie))}
          alt={pet.nome}
          className="h-28 w-28 shrink-0 rounded-xl object-cover sm:h-32 sm:w-32"
        />
        {/* O espaço à direita fica para o botão de editar (excluir fica dentro do editar). */}
        <div className="min-w-0 flex-1 space-y-1 pr-12">
          <h3 className="truncate text-xl font-bold text-pc-verde-700">{pet.nome}</h3>
          <Dado icone={PawPrint} rotulo="Espécie">{especie}</Dado>
          <Dado icone={Layers} rotulo="Raça">{pet.raca}</Dado>
          <Dado icone={CalendarDays} rotulo="Fase de vida">{rotuloFaseVida(opcoes?.fases, pet.fase_vida)}</Dado>
        </div>
      </div>
      <Link
        to="/servicos"
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pc-pill border border-pc-verde-700/30 bg-white/80 text-sm font-semibold text-pc-verde-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
      >
        <CalendarDays size={16} aria-hidden="true" />
        Agendar serviço
      </Link>
      <div className="absolute right-3 top-3">
        <button type="button" onClick={() => onEditar(pet)} aria-label={`Editar ${pet.nome}`} className={`${BOTAO_ACAO} text-pc-verde-700 hover:bg-pc-verde-100 focus-visible:ring-pc-verde-700`}>
          <Pencil size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

/** Seção "Meus pets": cartões com editar/agendar e botão de adicionar (excluir fica no editar). */
export default function ListaPets({ pets, opcoes, loadingPets, onEditarPet, onAdicionarPet }) {
  return (
    <section id="meus-pets" aria-labelledby="titulo-meus-pets" className="scroll-mt-28 lg:rounded-pc-card lg:bg-white lg:p-5 lg:shadow-pc-card">
      <h2 id="titulo-meus-pets" className="flex items-center gap-2 text-xl font-bold text-pc-texto">
        <PawPrint size={22} aria-hidden="true" className="text-pc-verde-700" />
        Meus pets
      </h2>

      <div className="mt-3">
        {loadingPets ? (
          <div aria-busy="true" aria-label="Carregando pets" className="h-36 animate-pulse rounded-2xl bg-pc-verde-100/60" />
        ) : pets.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-pc-card lg:shadow-none">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pc-verde-100 text-pc-verde-700">
              <PawPrint size={26} aria-hidden="true" />
            </span>
            <p className="mt-3 font-bold text-pc-texto">Nenhum pet cadastrado</p>
            <p className="mt-1 text-sm text-pc-texto-suave">Cadastre seu pet para facilitar os próximos atendimentos.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3">
            {pets.map((pet) => (
              <CartaoPet key={pet.id} pet={pet} opcoes={opcoes} onEditar={onEditarPet} />
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onAdicionarPet}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-pc-verde-700 text-base font-semibold text-white hover:bg-pc-verde-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2"
        >
          <Plus size={20} aria-hidden="true" />
          Adicionar pet
        </button>
      </div>
    </section>
  );
}
