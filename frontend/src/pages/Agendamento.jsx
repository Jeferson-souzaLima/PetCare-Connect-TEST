import { API_URL } from "@/services/apiUrl";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import PetModal from "../components/modals/PetModal";
import AgendamentoCabecalho from "../components/agendamento/AgendamentoCabecalho";
import SeletorPet from "../components/agendamento/SeletorPet";
import SeletorDataHorario from "../components/agendamento/SeletorDataHorario";
import SeletorTransporte from "../components/agendamento/SeletorTransporte";
import CampoObservacoes from "../components/agendamento/CampoObservacoes";
import ResumoAgendamento from "../components/agendamento/ResumoAgendamento";
import ConfirmarAgendamento from "../components/agendamento/ConfirmarAgendamento";
import {
  AgendamentoCarregando,
  AgendamentoErro,
} from "../components/agendamento/EstadosAgendamento";
import { useDadosAgendamento } from "../hooks/useDadosAgendamento";
import { calcularFrete as calcularFreteApi } from "../services/freteService";
import { obterLocalizacaoAtual } from "../utils/localizacao";

export default function Agendamento() {
  const { servicoId, lojaId } = useParams();
  const navigate = useNavigate();

  const {
    loja,
    servico,
    pets,
    carregarPets,
    loading,
    erro,
    setErro,
    endereco,
    possuiEnderecoPerfil,
    carregandoPerfil,
    coordenadasEntrega,
    setCoordenadasEntrega,
  } = useDadosAgendamento(lojaId, servicoId);

  const [petSelecionado, setPetSelecionado] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [transporte, setTransporte] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [processandoAgendamento, setProcessandoAgendamento] =
    useState(false);

  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  const [showModalPet, setShowModalPet] = useState(false);
  const [petParaEditar, setPetParaEditar] = useState(null);

  // ==========================================================
  // FRETE / LOCALIZAÇÃO
  // ==========================================================

  const [frete, setFrete] = useState(0);
  const [, setDistanciaEntrega] = useState(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [usandoLocalizacao, setUsandoLocalizacao] = useState(false);
  const [mensagemLocalizacao, setMensagemLocalizacao] = useState("");

  // ==========================================================
  // DATA MÍNIMA
  // ==========================================================

  const hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());

  const dataMinima = hoje.toISOString().split("T")[0];

  // ==========================================================
  // VALIDAÇÃO
  // ==========================================================

  const formularioValido =
    petSelecionado &&
    data &&
    hora &&
    transporte;

  // ==========================================================
  // LOCALIZAÇÃO ATUAL
  // ==========================================================

  async function usarLocalizacaoAtual() {
    setUsandoLocalizacao(true);
    setMensagemLocalizacao("");
    setErro(null);

    try {
      const coordenadas = await obterLocalizacaoAtual();

      setCoordenadasEntrega(coordenadas);

      setMensagemLocalizacao(
        "Localização atual definida para o cálculo da busca e entrega."
      );
    } catch (error) {
      console.error("Erro ao obter localização:", error);

      setErro(
        "Não foi possível obter sua localização. Permita o acesso à localização no navegador."
      );
    } finally {
      setUsandoLocalizacao(false);
    }
  }

  // ==========================================================
  // CARREGAR HORÁRIOS
  // ==========================================================

  const carregarHorarios = async (dataSelecionada) => {
    if (!dataSelecionada) {
      setHorariosDisponiveis([]);
      return;
    }

    try {
      setCarregandoHorarios(true);
      setHorariosDisponiveis([]);
      setHora("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/agenda-lojista/horarios?servico_id=${servicoId}&data=${dataSelecionada}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.mensagem ||
            "Não foi possível carregar os horários."
        );
      }

      setHorariosDisponiveis(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
      setHorariosDisponiveis([]);
    } finally {
      setCarregandoHorarios(false);
    }
  };

  function alterarData(novaData) {
    setData(novaData);
    setHora("");
    carregarHorarios(novaData);
  }

  // ==========================================================
  // CALCULAR FRETE REAL
  // ==========================================================

  const calcularFrete = useCallback(async () => {
    if (transporte !== "com") {
      setFrete(0);
      setDistanciaEntrega(null);
      setCalculandoFrete(false);
      return;
    }

    if (
      !lojaId ||
      !coordenadasEntrega?.latitude ||
      !coordenadasEntrega?.longitude
    ) {
      setFrete(0);
      setDistanciaEntrega(null);
      return;
    }

    try {
      setCalculandoFrete(true);
      setErro(null);

      const resultado = await calcularFreteApi({
        lojaId: Number(lojaId),
        latitude: coordenadasEntrega.latitude,
        longitude: coordenadasEntrega.longitude,
      });

      setFrete(resultado.frete);
      setDistanciaEntrega(resultado.distanciaKm);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);

      setFrete(0);
      setDistanciaEntrega(null);

      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível calcular o valor da busca e entrega."
      );
    } finally {
      setCalculandoFrete(false);
    }
  }, [
    transporte,
    lojaId,
    coordenadasEntrega?.latitude,
    coordenadasEntrega?.longitude,
    setErro,
  ]);

  useEffect(() => {
    calcularFrete();
  }, [calcularFrete]);

  // ==========================================================
  // PREÇOS
  // ==========================================================

  const precoServico = Number(servico?.preco || 0);

  const total =
    precoServico +
    (transporte === "com" ? Number(frete || 0) : 0);

  // ==========================================================
  // AGENDAR
  // ==========================================================

  const handleAgendar = async () => {
    if (!petSelecionado) {
      alert("Selecione o pet.");
      return;
    }

    if (!data || !hora) {
      alert("Selecione uma data e um horário.");
      return;
    }

    if (!transporte) {
      alert("Selecione como será realizado o transporte do pet.");
      return;
    }

    if (transporte === "com") {
      if (!coordenadasEntrega) {
        alert(
          "Defina sua localização para calcular o valor da busca e entrega."
        );
        return;
      }

      if (calculandoFrete) {
        alert("Aguarde o cálculo da busca e entrega.");
        return;
      }
    }

    if (processandoAgendamento) {
      return;
    }

    const pet = pets.find(
      (item) => item.id == petSelecionado
    );

    try {
      setProcessandoAgendamento(true);
      setErro(null);

      // ======================================================
      // 1. CRIAR AGENDAMENTO
      // ======================================================

      const response = await fetch(
        `${API_URL}/agendamentos`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },

          body: JSON.stringify({
            servico_id: Number(servicoId),

            data_inicio: `${data}T${hora}:00`,

            pet_nome: pet ? pet.nome : null,

            observacoes,
          }),
        }
      );

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(
          resultado.message ||
            resultado.mensagem ||
            "Erro ao realizar agendamento."
        );
      }

      const agendamentoId = resultado.id;

      // ======================================================
      // 2. INICIAR PAGAMENTO
      // ======================================================

      const pagamentoResponse = await fetch(
        `${API_URL}/pagamentos/agendamento/${agendamentoId}`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const pagamento = await pagamentoResponse.json();

      if (!pagamentoResponse.ok) {
        throw new Error(
          pagamento.message ||
            pagamento.mensagem ||
            "O agendamento foi criado, mas não foi possível preparar o pagamento."
        );
      }

      // ======================================================
      // 3. VALIDAR CHECKOUT
      // ======================================================

      if (!pagamento.checkout_url) {
        throw new Error(
          "O pagamento foi criado, mas o endereço do Mercado Pago não foi recebido."
        );
      }

      // ======================================================
      // 4. REDIRECIONAR
      // ======================================================

      window.location.href = pagamento.checkout_url;
    } catch (error) {
      console.error(
        "Erro no fluxo de agendamento/pagamento:",
        error
      );

      setErro(
        error.message || "Erro ao realizar o agendamento."
      );

      setProcessandoAgendamento(false);
    }
  };

  // ==========================================================
  // ESTADOS DE CARREGAMENTO / ERRO
  // ==========================================================

  if (loading) {
    return <AgendamentoCarregando />;
  }

  if (erro && (!loja || !servico)) {
    return <AgendamentoErro erro={erro} onVoltar={() => navigate(-1)} />;
  }

  const aguardandoEntrega =
    transporte === "com" && (!coordenadasEntrega || calculandoFrete);

  return (
    <div className="bg-[#EBE9E9] min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-5 md:py-8">

        {/* VOLTAR */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="
            mb-4
            inline-flex
            items-center
            gap-2
            text-sm
            font-semibold
            text-gray-600
            hover:text-[#0E5617]
            transition
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <AgendamentoCabecalho loja={loja} servico={servico} />

        <SeletorPet
          pets={pets}
          petSelecionado={petSelecionado}
          setPetSelecionado={setPetSelecionado}
          onCadastrarPet={() => {
            setPetParaEditar(null);
            setShowModalPet(true);
          }}
        />

        <SeletorDataHorario
          data={data}
          hora={hora}
          setHora={setHora}
          dataMinima={dataMinima}
          horariosDisponiveis={horariosDisponiveis}
          carregandoHorarios={carregandoHorarios}
          onAlterarData={alterarData}
        />

        <SeletorTransporte
          transporte={transporte}
          onSelecionarTransporte={(opcao) => {
            setTransporte(opcao);
            setErro(null);
          }}
          carregandoPerfil={carregandoPerfil}
          possuiEnderecoPerfil={possuiEnderecoPerfil}
          endereco={endereco}
          coordenadasEntrega={coordenadasEntrega}
          usandoLocalizacao={usandoLocalizacao}
          usarLocalizacaoAtual={usarLocalizacaoAtual}
          mensagemLocalizacao={mensagemLocalizacao}
          calculandoFrete={calculandoFrete}
        />

        <CampoObservacoes
          observacoes={observacoes}
          setObservacoes={setObservacoes}
        />

        <ResumoAgendamento
          pets={pets}
          petSelecionado={petSelecionado}
          servico={servico}
          loja={loja}
          data={data}
          hora={hora}
          transporte={transporte}
          observacoes={observacoes}
          precoServico={precoServico}
          frete={frete}
          calculandoFrete={calculandoFrete}
          total={total}
          erro={erro}
        />

        <ConfirmarAgendamento
          processandoAgendamento={processandoAgendamento}
          habilitado={
            formularioValido &&
            !processandoAgendamento &&
            !aguardandoEntrega
          }
          onConfirmar={handleAgendar}
        />
      </main>

      {/* =======================================================
          MODAL DE PET
      ======================================================= */}

      {showModalPet && (
        <PetModal
          token={localStorage.getItem("token")}
          petExistente={petParaEditar}
          onClose={() => {
            setShowModalPet(false);
            setPetParaEditar(null);
          }}
          onPetSalvo={async (novoPet) => {
            await carregarPets();

            setPetSelecionado(novoPet.id);

            setShowModalPet(false);
            setPetParaEditar(null);
          }}
        />
      )}
    </div>
  );
}
