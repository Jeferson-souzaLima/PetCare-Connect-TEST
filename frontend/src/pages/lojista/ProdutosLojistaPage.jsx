import { API_URL } from "@/services/apiUrl";
import { getMediaUrl } from "@/services/mediaUrl";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaImage } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";

export default function ProdutosLojistaPage() {
  const { usuario, token } = useAuth();
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    estoque: "",
    ativo: 1,
  });

  const [imagensFiles, setImagensFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [imagensExistentes, setImagensExistentes] = useState([]);

  const api = axios.create({
    baseURL: `${API_URL}`,
    headers: { Authorization: `Bearer ${token}` },
  });

  // ===============================
  // Carregar produtos
  // ===============================
  const carregarProdutos = async () => {

    try {
      const res = await api.get("/produtos/meus");

      setProdutos(res.data);
    } catch (err) {
      console.error("Erro ao carregar produtos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      carregarProdutos();
    }
  }, [token]);

  // ===============================
  // Abrir modal novo/editar
  // ===============================
  const abrirNovo = () => {
    setProdutoEditando(null);
    setForm({
      nome: "",
      descricao: "",
      preco: "",
      estoque: "",
      ativo: 1,
    });
    setImagensFiles([]);
    setPreviews([]);
    setImagensExistentes([]);
    setShowModal(true);
  };

  const editarProduto = (produto) => {
    setProdutoEditando(produto);
    setForm(produto);

    setImagensFiles([]);
    setPreviews([]);

    setImagensExistentes(
      Array.isArray(produto.imagens)
        ? produto.imagens
        : []
    );

    setShowModal(true);
  };

  // ===============================
  // Salvar Produto
  // ===============================
  const salvarProduto = async (e) => {
    e.preventDefault();

    if (!produtoEditando && imagensFiles.length === 0) {
      alert("Adicione pelo menos uma imagem.");
      return;
    }

    try {
      let produtoId;

      if (produtoEditando) {
        await api.put(`/produtos/${produtoEditando.id}`, form);
        produtoId = produtoEditando.id;
      } else {
        const res = await api.post("/produtos", form);
        produtoId = res.data.id;
      }

      // Upload imagem se existir
      if (imagensFiles.length > 0) {
        const formData = new FormData();

        imagensFiles.forEach((file) => {
          formData.append("imagens", file);
        });

        await api.post(`/produtos/${produtoId}/imagens`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setShowModal(false);
      carregarProdutos();
    } catch (err) {
      alert("Erro ao salvar produto");
    }
  };

  // ===============================
  // Deletar Produto
  // ===============================
  const deletarProduto = async (id) => {
    if (!window.confirm("Deseja excluir este produto?")) return;
    await api.delete(`/produtos/${id}`);
    carregarProdutos();
  };

  // ===============================
  // Deletar Imagem
  // ===============================
  const deletarImagem = async (imagemId) => {
    if (!produtoEditando) return;

    if (!window.confirm("Deseja excluir esta imagem?")) return;

    try {
      await api.delete(
        `/produtos/${produtoEditando.id}/imagens/${imagemId}`
      );

      setImagensExistentes((prev) =>
        prev.filter((imagem) => imagem.id !== imagemId)
      );

      carregarProdutos();
    } catch (err) {
      alert(
        err.response?.data?.mensagem ||
        "Erro ao excluir imagem."
      );
    }
  };

  // ===============================
  // Definir Imagem como Principal
  // ===============================
  const definirComoPrincipal = async (imagemId) => {
    if (!produtoEditando) return;

    try {
      await api.patch(
        `/produtos/${produtoEditando.id}/imagens/${imagemId}/principal`
      );

      setImagensExistentes((prev) =>
        prev.map((imagem) => ({
          ...imagem,
          principal: imagem.id === imagemId ? 1 : 0,
        }))
      );

      carregarProdutos();
    } catch (err) {
      alert(
        err.response?.data?.mensagem ||
        "Erro ao definir imagem principal."
      );
    }
  };

  // ===============================
  // Toggle Ativo/Inativo
  // ===============================
  const toggleAtivo = async (produto) => {
    try {
      await api.put(`/produtos/${produto.id}`, {
        ...produto,
        ativo: produto.ativo ? 0 : 1,
      });

      carregarProdutos();
    } catch (err) {
      alert("Erro ao atualizar status");
    }
  };

  if (!usuario) {
    return <p className="text-center mt-10">Usuário não logado.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

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
          Meus Produtos
        </h1>

        <p className="mt-2 text-green-800">
          Gerencie os produtos da sua loja.
        </p>
      </header>

      {/* BOTÃO NOVO */}
      <div className="px-4">
        <button
          onClick={abrirNovo}
          className="flex items-center gap-2 bg-[#0E5617] text-white px-4 py-2 rounded-xl hover:bg-green-800 transition"
        >
          <FaPlus />
          Novo Produto
        </button>
      </div>

      {/* LISTA */}
      <section className="grid gap-3 px-4">
        {loading ? (
          <p>Carregando...</p>
        ) : produtos.length === 0 ? (
          <p>Nenhum produto cadastrado.</p>
        ) : (
          produtos.map((produto) => (
            <div
              key={produto.id}
              className="flex justify-between items-center p-4 bg-white shadow rounded-xl hover:bg-green-50 transition"
            >
              <div className="flex gap-4 items-center">
                <img
                  src={getMediaUrl(produto.imagens?.[0]?.caminho, "/images/produto-padrao.jpg")}
                  alt={produto.nome}
                  className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                />

                <div>
                  <p className="font-semibold text-green-900">{produto.nome}</p>
                  <p className="text-sm text-gray-600">
                    R$ {produto.preco} • {produto.estoque} em estoque
                  </p>
                  <span
                    className={`text-xs font-semibold ${
                      produto.ativo
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 text-green-900">
                <button
                  onClick={() => toggleAtivo(produto)}
                  className="text-xs bg-green-900 text-white px-2 py-1 rounded"
                >
                  {produto.ativo ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => editarProduto(produto)}>
                  <FaEdit />
                </button>
                <button onClick={() => deletarProduto(produto.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-green-900">
              {produtoEditando ? "Editar Produto" : "Novo Produto"}
            </h2>

            <form onSubmit={salvarProduto} className="space-y-4">
              <input
                type="text"
                placeholder="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full border rounded-xl p-2"
                required
              />

              <input
                type="number"
                placeholder="Preço"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
                className="w-full border rounded-xl p-2"
                required
              />

              <input
                type="number"
                placeholder="Estoque"
                value={form.estoque}
                onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                className="w-full border rounded-xl p-2"
              />

              <textarea
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full border rounded-xl p-2"
              />

              {/* IMAGEM */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-green-900 mb-2">
                  <FaImage /> Imagem do Produto
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);

                    setImagensFiles(files);

                    const novasPreviews = files.map((file) =>
                      URL.createObjectURL(file)
                    );

                    setPreviews(novasPreviews);
                  }}
                  className="w-full"
                />

                {produtoEditando && imagensExistentes.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-green-900 mt-3 mb-2">
                      Imagens atuais
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {imagensExistentes.map((imagem) => (
                        <div
                          key={imagem.id}
                          className="relative"
                        >
                          <img
                            src={getMediaUrl(imagem.caminho, "/images/produto-padrao.jpg")}
                            alt="Imagem do produto"
                            className="w-full h-24 rounded-xl object-cover"
                          />

                          <button
                            type="button"
                            onClick={() => deletarImagem(imagem.id)}
                            className="absolute top-1 right-1 p-2 bg-white text-red-600 rounded-full shadow hover:bg-red-100"
                          >
                            <FaTrash />
                          </button>

                          {imagem.principal === 1 ? (
                            <span className="absolute bottom-1 left-1 bg-green-900 text-white text-xs px-2 py-1 rounded">
                              Principal
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => definirComoPrincipal(imagem.id)}
                              className="absolute bottom-1 left-1 bg-white text-green-900 text-xs px-2 py-1 rounded shadow hover:bg-green-100"
                            >
                              Tornar principal
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {previews.map((previewUrl, index) => (
                      <img
                        key={previewUrl}
                        src={previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
