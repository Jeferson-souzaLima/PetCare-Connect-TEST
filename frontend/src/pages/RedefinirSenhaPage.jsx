import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { redefinirSenha } from "@/services/authService";

function CampoSenha({ placeholder, valor, aoMudar }) {
  return (
    <div className="flex items-center rounded-xl border-2 border-[#0E5617] p-3 focus-within:ring-2 focus-within:ring-[#F0F2A0]">
      <FaLock className="mr-3 text-[#0E5617]" />
      <input
        type="password"
        placeholder={placeholder}
        value={valor}
        minLength={8}
        autoComplete="new-password"
        onChange={(e) => aoMudar(e.target.value)}
        className="flex-1 text-gray-700 outline-none"
        required
      />
    </div>
  );
}

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-green-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-center text-2xl font-bold text-green-900">Criar nova senha</h1>

        {concluido ? (
          <div className="mt-6 text-center">
            <p className="text-green-700">{concluido}</p>
            <button type="button" onClick={() => navigate("/login")} className="mt-6 rounded-xl bg-green-900 px-5 py-3 font-semibold text-white hover:bg-green-800">
              Ir para o login
            </button>
          </div>
        ) : (
          <>
            {token && (
              <form onSubmit={salvar} className="mt-6 space-y-5">
                <CampoSenha placeholder="Nova senha (mínimo 8 caracteres)" valor={senha} aoMudar={setSenha} />
                <CampoSenha placeholder="Repita a nova senha" valor={confirmacaoSenha} aoMudar={setConfirmacaoSenha} />
                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full rounded-xl bg-[#0E5617] py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
                >
                  {enviando ? "Salvando..." : "Salvar nova senha"}
                </button>
              </form>
            )}
            {erro && <p className="mt-3 text-center text-sm text-red-500">{erro}</p>}
            <p className="mt-6 text-center text-sm text-gray-600">
              <Link to="/esqueci-senha" className="font-semibold text-[#0E5617] hover:underline">Solicitar novo link</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
