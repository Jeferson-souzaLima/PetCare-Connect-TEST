import { useState } from "react";
import { Link } from "react-router-dom";
import { FaDownload, FaShieldAlt, FaTrashAlt } from "react-icons/fa";

import api from "../../services/api";
import MensagemStatus from "../ui/MensagemStatus";

function baixarJson(dados, nomeArquivo) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Direitos do titular (LGPD, art. 18): baixar os próprios dados e excluir a conta.
 * As regras (senha, pendências, o que é apagado) ficam no backend.
 * `onContaExcluida` é chamado depois que a API confirma a exclusão.
 */
export default function PrivacidadeConta({ onContaExcluida }) {
  const [exportando, setExportando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [senha, setSenha] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  async function exportarDados() {
    setMensagem(null);
    setExportando(true);
    try {
      const { data } = await api.get("/usuarios/me/dados");
      baixarJson(data, "petcare-connect-meus-dados.json");
      setMensagem({ tipo: "sucesso", texto: "Arquivo com os seus dados baixado." });
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto: erro.response?.data?.mensagem || "Não foi possível exportar seus dados agora.",
      });
    } finally {
      setExportando(false);
    }
  }

  function cancelarExclusao() {
    setConfirmandoExclusao(false);
    setSenha("");
    setMensagem(null);
  }

  async function excluirConta(event) {
    event.preventDefault();
    setMensagem(null);
    setExcluindo(true);
    try {
      const { data } = await api.delete("/usuarios/me", { data: { senha } });
      onContaExcluida(data.mensagem);
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto: erro.response?.data?.mensagem || "Não foi possível excluir a conta agora.",
      });
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 text-[#0E5617] flex items-center justify-center shrink-0">
          <FaShieldAlt />
        </div>
        <div>
          <h2 className="font-bold text-gray-800">Privacidade e dados</h2>
          <p className="text-sm text-gray-500">
            Saiba como tratamos seus dados na{" "}
            <Link to="/privacidade" className="text-[#0E5617] underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>

      <MensagemStatus mensagem={mensagem} />

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={exportarDados}
          disabled={exportando}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-60"
        >
          <FaDownload />
          {exportando ? "Preparando arquivo..." : "Baixar meus dados"}
        </button>

        {!confirmandoExclusao && (
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-700 font-semibold hover:bg-red-50"
          >
            <FaTrashAlt />
            Excluir minha conta
          </button>
        )}
      </div>

      {confirmandoExclusao && (
        <form onSubmit={excluirConta} className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm text-red-800">
            Seus dados pessoais, pets e favoritos serão apagados e você não poderá mais entrar com esta conta.
            Pedidos e agendamentos concluídos continuam registrados para a loja, sem seus dados de contato.
            Esta ação não pode ser desfeita.
          </p>
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Digite sua senha para confirmar"
            autoComplete="current-password"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={!senha || excluindo}
              className="px-4 py-2 rounded-xl bg-red-700 text-white font-semibold hover:bg-red-800 disabled:opacity-60"
            >
              {excluindo ? "Excluindo..." : "Excluir definitivamente"}
            </button>
            <button
              type="button"
              onClick={cancelarExclusao}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-white"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
