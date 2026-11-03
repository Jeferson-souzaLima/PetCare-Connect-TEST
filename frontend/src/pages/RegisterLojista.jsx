import { API_URL } from "@/services/apiUrl";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaixaAceiteTermos } from "@/components/legal/CaixaAceiteTermos";

export default function RegisterLojista() {
  const navigate = useNavigate();
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [descricao, setDescricao] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [erro, setErro] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErro("");

    if (!nomeFantasia || !cnpj || !email || !senha) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (!aceiteTermos) {
      setErro("Para cadastrar a loja, aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/register-lojista`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeFantasia,
          razaoSocial,
          cnpj,
          email,
          senha,
          telefone,
          cidade,
          uf,
          descricao,
          aceiteTermos,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.mensagem || "Erro ao cadastrar lojista.");
        return;
      }

      alert("Cadastro de lojista realizado com sucesso! Faça login.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setErro("Erro de conexão. Tente novamente.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-800">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <h1 className="text-3xl font-bold mb-6 text-green-900 text-center">
          Cadastro de Loja
        </h1>

        {erro && (
          <p className="text-red-500 mb-4 text-sm text-center">{erro}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            placeholder="Nome Fantasia"
          />

          <input
            type="text"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            placeholder="Razão Social (opcional)"
          />

          <input
            type="text"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="CNPJ"
          />

          <input
            type="email"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            type="password"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
          />

          <input
            type="text"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone"
          />

          <div className="flex gap-4">
            <input
              type="text"
              className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Cidade"
            />
            <input
              type="text"
              className="w-20 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              placeholder="UF"
              maxLength={2}
            />
          </div>

          <textarea
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-900 resize-none"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição da loja (opcional)"
            rows={3}
          />

          <CaixaAceiteTermos marcado={aceiteTermos} onChange={setAceiteTermos} />

          <button
            type="submit"
            className="w-full mt-6 bg-green-900 text-white py-3 rounded-xl font-semibold hover:bg-green-800 transition"
          >
            Cadastrar Loja
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Já tem conta?{" "}
          <span
            className="text-green-900 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Faça login
          </span>
        </p>
      </div>
    </div>
  );
}