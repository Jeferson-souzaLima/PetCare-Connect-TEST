import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";

import PetModal from "../../components/modals/PetModal";
import PerfilCabecalho from "../../components/perfil/PerfilCabecalho";
import AcessosRapidos from "../../components/perfil/AcessosRapidos";
import ConfiguracoesConta from "../../components/perfil/ConfiguracoesConta";
import ListaPets from "../../components/perfil/ListaPets";
import MenuLateralPerfil from "../../components/perfil/MenuLateralPerfil";
import { useListasPerfil } from "@/hooks/useListasPerfil";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useOpcoesPet } from "@/hooks/useOpcoesPet";
import { deixarAvisoParaLogin } from "@/utils/sessao";
import { contadoresPerfil } from "@/utils/perfil";
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

  // Celular: a gaveta de configurações sob o cartão verde. Item aberto: "dados" | "endereco" | null.
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [configAberta, setConfigAberta] = useState(false);
  const [secaoConfig, setSecaoConfig] = useState(null);
  const listas = useListasPerfil();
  const { opcoes: opcoesPet } = useOpcoesPet();

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
      console.error("Erro ao carregar pets:", err?.response?.status ?? err?.message);
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
        console.error("Erro ao carregar perfil:", err?.response?.status ?? err?.message);
      }
    }

    carregarPerfil();
  }, [token, atualizarUsuario]);

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
      console.error("Erro ao atualizar perfil:", err?.response?.status ?? err?.message);

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

  // Chamado pelo modal de edição, depois da confirmação; um erro volta para o modal mostrar.
  async function excluirPet(id) {
    await petService.deletar(id, token);
    setPets((prev) => prev.filter((p) => p.id !== id));
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

  // Ao fechar um item (ou a gaveta), descarta a edição em andamento dele.
  function fecharEdicoes() {
    cancelarEdicao();
    cancelarEdicaoEndereco();
  }

  function alternarSecao(id) {
    fecharEdicoes();
    setSecaoConfig((atual) => (atual === id ? null : id));
  }

  function alternarConfig() {
    if (configAberta) {
      fecharEdicoes();
      setSecaoConfig(null);
    }
    setConfigAberta(!configAberta);
  }

  // Abre um item das configurações e rola até elas (desktop: cartão ao lado dos pets).
  function abrirNaConfiguracao(secao) {
    fecharEdicoes();
    setSecaoConfig(secao);
    irPara("configuracoes");
  }

  function irPara(secao) {
    if (secao === "privacidade") {
      abrirNaConfiguracao("privacidade");
      return;
    }
    if (secao === "topo") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(secao)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Desktop: "Editar perfil" abre os dados pessoais no cartão de configurações.
  function editarPerfil() {
    abrirNaConfiguracao("dados");
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

  function contaExcluida(mensagem) {
    deixarAvisoParaLogin(mensagem);
    logout();
    navigate("/login");
  }

  const contadores = contadoresPerfil({ ...listas, pets: loadingPets ? null : pets });

  const configuracoes = (
    <ConfiguracoesConta
      comTitulo={desktop}
      secaoAberta={secaoConfig}
      onAlternarSecao={alternarSecao}
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
      onContaExcluida={contaExcluida}
    />
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="bg-pc-fundo min-h-screen flex flex-col">
      <div className="flex-1 mx-auto w-full max-w-pc-pagina px-4 py-5 md:px-6 md:py-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6">
        {desktop && (
          <aside>
            <MenuLateralPerfil onIrPara={irPara} />
          </aside>
        )}

        <div className="min-w-0 space-y-6">
          <PerfilCabecalho
            usuario={usuario}
            desktop={desktop}
            configAberta={configAberta}
            onConfig={desktop ? editarPerfil : alternarConfig}
          >
            {!desktop && <div className="p-3">{configuracoes}</div>}
          </PerfilCabecalho>

          <AcessosRapidos contadores={contadores} onIrParaPets={() => irPara("meus-pets")} />

          <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-6 lg:space-y-0">
            <ListaPets
              pets={pets}
              opcoes={opcoesPet}
              loadingPets={loadingPets}
              onEditarPet={(pet) => {
                setPetParaEditar(pet);
                setShowModalPet(true);
              }}
              onAdicionarPet={() => {
                setPetParaEditar(null);
                setShowModalPet(true);
              }}
            />

            {desktop && (
              <section id="configuracoes" className="scroll-mt-28 rounded-pc-card bg-white p-5 shadow-pc-card">
                {configuracoes}
              </section>
            )}
          </div>
        </div>
      </div>

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
          onExcluir={excluirPet}
        />
      )}

      <Footer />
    </div>
  );
}
