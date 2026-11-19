import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, MailCheck, Store } from "lucide-react";
import MensagemStatus from "@/components/ui/MensagemStatus";

const CAMPO =
  "w-full rounded-xl border border-gray-300 bg-white text-[15px] text-pc-texto placeholder:text-gray-400 focus:border-pc-verde-700 focus:outline-none focus:ring-4 focus:ring-pc-lima/40";

/** Campo com rótulo visível, ícone opcional e dica abaixo. "multilinha" vira textarea. */
export function CampoAcesso({ id, rotulo, icone: Icone, dica, obrigatorio = false, multilinha = false, acaoFinal, ...props }) {
  const idDica = dica ? `${id}-dica` : undefined;
  const recuo = `${Icone ? "pl-11" : "pl-4"} ${acaoFinal ? "pr-12" : "pr-4"}`;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-pc-texto">
        {rotulo}
        {obrigatorio && <span aria-hidden="true" className="text-red-600"> *</span>}
      </label>
      <div className="relative">
        {Icone && (
          <Icone aria-hidden="true" className={`pointer-events-none absolute left-3.5 h-5 w-5 text-pc-verde-700 ${multilinha ? "top-3.5" : "top-1/2 -translate-y-1/2"}`} />
        )}
        {multilinha ? (
          <textarea id={id} required={obrigatorio} aria-describedby={idDica} className={`${CAMPO} ${recuo} resize-none py-3`} {...props} />
        ) : (
          <input id={id} required={obrigatorio} aria-describedby={idDica} className={`${CAMPO} ${recuo} h-12`} {...props} />
        )}
        {acaoFinal}
      </div>
      {dica && <p id={idDica} className="mt-1 text-xs text-pc-texto-suave">{dica}</p>}
    </div>
  );
}

/** Campo de senha com botão para mostrar ou esconder o que foi digitado. */
export function CampoSenhaAcesso(props) {
  const [visivel, setVisivel] = useState(false);
  const Icone = visivel ? EyeOff : Eye;

  return (
    <CampoAcesso
      {...props}
      type={visivel ? "text" : "password"}
      acaoFinal={
        <button
          type="button"
          onClick={() => setVisivel((valor) => !valor)}
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={visivel}
          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-pc-texto-suave hover:text-pc-verde-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/40"
        >
          <Icone aria-hidden="true" className="h-5 w-5" />
        </button>
      }
    />
  );
}

/** Botão principal das telas de acesso, com estado de carregamento. */
export function BotaoAcesso({ carregando = false, textoCarregando, children, className = "", ...props }) {
  return (
    <button
      type="submit"
      disabled={carregando}
      className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pc-verde-900 font-semibold text-white transition hover:bg-pc-verde-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60 disabled:opacity-70 ${className}`}
      {...props}
    >
      {carregando && <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />}
      {carregando ? textoCarregando : children}
    </button>
  );
}

/** Mensagem de erro ou aviso, anunciada a leitores de tela. */
export function AvisoAcesso({ erro, aviso }) {
  return (
    <div aria-live="polite">
      {erro && <MensagemStatus mensagem={{ tipo: "erro", texto: erro }} />}
      {aviso && <MensagemStatus mensagem={{ tipo: "sucesso", texto: aviso }} />}
    </div>
  );
}

/** Painel exibido depois do cadastro: avisa que é preciso confirmar o e-mail. */
export function PainelConfirmeEmail({ mensagem, aoIrParaLogin }) {
  return (
    <div role="status" className="text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pc-verde-100">
        <MailCheck aria-hidden="true" className="h-8 w-8 text-pc-verde-700" />
      </span>
      <p className="mt-4 text-lg font-bold text-pc-verde-900">Confira seu e-mail</p>
      <p className="mt-2 text-[15px] text-pc-texto-suave">{mensagem}</p>
      <p className="mt-1 text-sm text-pc-texto-suave">Se não encontrar, olhe também a caixa de spam.</p>
      <BotaoAcesso type="button" onClick={aoIrParaLogin} className="mt-6">
        Ir para o login
      </BotaoAcesso>
    </div>
  );
}

/** Convite para o lojista, no rodapé do login e do cadastro de cliente. */
export function ChamadaLojista() {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-2xl bg-pc-verde-100 p-4">
      <Store aria-hidden="true" className="h-8 w-8 shrink-0 text-pc-verde-700" />
      <p className="text-sm text-pc-texto">
        Tem uma loja ou pet shop? <LinkAcesso to="/register-lojista">Cadastre sua loja</LinkAcesso>
      </p>
    </div>
  );
}

/** Link de texto das telas de acesso. */
export function LinkAcesso({ className = "", ...props }) {
  return (
    <Link
      className={`rounded font-semibold text-pc-verde-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/40 ${className}`}
      {...props}
    />
  );
}
