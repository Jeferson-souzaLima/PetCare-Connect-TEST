import { Link } from "react-router-dom";
import { CalendarDays, PawPrint, Pencil, Plus, Trash2 } from "lucide-react";
import { getMediaUrl } from "@/services/mediaUrl";
import { descricaoPet, idadePet, imagemPadraoPet } from "@/utils/pets";

const BOTAO_ACAO =
  "flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2";

function CartaoPet({ pet, onEditar, onRemover }) {
  const descricao = descricaoPet(pet);
  return (
    <li className="relative flex gap-4 rounded-2xl bg-gradient-to-br from-pc-verde-100 to-green-50 p-3 sm:p-4">
      <img
        src={getMediaUrl(pet.imagem, imagemPadraoPet(pet.especie))}
        alt={pet.nome}
        className="h-28 w-28 shrink-0 rounded-xl object-cover sm:h-32 sm:w-32"
      />
      <div className="min-w-0 flex-1">
        {/* Só o nome e os dados abrem espaço para os botões de editar/remover; o botão de agendar não. */}
        <div className="pr-24">
          <h3 className="truncate text-xl font-bold text-pc-verde-700">{pet.nome}</h3>
          {descricao && <p className="mt-1 truncate text-sm text-pc-texto">{descricao}</p>}
          <p className="text-sm text-pc-texto">Idade: {idadePet(pet.idade)}</p>
        </div>
        <Link
          to="/servicos"
          className="mt-3 inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-pc-pill border border-pc-verde-700/30 bg-white/70 px-4 text-sm font-semibold text-pc-verde-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
        >
          <CalendarDays size={16} aria-hidden="true" />
          Agendar serviço
        </Link>
      </div>
      <div className="absolute right-3 top-3 flex gap-2">
        <button type="button" onClick={() => onEditar(pet)} aria-label={`Editar ${pet.nome}`} className={`${BOTAO_ACAO} text-pc-verde-700 hover:bg-pc-verde-100 focus-visible:ring-pc-verde-700`}>
          <Pencil size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onRemover(pet.id)} aria-label={`Remover ${pet.nome}`} className={`${BOTAO_ACAO} text-red-500 hover:bg-red-50 focus-visible:ring-red-500`}>
          <Trash2 size={18} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

/** Seção "Meus pets": cartões com editar/remover/agendar e botão de adicionar. */
export default function ListaPets({ pets, loadingPets, onEditarPet, onRemoverPet, onAdicionarPet }) {
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
              <CartaoPet key={pet.id} pet={pet} onEditar={onEditarPet} onRemover={onRemoverPet} />
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
