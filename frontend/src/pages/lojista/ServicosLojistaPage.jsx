import { useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "../../hooks/useAuth";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function ServicosLojistaPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [servicoEditando, setServicoEditando] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    duracao_min: "",
    ativo: 1,
  });

  // ===============================
  // CARREGAR SERVIÇOS
  // ===============================
  const carregarServicos = async () => {
    try {
      const res = await api.get("/servicos/meus");
      setServicos(res.data);
    } catch {
      console.error("Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarServicos();
  }, []);

  // ===============================
  // MODAL
  // ===============================
  const abrirNovo = () => {
    setServicoEditando(null);
    setForm({
      nome: "",
      descricao: "",
      preco: "",
      duracao_min: "",
      ativo: 1,
    });
    setShowModal(true);
  };

  const editarServico = (servico) => {
    setServicoEditando(servico);
    setForm(servico);
    setShowModal(true);
  };

  // ===============================
  // SALVAR
  // ===============================
  const salvarServico = async (e) => {
    e.preventDefault();

    try {
      if (servicoEditando) {
        await api.put(`/servicos/${servicoEditando.id}`, form);
      } else {
        await api.post("/servicos", form);
      }

      setShowModal(false);
      carregarServicos();
    } catch {
      alert("Erro ao salvar serviço");
    }
  };

  // ===============================
  // DELETAR
  // ===============================
  const deletarServico = async (id) => {
    if (!window.confirm("Deseja excluir este serviço?")) return;

    try {
      await api.delete(`/servicos/${id}`);
      carregarServicos();
    } catch {
      alert("Erro ao deletar serviço");
    }
  };

  // ===============================
  // TOGGLE ATIVO
  // ===============================
  const toggleAtivo = async (servico) => {
    try {
      await api.put(`/servicos/${servico.id}`, {
        ...servico,
        ativo: servico.ativo ? 0 : 1,
      });
      carregarServicos();
    } catch {
      alert("Erro ao atualizar status");
    }
  };

  if (!usuario) {
    return <p className="text-center mt-10">Usuário não logado.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <header className="rounded-b-3xl bg-gradient-to-r from-green-200 to-green-300 p-8 shadow-md sm:p-10">
        <button
          type="button"
          onClick={() => navigate("/perfil-lojista")}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-green-900 hover:underline"
        >
          <FaArrowLeft />
          Voltar ao painel
        </button>

        <h1 className="text-3xl font-bold text-green-900">
          Meus Serviços
        </h1>

        <p className="mt-2 text-green-800">
          Gerencie os serviços da sua loja.
        </p>
      </header>

      {/* BOTÃO NOVO */}
      <div className="px-4">
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-[#0E5617] text-white px-4 py-2 rounded-xl hover:bg-green-800 transition"
        >
          <FaPlus />
          Novo Serviço
        </button>
      </div>

      {/* LISTA */}
      <section className="grid gap-3 px-4">
        {loading ? (
          <p>Carregando...</p>
        ) : servicos.length === 0 ? (
          <p>Nenhum serviço cadastrado.</p>
        ) : (
          servicos.map((servico) => (
            <div
              key={servico.id}
              className="flex justify-between items-center p-4 bg-white shadow rounded-xl hover:bg-green-50 transition"
            >
              <div>
                <p className="font-semibold text-green-900">
                  {servico.nome}
                </p>
                <p className="text-sm text-gray-600">
                  R$ {servico.preco} • {servico.duracao_min} min
                </p>
                <span
                  className={`text-xs font-semibold ${
                    servico.ativo
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {servico.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="flex gap-3 text-green-900">
                <button onClick={() => editarServico(servico)}>
                  <FaEdit />
                </button>
                <button onClick={() => deletarServico(servico.id)}>
                  <FaTrash />
                </button>
                <button
                  onClick={() => toggleAtivo(servico)}
                  className="text-xs bg-green-900 text-white px-2 py-1 rounded"
                >
                  {servico.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-green-900">
              {servicoEditando ? "Editar Serviço" : "Novo Serviço"}
            </h2>

            <form onSubmit={salvarServico} className="space-y-4">

              <input
                type="text"
                placeholder="Nome"
                value={form.nome}
                onChange={(e) =>
                  setForm({ ...form, nome: e.target.value })
                }
                className="w-full border rounded-xl p-2"
                required
              />

              <input
                type="number"
                placeholder="Preço"
                value={form.preco}
                onChange={(e) =>
                  setForm({ ...form, preco: e.target.value })
                }
                className="w-full border rounded-xl p-2"
                required
              />

              <input
                type="number"
                placeholder="Duração (minutos)"
                value={form.duracao_min}
                onChange={(e) =>
                  setForm({ ...form, duracao_min: e.target.value })
                }
                className="w-full border rounded-xl p-2"
                required
              />

              <textarea
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) =>
                  setForm({ ...form, descricao: e.target.value })
                }
                className="w-full border rounded-xl p-2"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-200"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0E5617] text-white"
                >
                  Salvar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}