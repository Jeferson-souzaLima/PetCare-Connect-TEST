import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";

import PetModal from "../../components/modals/PetModal";
import PerfilCabecalho from "../../components/perfil/PerfilCabecalho";
import AcessosRapidos from "../../components/perfil/AcessosRapidos";
import DadosConta from "../../components/perfil/DadosConta";
import ListaPets from "../../components/perfil/ListaPets";
import petService from "../../services/petService";
import api from "../../services/api";
import { Footer } from "../../components/layout/Footer";
import { useEnderecoPerfil } from "../../hooks/useEnderecoPerfil";

export default function PerfilPage() {
  const {
    usuario,
    token,
    logout,
    atualizarUsuario
  } = useAuth();

  const navigate = useNavigate();

  const {
    usandoLocalizacao,
    editandoEndereco,
    enderecoForm,
    setEnderecoForm,
    salvandoEndereco,
    mensagemEndereco,
    buscandoCep,
    iniciarEdicaoEndereco,
    cancelarEdicaoEndereco,
    buscarCep,
    salvarEndereco,
  } = useEnderecoPerfil({ usuario, token, atualizarUsuario });

  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  const [showUserData, setShowUserData] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const [showModalPet, setShowModalPet] = useState(false);
  const [petParaEditar, setPetParaEditar] = useState(null);

  const [campoEditando, setCampoEditando] = useState(null);
  const [valorEditando, setValorEditando] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState(null);


  // =========================================================
  // PETS
  // =========================================================

  const carregarPets = useCallback(async () => {
    if (!usuario || !token) return;

    setLoadingPets(true);

    try {
      const { data } = await petService.listar(token);
      setPets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar pets:", err);
      setPets([]);
    } finally {
      setLoadingPets(false);
    }
  }, [usuario, token]);

  useEffect(() => {
    carregarPets();
  }, [carregarPets]);

  // =========================================================
  // PERFIL
  // =========================================================

  useEffect(() => {
    if (!token) return;

    async function carregarPerfil() {
      try {
        const { data } = await api.get("/usuarios/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        atualizarUsuario(data);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      }
    }

    carregarPerfil();
  }, [token]);

  // =========================================================
  // DADOS DO PERFIL
  // =========================================================

  function iniciarEdicao(campo) {
    setMensagemPerfil(null);
    setCampoEditando(campo);
    setValorEditando(usuario[campo] || "");
  }

  function cancelarEdicao() {
    setCampoEditando(null);
    setValorEditando("");
    setMensagemPerfil(null);
  }

  async function salvarCampo() {
    if (!campoEditando) return;

    const valor = valorEditando.trim();

    if (!valor) {
      setMensagemPerfil({
        tipo: "erro",
        texto: "Preencha o campo antes de salvar."
      });
      return;
    }

    setSalvandoPerfil(true);
    setMensagemPerfil(null);

    try {
      const dadosAtualizados = {
        [campoEditando]: valor
      };

      await api.put(
        "/usuarios/me",
        dadosAtualizados,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      atualizarUsuario(dadosAtualizados);

      setMensagemPerfil({
        tipo: "sucesso",
        texto: "Dados atualizados com sucesso."
      });

      setCampoEditando(null);
      setValorEditando("");
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);

      setMensagemPerfil({
        tipo: "erro",
        texto:
          err.response?.data?.mensagem ||
          "Não foi possível atualizar seus dados."
      });
    } finally {
      setSalvandoPerfil(false);
    }
  }

  // =========================================================
  // PET
  // =========================================================

  async function removerPet(id) {
    if (!confirm("Deseja realmente remover este pet?")) {
      return;
    }

    try {
      await petService.deletar(id, token);

      setPets((prev) =>
        prev.filter((p) => p.id !== id)
      );
    } catch (err) {
      alert("Erro ao remover pet.");
      console.log(err);
    }
  }

  // =========================================================
  // USUÁRIO NÃO LOGADO
  // =========================================================

  if (!usuario) {
    return (
      <div className="min-h-screen bg-[#EBE9E9] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <FaUser className="mx-auto text-4xl text-gray-400 mb-4" />

          <h2 className="text-xl font-bold text-gray-800">
            Usuário não logado
          </h2>

          <p className="text-gray-500 mt-2">
            Faça login para acessar sua conta.
          </p>
        </div>
      </div>
    );
  }

  function alternarDadosConta() {
    setShowUserData(!showUserData);

    if (showUserData) {
      cancelarEdicao();
      cancelarEdicaoEndereco();
    }
  }

  function sairDaConta() {
    const confirmar = window.confirm(
      "Tem certeza que deseja sair da sua conta?"
    );

    if (confirmar) {
      logout();
      navigate("/login");
    }
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="bg-[#EBE9E9] min-h-screen flex flex-col">
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 space-y-6">

        <PerfilCabecalho
          usuario={usuario}
          showUserData={showUserData}
          onAlternarDados={alternarDadosConta}
        />

        <AcessosRapidos onNavegar={navigate} />

        <DadosConta
          showUserData={showUserData}
          onAlternarDados={alternarDadosConta}
          dadosPessoais={{
            usuario,
            campoEditando,
            valorEditando,
            setValorEditando,
            iniciarEdicao,
            cancelarEdicao,
            salvarCampo,
            salvandoPerfil,
          }}
          endereco={{
            usuario,
            editandoEndereco,
            onAlternarEdicao: () => {
              if (editandoEndereco) {
                cancelarEdicaoEndereco();
              } else {
                iniciarEdicaoEndereco();
              }
            },
            enderecoForm,
            setEnderecoForm,
            buscarCep,
            buscandoCep,
            mensagemEndereco,
            salvarEndereco,
            salvandoEndereco,
            usandoLocalizacao,
            cancelarEdicaoEndereco,
          }}
          mensagemPerfil={mensagemPerfil}
          onSair={sairDaConta}
        />

        <ListaPets
          pets={pets}
          loadingPets={loadingPets}
          onEditarPet={(pet) => {
            setPetParaEditar(pet);
            setShowModalPet(true);
          }}
          onRemoverPet={removerPet}
          onAdicionarPet={() => {
            setPetParaEditar(null);
            setShowModalPet(true);
          }}
        />

      </main>

      {showModalPet && (
        <PetModal
          token={token}
          petExistente={petParaEditar}
          onClose={() => {
            setShowModalPet(false);
            setPetParaEditar(null);
          }}
          onPetSalvo={() => {
            carregarPets();
          }}
        />
      )}

      <Footer />
    </div>
  );
}
