import { Link } from "react-router-dom";
import { ChevronRight, LockKeyhole, LogOut, MapPin, Settings, UserRound } from "lucide-react";
import DadosPessoais from "./DadosPessoais";
import EnderecoPerfil from "./EnderecoPerfil";
import MensagemStatus from "../ui/MensagemStatus";

const LINHA =
  "flex w-full min-h-[64px] items-center gap-3 rounded-2xl px-3 text-left transition-colors hover:bg-pc-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700";

function Icone({ icone: IconeItem, perigo = false }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${perigo ? "bg-red-50 text-red-600" : "bg-pc-verde-100 text-pc-verde-700"}`}>
      <IconeItem size={20} aria-hidden="true" />
    </span>
  );
}

function Textos({ titulo, descricao, perigo = false }) {
  return (
    <span className="min-w-0 flex-1">
      <span className={`block text-sm font-bold ${perigo ? "text-red-600" : "text-pc-texto"}`}>{titulo}</span>
      {descricao && <span className="block text-xs text-pc-texto-suave">{descricao}</span>}
    </span>
  );
}

/** Item que se abre no próprio lugar (dados pessoais, endereço). */
function ItemExpansivel({ id, titulo, descricao, icone, aberto, onAlternar, children }) {
  const painelId = `config-${id}`;
  return (
    <li className="rounded-2xl border border-black/5 bg-white">
      <button type="button" onClick={() => onAlternar(id)} aria-expanded={aberto} aria-controls={painelId} className={LINHA}>
        <Icone icone={icone} />
        <Textos titulo={titulo} descricao={descricao} />
        <ChevronRight size={18} aria-hidden="true" className={`shrink-0 text-pc-texto-suave transition-transform duration-300 ${aberto ? "rotate-90" : ""}`} />
      </button>
      <div id={painelId} className={`grid transition-[grid-template-rows] duration-300 ease-out ${aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden" {...(aberto ? {} : { inert: "", "aria-hidden": true })}>
          <div className="px-3 pb-3">{children}</div>
        </div>
      </div>
    </li>
  );
}

/**
 * "Configurações da conta": dados pessoais e endereço (editáveis no lugar), senha (redefinição
 * por e-mail, o fluxo que existe) e sair. Os estados de edição vêm da página.
 */
export default function ConfiguracoesConta({ comTitulo = false, secaoAberta, onAlternarSecao, dadosPessoais, endereco, mensagemPerfil, onSair }) {
  return (
    <div id="configuracoes-conta">
      {comTitulo && (
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-pc-texto">
          <Settings size={22} aria-hidden="true" className="text-pc-verde-700" />
          Configurações da conta
        </h2>
      )}

      <ul className="space-y-2">
        <ItemExpansivel id="dados" titulo="Dados pessoais" descricao="Nome, e-mail e telefone" icone={UserRound} aberto={secaoAberta === "dados"} onAlternar={onAlternarSecao}>
          <DadosPessoais {...dadosPessoais} />
        </ItemExpansivel>

        <ItemExpansivel id="endereco" titulo="Endereço de entrega" descricao="Usado nas suas compras" icone={MapPin} aberto={secaoAberta === "endereco"} onAlternar={onAlternarSecao}>
          <EnderecoPerfil {...endereco} />
        </ItemExpansivel>

        <li className="rounded-2xl border border-black/5 bg-white">
          <Link to="/esqueci-senha" className={LINHA}>
            <Icone icone={LockKeyhole} />
            <Textos titulo="Segurança e senha" descricao="Redefina sua senha pelo e-mail" />
            <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-pc-texto-suave" />
          </Link>
        </li>

        <li className="rounded-2xl border border-black/5 bg-white">
          <button type="button" onClick={onSair} className={LINHA}>
            <Icone icone={LogOut} perigo />
            <Textos titulo="Sair da conta" perigo />
          </button>
        </li>
      </ul>

      <MensagemStatus mensagem={mensagemPerfil} />
    </div>
  );
}
