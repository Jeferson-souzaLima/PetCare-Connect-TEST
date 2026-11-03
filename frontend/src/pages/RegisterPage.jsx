import { API_URL } from "@/services/apiUrl";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaixaAceiteTermos } from "@/components/legal/CaixaAceiteTermos";

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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-green-900 text-center">Crie sua conta</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Comece com o essencial. Os demais dados podem ser preenchidos depois.</p>

        {erro && <p className="text-red-600 mb-4 text-sm text-center">{erro}</p>}
        {sucesso && (
          <div className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-800 text-center">
            <p>{sucesso}</p>
            <button type="button" onClick={() => navigate("/login")} className="mt-2 font-semibold underline">
              Ir para o login
            </button>
          </div>
        )}

        {!sucesso && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Nome completo"
              autoComplete="name"
              required
            />
            <input
              type="email"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-mail"
              autoComplete="email"
              required
            />
            <input
              type="password"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Senha (mínimo de 8 caracteres)"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <input
              type="password"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
              value={confirmacaoSenha}
              onChange={(event) => setConfirmacaoSenha(event.target.value)}
              placeholder="Confirme sua senha"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <CaixaAceiteTermos marcado={aceiteTermos} onChange={setAceiteTermos} />
            <button type="submit" disabled={enviando} className="w-full mt-2 bg-green-900 text-white py-3 rounded-xl font-semibold hover:bg-green-800 disabled:opacity-60 transition">
              {enviando ? "Criando conta..." : "Criar conta"}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-gray-600 text-center">
          Já tem conta? <button type="button" className="text-green-900 font-semibold hover:underline" onClick={() => navigate("/login")}>Faça login</button>
        </p>
        <div className="mt-8 text-center border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-2">Tem uma loja ou petshop?</p>
          <button type="button" onClick={() => navigate("/register-lojista")} className="w-full bg-transparent border-2 border-green-900 text-green-900 py-3 rounded-xl font-semibold hover:bg-green-900 hover:text-white transition">
            Sou lojista
          </button>
        </div>
      </div>
    </div>
  );
}
