import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import { solicitarRedefinicaoSenha } from "@/services/authService";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);

    try {
      const resposta = await solicitarRedefinicaoSenha(email);
      setAviso(`${resposta.mensagem} Confira também a caixa de spam.`);
    } catch (falha) {
      setErro(falha?.response?.data?.mensagem || "Erro ao conectar com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-green-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-center text-2xl font-bold text-green-900">Esqueci minha senha</h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
        </p>

        <form onSubmit={enviar} className="mt-6 space-y-5">
          <div className="flex items-center rounded-xl border-2 border-[#0E5617] p-3 focus-within:ring-2 focus-within:ring-[#F0F2A0]">
            <FaEnvelope className="mr-3 text-[#0E5617]" />
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 text-gray-700 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl bg-[#0E5617] py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        {erro && <p className="mt-3 text-center text-sm text-red-500">{erro}</p>}
        {aviso && <p className="mt-3 text-center text-sm text-green-700">{aviso}</p>}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="font-semibold text-[#0E5617] hover:underline">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
