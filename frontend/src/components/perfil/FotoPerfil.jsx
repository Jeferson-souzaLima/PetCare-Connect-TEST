import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getMediaUrl } from "@/services/mediaUrl";
import { enviarFotoPerfil, removerFotoPerfil } from "@/services/perfilService";
import { iniciaisNome } from "@/utils/perfil";
import { prepararImagem } from "@/utils/prepararImagem";

const OPCAO =
  "flex min-h-[44px] w-full items-center gap-2.5 px-4 text-left text-sm font-semibold hover:bg-pc-fundo focus-visible:bg-pc-fundo focus-visible:outline-none";

/**
 * Avatar do cartão "Minha conta": a foto (ou as iniciais) com o lápis para trocar.
 * Sem foto, o lápis abre a escolha do arquivo; com foto, um menu com trocar/remover.
 * Erros vão para `onErro` (o cartão mostra a mensagem).
 */
export default function FotoPerfil({ usuario, onErro }) {
  const { atualizarUsuario } = useAuth();
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const foto = getMediaUrl(usuario.foto);

  useEffect(() => {
    if (!menuAberto) return undefined;
    function fechar(evento) {
      if (evento.type === "keydown" ? evento.key === "Escape" : !menuRef.current?.contains(evento.target)) setMenuAberto(false);
    }
    document.addEventListener("pointerdown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("pointerdown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [menuAberto]);

  async function executar(acao, mensagemPadrao) {
    setMenuAberto(false);
    onErro(null);
    setOcupado(true);
    try {
      await acao();
    } catch (erro) {
      onErro(erro.response?.data?.mensagem || erro.message || mensagemPadrao);
    } finally {
      setOcupado(false);
    }
  }

  function aoEscolher(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!arquivo) return;
    executar(async () => {
      const url = await enviarFotoPerfil(await prepararImagem(arquivo));
      atualizarUsuario({ foto: url });
    }, "Não foi possível enviar a foto.");
  }

  function remover() {
    executar(async () => {
      await removerFotoPerfil();
      atualizarUsuario({ foto: null });
    }, "Não foi possível remover a foto.");
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-pc-lima text-xl font-bold text-pc-verde-900 ring-4 ring-white/30 md:h-20 md:w-20 md:text-2xl">
        {foto ? <img src={foto} alt="" className="h-full w-full object-cover" /> : <span aria-hidden="true">{iniciaisNome(usuario.nome)}</span>}
        {ocupado && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <LoaderCircle size={24} aria-label="Enviando foto" className="animate-spin text-white motion-reduce:animate-none" />
          </span>
        )}
      </span>

      <button
        type="button"
        disabled={ocupado}
        onClick={() => (foto ? setMenuAberto((aberto) => !aberto) : inputRef.current?.click())}
        aria-label={foto ? "Alterar foto de perfil" : "Adicionar foto de perfil"}
        aria-haspopup={foto ? "menu" : undefined}
        aria-expanded={foto ? menuAberto : undefined}
        className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-pc-verde-700 text-white ring-2 ring-white hover:bg-pc-verde-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima disabled:opacity-60 md:h-8 md:w-8"
      >
        <Pencil size={14} aria-hidden="true" />
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={aoEscolher} className="hidden" tabIndex={-1} aria-hidden="true" />

      {/* Abre ao lado do avatar: dentro do cartão (que corta o que passa da borda). */}
      {menuAberto && (
        <div role="menu" className="absolute left-[calc(100%+0.75rem)] top-1/2 z-10 w-44 -translate-y-1/2 overflow-hidden rounded-2xl bg-white py-1 text-pc-texto shadow-pc-card">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuAberto(false);
              inputRef.current?.click();
            }}
            className={OPCAO}
          >
            <Camera size={18} aria-hidden="true" className="text-pc-verde-700" />
            Trocar foto
          </button>
          <button type="button" role="menuitem" onClick={remover} className={`${OPCAO} text-red-600`}>
            <Trash2 size={18} aria-hidden="true" />
            Remover foto
          </button>
        </div>
      )}
    </div>
  );
}
