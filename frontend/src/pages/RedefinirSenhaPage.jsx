import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircleCheck, Lock } from "lucide-react";
import { redefinirSenha } from "@/services/authService";
import { MolduraAutenticacao } from "@/components/autenticacao/MolduraAutenticacao";
import { AvisoAcesso, BotaoAcesso, CampoSenhaAcesso, LinkAcesso } from "@/components/autenticacao/ElementosAcesso";

export default function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState("");
  const [erro, setErro] = useState(token ? "" : "O link é inválido. Solicite um novo.");

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    if (senha !== confirmacaoSenha) {
      setErro("A confirmação de senha não confere.");
      return;
    }

    setEnviando(true);
    try {
      const resposta = await redefinirSenha({ token, senha, confirmacaoSenha });
      setConcluido(resposta.mensagem);
    } catch (falha) {
      setErro(falha?.response?.data?.mensagem || "Erro ao conectar com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  if (concluido) {
    return (
      <MolduraAutenticacao titulo="Senha alterada">
        <div role="status" className="text-center">
          <CircleCheck aria-hidden="true" className="mx-auto h-14 w-14 text-pc-verde-700" />
          <p className="mt-3 text-[15px] text-pc-texto-suave">{concluido}</p>
          <BotaoAcesso type="button" onClick={() => navigate("/login")} className="mt-6">
            Ir para o login
          </BotaoAcesso>
        </div>
      </MolduraAutenticacao>
    );
  }

  return (
    <MolduraAutenticacao titulo="Criar nova senha" subtitulo="Escolha uma senha com pelo menos 8 caracteres.">
      {token && (
        <form onSubmit={salvar} className="space-y-4">
          <CampoSenhaAcesso
            id="nova-senha"
            rotulo="Nova senha"
            icone={Lock}
            autoComplete="new-password"
            minLength={8}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            obrigatorio
          />
          <CampoSenhaAcesso
            id="nova-senha-confirmacao"
            rotulo="Repita a nova senha"
            icone={Lock}
            autoComplete="new-password"
            minLength={8}
            value={confirmacaoSenha}
            onChange={(e) => setConfirmacaoSenha(e.target.value)}
            obrigatorio
          />
          <AvisoAcesso erro={erro} />
          <BotaoAcesso carregando={enviando} textoCarregando="Salvando...">Salvar nova senha</BotaoAcesso>
        </form>
      )}
      {!token && <AvisoAcesso erro={erro} />}

      <p className="mt-6 text-center text-[15px]">
        <LinkAcesso to="/esqueci-senha">Solicitar novo link</LinkAcesso>
      </p>
    </MolduraAutenticacao>
  );
}
