import { API_URL } from "@/services/apiUrl";
import { useState } from "react";
import { CHAVE_AVISO_SESSAO_EXPIRADA } from "@/utils/sessao";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { FaEnvelope, FaLock } from "react-icons/fa";

// Mostra uma vez o motivo de a pessoa ter sido levada ao login.
function lerAvisoSessaoExpirada() {
  try {
    if (sessionStorage.getItem(CHAVE_AVISO_SESSAO_EXPIRADA)) {
      sessionStorage.removeItem(CHAVE_AVISO_SESSAO_EXPIRADA);
      return "Sua sessão expirou. Entre novamente para continuar.";
    }
  } catch {
    // sessionStorage indisponível: segue sem o aviso.
  }
  return "";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState(lerAvisoSessaoExpirada);
  const [emailNaoVerificado, setEmailNaoVerificado] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEmailNaoVerificado(false);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();

      

      if (!res.ok) {
        setErro(data.mensagem || "Erro ao logar");
        setEmailNaoVerificado(data.codigo === "EMAIL_NAO_VERIFICADO");
        return;
      }

      login(data.usuario, data.token);
      if (data.usuario.tipo === "lojista") {
        navigate("/perfil-lojista");
      } else {
        navigate("/perfil");
      }
      
    } catch (err) {
      setErro("Erro ao conectar com o servidor");
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
    } catch (error) {
      setErro("Erro ao conectar com o servidor");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="PetCare Connect"
            className="mx-auto w-28 h-28"
          />
          <p className="text-gray-600 mt-2">Entre para cuidar do seu pet</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="flex items-center border-2 border-[#0E5617] rounded-xl p-3 focus-within:ring-2 focus-within:ring-[#F0F2A0]">
            <FaEnvelope className="text-[#0E5617] mr-3" />
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 outline-none text-gray-700"
              required
            />
          </div>

          <div className="flex items-center border-2 border-[#0E5617] rounded-xl p-3 focus-within:ring-2 focus-within:ring-[#F0F2A0]">
            <FaLock className="text-[#0E5617] mr-3" />
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="flex-1 outline-none text-gray-700"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0E5617] text-white py-3 rounded-xl font-semibold hover:bg-green-800 transition"
          >
            Entrar
          </button>
        </form>

        {erro && (
          <p className="text-red-500 text-sm mt-3 text-center">{erro}</p>
        )}
        {emailNaoVerificado && (
          <button type="button" onClick={reenviarConfirmacao} className="mt-3 w-full text-sm font-semibold text-green-800 hover:underline">
            Reenviar e-mail de confirmação
          </button>
        )}
        {aviso && <p className="text-green-700 text-sm mt-3 text-center">{aviso}</p>}

        {/* Link para cadastro */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Ainda não tem conta?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-[#0E5617] font-semibold cursor-pointer hover:underline"
          >
            Cadastre-se
          </span>
        </p>
      </div>
    </div>
  );
}
