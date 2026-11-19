import { API_URL } from "@/services/apiUrl";
import { useEffect, useState } from "react";
import { lerAvisoParaLogin, limparAvisoParaLogin } from "@/utils/sessao";
import { useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { MolduraAutenticacao } from "@/components/autenticacao/MolduraAutenticacao";
import {
  AvisoAcesso,
  BotaoAcesso,
  CampoAcesso,
  CampoSenhaAcesso,
  ChamadaLojista,
  LinkAcesso,
} from "@/components/autenticacao/ElementosAcesso";

const DESTINO_APOS_LOGIN = { lojista: "/perfil-lojista", admin: "/admin" };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState(lerAvisoParaLogin);
  const [emailNaoVerificado, setEmailNaoVerificado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [manterConectado, setManterConectado] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // O aviso (ex.: sessão expirada) é exibido uma vez e então descartado.
  useEffect(() => {
    limparAvisoParaLogin();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEmailNaoVerificado(false);
    setEnviando(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, manterConectado }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.mensagem || "Erro ao logar");
        setEmailNaoVerificado(data.codigo === "EMAIL_NAO_VERIFICADO");
        return;
      }

      login(data.usuario, data.token);
      navigate(DESTINO_APOS_LOGIN[data.usuario.tipo] || "/perfil");
    } catch {
      setErro("Erro ao conectar com o servidor");
    } finally {
      setEnviando(false);
    }
  };

  const reenviarConfirmacao = async () => {
    setErro("");
    setAviso("");

    try {
      const response = await fetch(`${API_URL}/auth/reenviar-confirmacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErro(data.mensagem || "Não foi possível reenviar o e-mail.");
        return;
      }

      setAviso(data.mensagem);
    } catch {
      setErro("Erro ao conectar com o servidor");
    }
  };

  return (
    <MolduraAutenticacao titulo="Que bom ter você aqui!" subtitulo="Entre na sua conta para continuar.">
      <form onSubmit={handleLogin} className="space-y-4">
        <CampoAcesso
          id="login-email"
          rotulo="E-mail"
          icone={Mail}
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          obrigatorio
        />
        <div>
          <CampoSenhaAcesso
            id="login-senha"
            rotulo="Senha"
            icone={Lock}
            autoComplete="current-password"
            placeholder="Sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            obrigatorio
          />
          <div className="mt-3 flex items-start justify-between gap-4 text-sm">
            <label className="flex min-w-0 cursor-pointer items-start gap-2 text-pc-texto">
              <input
                type="checkbox"
                checked={manterConectado}
                onChange={(e) => setManterConectado(e.target.checked)}
                aria-describedby="login-manter-dica"
                className="mt-0.5 h-4 w-4 accent-pc-verde-700"
              />
              <span>
                Manter conectado
                <span id="login-manter-dica" className="block text-xs text-pc-texto-suave">Por 30 dias. Use só em aparelho pessoal.</span>
              </span>
            </label>
            <LinkAcesso to="/esqueci-senha" className="shrink-0">Esqueci minha senha</LinkAcesso>
          </div>
        </div>

        <AvisoAcesso erro={erro} aviso={aviso} />
        {emailNaoVerificado && (
          <button type="button" onClick={reenviarConfirmacao} className="w-full rounded text-sm font-semibold text-pc-verde-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/40">
            Reenviar e-mail de confirmação
          </button>
        )}

        <BotaoAcesso carregando={enviando} textoCarregando="Entrando...">Entrar</BotaoAcesso>
      </form>

      <p className="mt-6 text-center text-[15px] text-pc-texto-suave">
        Ainda não tem conta? <LinkAcesso to="/register">Cadastre-se</LinkAcesso>
      </p>

      <ChamadaLojista />
    </MolduraAutenticacao>
  );
}
