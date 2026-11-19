import { API_URL } from "@/services/apiUrl";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, User } from "lucide-react";
import { CaixaAceiteTermos } from "@/components/legal/CaixaAceiteTermos";
import { MolduraAutenticacao } from "@/components/autenticacao/MolduraAutenticacao";
import {
  AvisoAcesso,
  BotaoAcesso,
  CampoAcesso,
  CampoSenhaAcesso,
  ChamadaLojista,
  LinkAcesso,
  PainelConfirmeEmail,
} from "@/components/autenticacao/ElementosAcesso";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (senha !== confirmacaoSenha) {
      setErro("A confirmação de senha não confere.");
      return;
    }

    if (!aceiteTermos) {
      setErro("Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setEnviando(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, confirmacaoSenha, aceiteTermos }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErro(data.mensagem || "Não foi possível criar sua conta.");
        return;
      }

      setSucesso(data.mensagem);
    } catch (error) {
      console.error(error);
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) {
    return (
      <MolduraAutenticacao titulo="Conta criada!">
        <PainelConfirmeEmail mensagem={sucesso} aoIrParaLogin={() => navigate("/login")} />
      </MolduraAutenticacao>
    );
  }

  return (
    <MolduraAutenticacao titulo="Crie sua conta" subtitulo="Comece com o essencial. Os demais dados podem ser preenchidos depois.">
      <form onSubmit={handleRegister} className="space-y-4">
        <CampoAcesso
          id="cadastro-nome"
          rotulo="Nome completo"
          icone={User}
          autoComplete="name"
          placeholder="Como devemos te chamar"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          obrigatorio
        />
        <CampoAcesso
          id="cadastro-email"
          rotulo="E-mail"
          icone={Mail}
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          obrigatorio
        />
        <CampoSenhaAcesso
          id="cadastro-senha"
          rotulo="Senha"
          icone={Lock}
          autoComplete="new-password"
          minLength={8}
          dica="Mínimo de 8 caracteres."
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          obrigatorio
        />
        <CampoSenhaAcesso
          id="cadastro-confirmacao"
          rotulo="Confirme a senha"
          icone={Lock}
          autoComplete="new-password"
          minLength={8}
          value={confirmacaoSenha}
          onChange={(event) => setConfirmacaoSenha(event.target.value)}
          obrigatorio
        />
        <CaixaAceiteTermos marcado={aceiteTermos} onChange={setAceiteTermos} />

        <AvisoAcesso erro={erro} />
        <BotaoAcesso carregando={enviando} textoCarregando="Criando conta...">Criar conta</BotaoAcesso>
      </form>

      <p className="mt-6 text-center text-[15px] text-pc-texto-suave">
        Já tem conta? <LinkAcesso to="/login">Entrar</LinkAcesso>
      </p>

      <ChamadaLojista />
    </MolduraAutenticacao>
  );
}
