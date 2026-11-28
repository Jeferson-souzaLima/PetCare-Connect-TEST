import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, ChevronDown, Dog, Heart, Info, Layers, LoaderCircle, PawPrint, X } from "lucide-react";
import petService from "../../services/petService";
import { useOpcoesPet } from "@/hooks/useOpcoesPet";
import { getMediaUrl } from "@/services/mediaUrl";
import { especieDoCatalogo, imagemPadraoPet, valoresIniciaisPet } from "@/utils/pets";
import { prepararImagem } from "@/utils/prepararImagem";

// Ícone de cada fase de vida (os textos vêm do catálogo da API).
const ICONE_FASE = { filhote: Dog, adulto: PawPrint, senior: Heart };

const ROTULO = "mb-1.5 block text-sm font-bold text-pc-texto";
const CAMPO =
  "h-12 w-full rounded-xl border border-black/15 bg-white text-base text-pc-texto focus:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 disabled:bg-pc-fundo disabled:text-pc-texto-suave";

function Obrigatorio() {
  return (
    <span aria-hidden="true" className="text-red-600">
      {" "}*
    </span>
  );
}

/** Lista suspensa com ícone à esquerda e seta à direita. */
function Selecao({ id, icone: Icone, value, onChange, disabled, children }) {
  return (
    <div className="relative">
      <Icone size={20} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-pc-verde-700" />
      <select id={id} value={value} onChange={onChange} disabled={disabled} required className={`${CAMPO} appearance-none pl-11 pr-10`}>
        {children}
      </select>
      <ChevronDown size={20} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-pc-texto" />
    </div>
  );
}

/**
 * Cadastro e edição de pet (perfil e agendamento). Espécie, raça e fase de vida vêm do
 * catálogo da API (GET /pets/opcoes), que também valida o que é salvo.
 */
export default function PetModal({ token, onClose, onPetSalvo, petExistente = null }) {
  const { opcoes, erro: erroOpcoes } = useOpcoesPet();
  const id = useId();
  const inputFotoRef = useRef(null);
  const [form, setForm] = useState(() => valoresIniciaisPet(petExistente, null));
  const [arquivo, setArquivo] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // Quando o catálogo chega, ajusta espécie/raça salvas como texto livre aos nomes da lista.
  useEffect(() => {
    if (opcoes) setForm((atual) => ({ ...valoresIniciaisPet({ ...petExistente, nome: atual.nome }, opcoes.especies) }));
  }, [opcoes, petExistente]);

  // Esc fecha; a página atrás não rola enquanto o modal está aberto.
  useEffect(() => {
    const aoTeclar = (evento) => evento.key === "Escape" && !salvando && onClose();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [onClose, salvando]);

  const previa = useMemo(() => (arquivo ? URL.createObjectURL(arquivo) : null), [arquivo]);
  useEffect(() => () => previa && URL.revokeObjectURL(previa), [previa]);
  const foto = previa || getMediaUrl(petExistente?.imagem, imagemPadraoPet(form.especie));

  const especieAtual = especieDoCatalogo(opcoes?.especies, form.especie);
  const editando = Boolean(petExistente);

  function alterar(campo, valor) {
    setErro(null);
    setForm((atual) => {
      const novo = { ...atual, [campo]: valor };
      // Trocar a espécie limpa a raça (a lista de raças é outra).
      if (campo === "especie") novo.raca = "";
      return novo;
    });
  }

  async function salvar(evento) {
    evento.preventDefault();
    if (!form.nome.trim() || !form.especie || !form.raca || !form.fase_vida) {
      setErro("Preencha nome, espécie, raça e fase de vida.");
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const dados = new FormData();
      dados.append("nome", form.nome.trim());
      dados.append("especie", form.especie);
      dados.append("raca", form.raca);
      dados.append("fase_vida", form.fase_vida);
      if (arquivo) dados.append("imagem", await prepararImagem(arquivo));

      const resposta = editando ? await petService.atualizar(petExistente.id, dados, token) : await petService.criar(dados, token);
      onPetSalvo(resposta.data);
      onClose();
    } catch (falha) {
      setErro(falha.response?.data?.mensagem || falha.message || "Não foi possível salvar o pet.");
    } finally {
      setSalvando(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center md:p-4"
      onPointerDown={(evento) => evento.target === evento.currentTarget && !salvando && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[28px] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-pc-texto shadow-xl motion-safe:animate-pc-folha md:rounded-[28px] md:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={`${id}-titulo`} className="text-2xl font-bold">
            {editando ? "Editar pet" : "Adicionar pet"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={salvando}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-pc-fundo hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={salvar} noValidate className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-black/5 p-3 shadow-pc-card">
            <div className="relative shrink-0">
              <img src={foto} alt={form.nome ? `Foto de ${form.nome}` : "Foto do pet"} className="h-28 w-28 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => inputFotoRef.current?.click()}
                aria-label={editando ? "Trocar a foto do pet" : "Escolher a foto do pet"}
                className="absolute -bottom-1.5 -right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-pc-verde-700 text-white ring-4 ring-white hover:bg-pc-verde-900 focus-visible:outline-none focus-visible:ring-pc-lima"
              >
                <Camera size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="font-bold">Foto do pet</p>
              <p className="text-sm text-pc-texto-suave">{editando ? "Atualize a foto do seu pet" : "Adicione uma foto do seu pet"}</p>
              <p className="text-sm text-pc-texto-suave">(jpg, png · até 5 MB)</p>
            </div>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(evento) => {
                setArquivo(evento.target.files?.[0] || null);
                evento.target.value = "";
              }}
            />
          </div>

          <div>
            <label htmlFor={`${id}-nome`} className={ROTULO}>
              Nome do pet
              <Obrigatorio />
            </label>
            <input
              id={`${id}-nome`}
              type="text"
              value={form.nome}
              onChange={(evento) => alterar("nome", evento.target.value)}
              maxLength={100}
              required
              autoComplete="off"
              className={`${CAMPO} px-4`}
            />
          </div>

          {erroOpcoes && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Não foi possível carregar as espécies e raças agora. Feche e tente de novo em instantes.
            </p>
          )}

          <div>
            <label htmlFor={`${id}-especie`} className={ROTULO}>
              Espécie
              <Obrigatorio />
            </label>
            <Selecao id={`${id}-especie`} icone={PawPrint} value={form.especie} onChange={(evento) => alterar("especie", evento.target.value)} disabled={!opcoes}>
              <option value="">{opcoes ? "Selecione a espécie" : "Carregando..."}</option>
              {opcoes?.especies.map((especie) => (
                <option key={especie.nome} value={especie.nome}>
                  {especie.nome}
                </option>
              ))}
            </Selecao>
          </div>

          <div>
            <label htmlFor={`${id}-raca`} className={ROTULO}>
              Raça
              <Obrigatorio />
            </label>
            <Selecao id={`${id}-raca`} icone={Layers} value={form.raca} onChange={(evento) => alterar("raca", evento.target.value)} disabled={!especieAtual}>
              <option value="">{especieAtual ? "Selecione a raça" : "Escolha a espécie primeiro"}</option>
              {especieAtual?.racas.map((raca) => (
                <option key={raca} value={raca}>
                  {raca}
                </option>
              ))}
            </Selecao>
            {form.racaAnterior && !form.raca && (
              <p className="mt-1.5 text-xs text-pc-texto-suave">
                Antes estava “{form.racaAnterior}”. Escolha a raça na lista.
              </p>
            )}
          </div>

          <fieldset>
            <legend className={ROTULO}>
              Fase de vida
              <Obrigatorio />
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {(opcoes?.fases ?? []).map((fase) => {
                const Icone = ICONE_FASE[fase.id] ?? PawPrint;
                const marcada = form.fase_vida === fase.id;
                return (
                  <label
                    key={fase.id}
                    className={`relative flex cursor-pointer flex-col items-center rounded-2xl border px-1 py-3 text-center transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-pc-verde-700 ${
                      marcada ? "border-pc-verde-700 bg-pc-verde-100" : "border-black/10 bg-white hover:bg-pc-fundo"
                    }`}
                  >
                    <input type="radio" name={`${id}-fase`} value={fase.id} checked={marcada} onChange={() => alterar("fase_vida", fase.id)} className="sr-only" />
                    {marcada && (
                      <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-pc-verde-700 text-white">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                    <Icone size={26} aria-hidden="true" className={marcada ? "text-pc-verde-700" : "text-pc-texto"} />
                    <span className="mt-1 text-sm font-bold">{fase.rotulo}</span>
                    <span className="text-xs text-pc-texto-suave">{fase.descricao}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <p className="flex items-start gap-3 rounded-2xl bg-pc-verde-100/70 px-4 py-3 text-sm text-pc-texto-suave">
            <Info size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-pc-verde-700" />
            Essas informações nos ajudam a recomendar produtos, serviços e cuidados mais adequados.
          </p>

          {erro && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="min-h-[48px] rounded-xl bg-black/5 font-semibold hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || !opcoes}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-pc-verde-700 font-semibold text-white hover:bg-pc-verde-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {salvando && <LoaderCircle size={18} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
              {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar pet"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
