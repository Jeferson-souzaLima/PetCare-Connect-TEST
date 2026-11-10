import { API_URL } from "@/services/apiUrl";
import { useState, useMemo, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FaArrowLeft, FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function AgendaLojistaPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [modoCriacao, setModoCriacao] = useState(false);
  const [servicos, setServicos] = useState([]);  
  const [confirmarDelete, setConfirmarDelete] = useState(null);
  const [datasComAgendamentos, setDatasComAgendamentos] = useState([]);
  const navigate = useNavigate();

  const buscarDatasComAgendamentos = async () => {
    try {
      const hoje = new Date();

      const dataInicial = hoje.toISOString().split("T")[0];

      const dataFinal = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + 1,
        0
      )
        .toISOString()
        .split("T")[0];

      const response = await fetch(
        `${API_URL}/agendamentos/lojista/datas-confirmadas?data_inicial=${dataInicial}&data_final=${dataFinal}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const dados = await response.json();

      if (!response.ok) {
        console.error(dados.message);
        return;
      }

      setDatasComAgendamentos(
        dados.map((item) => item.data)
      );

    } catch (error) {
      console.error(
        "Erro ao buscar datas com agendamentos confirmados:",
        error
      );
    }
  };

  const [formData, setFormData] = useState({
    servico_id: "",
    data_inicio: "",
    cliente_nome_externo: "",
    pet_nome: "",
    cliente_telefone_externo: "",
    observacoes: "",
  });

  const dataSelecionadaFormatada = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 🔹 Filtra agendamentos pela data selecionada
  const agendamentosDoDia = useMemo(() => {
    return agendamentos.filter(
      (ag) =>
        new Date(ag.data_inicio).toDateString() ===
        selectedDate.toDateString()
    );
  }, [agendamentos, selectedDate]);


  

  // 🔹 Funções exemplo (ajuste para seu backend)
  const alterarStatus = async (id, novoStatus) => {

    try {

      const response = await fetch(
        `${API_URL}/agendamentos/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            status: novoStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);

      buscarAgendamentosDoDia(selectedDate);

      setAgendamentoSelecionado(null);

    } catch (error) {

      console.error(error);

      alert("Erro ao atualizar status.");

    }

  };

  const deletarAgendamento = async (id) => {

    try {

      const response = await fetch(
        `${API_URL}/agendamentos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Agendamento deletado.");

      buscarAgendamentosDoDia(selectedDate);
      setAgendamentoSelecionado(null);

    } catch (error) {
      console.error(error);
      alert("Erro ao deletar agendamento.");
    }
  };

  const buscarAgendamentosDoDia = async (date) => {
    try {
      const dataFormatada = date.toISOString().split("T")[0];

      const response = await fetch(
        `${API_URL}/agendamentos/lojista?data=${dataFormatada}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const dados = await response.json();

      if (!response.ok) {
        console.log(dados.message);
        return;
      }

      setAgendamentos(dados);

    } catch (error) {
      console.error("Erro ao buscar agendamentos", error);
    }
  };


  useEffect(() => {
    buscarAgendamentosDoDia(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const buscarServicos = async () => {
      try {
        const response = await fetch(`${API_URL}/servicos/meus`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        const data = await response.json();
        if (!response.ok) return console.log(data.message);

        setServicos(data);

      } catch (error) {
        console.error("Erro ao buscar serviços", error);
      }
    };

    buscarServicos();
  }, []);

  const criarAgendamento = async () => {
  try {

    const dataCompleta = `${formData.data}T${formData.hora}:00`;

    const payload = {
      servico_id: formData.servico_id,
      data_inicio: dataCompleta,
      cliente_nome_externo: formData.cliente_nome_externo,
      cliente_telefone_externo: formData.cliente_telefone_externo,
      pet_nome: formData.pet_nome,
      observacoes: formData.observacoes
    };

    const response = await fetch(
      `${API_URL}/agendamentos/manual`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert("Agendamento criado com sucesso!");

    setModoCriacao(false);
    setAgendamentoSelecionado(null);

    buscarAgendamentosDoDia(selectedDate);

  } catch (error) {
    console.error(error);
    alert("Erro ao criar agendamento.");
  }
};

  const statusFormatado = {
    aguardando_pagamento: {
      texto: "🟡 Aguardando pagamento",
      classe: "text-yellow-600"
    },

    confirmado: {
      texto: "🔵 Confirmado",
      classe: "text-blue-600"
    },

    concluido: {
      texto: "🟢 Concluído",
      classe: "text-green-600"
    },

    cancelado_cliente: {
      texto: "🔴 Cancelado pelo cliente",
      classe: "text-red-600"
    },

    cancelado_lojista: {
      texto: "🔴 Cancelado pela loja",
      classe: "text-red-600"
    }
  };

  useEffect(() => {
    buscarDatasComAgendamentos();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* HEADER */}
      <header className="rounded-b-3xl bg-gradient-to-r from-green-200 to-green-300 p-8 shadow-md sm:p-10">
        <button
          type="button"
          onClick={() => navigate("/perfil-lojista")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-green-900 hover:underline"
        >
          <FaArrowLeft />
          Voltar ao painel
        </button>

        <div>
          <h1 className="text-3xl font-bold text-green-900">
            Minha Agenda
          </h1>

          <p className="mt-2 text-green-800">
            Organize seus atendimentos e acompanhe os agendamentos da sua loja.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/lojista/agenda/configuracoes")}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-green-900 shadow-sm transition hover:bg-green-50"
        >
          <span>⚙️</span>
          Configurações da agenda
        </button>
      </header>

      {/* BOTÃO NOVO AGENDAMENTO */}
      <div className="px-4">
        <button
          onClick={() => {
            setFormData({
              servico_id: "",
              data_inicio: "",
              cliente_nome_externo: "",
              cliente_telefone_externo: "",
              observacoes: ""
            });
            setModoCriacao(true);
            setAgendamentoSelecionado({});
          }}
          className="flex items-center gap-2 bg-[#0E5617] text-white px-4 py-2 rounded-xl hover:bg-green-800 transition"
        >
          + Novo Agendamento
        </button>
      </div> 

      {/* CALENDÁRIO */}
      <div className="bg-white p-2 rounded-2xl shadow-lg">

        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          minDetail="month"
          next2Label={null}
          prev2Label={null}
          formatMonthYear={(locale, date) =>
            date
              .toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric"
              })
              .replace(/^\w/, (c) => c.toUpperCase())
          }
          className="shadow-xl rounded-2xl"
          tileContent={({ date, view }) => {
            if (view !== "month") return null;

            const dataCalendario = date.toISOString().split("T")[0];

            const possuiAgendamentoConfirmado =
              datasComAgendamentos.includes(dataCalendario);

            return possuiAgendamentoConfirmado ? (
              <div className="flex justify-center mt-1">
                <span className="w-2 h-2 rounded-full bg-green-600" />
              </div>
            ) : null;
          }}
        />
      </div>      

      {/* LISTA DO DIA */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          ({agendamentosDoDia.length}) Agendamentos do Dia 
          <p className="text-sm text-gray-500 mb-4">
            {dataSelecionadaFormatada}
          </p>
        </h2>

        {agendamentosDoDia.length === 0 ? (
          <p className="text-gray-500">
            Nenhum agendamento nesta data.
          </p>
        ) : (
          <div className="space-y-4">
            {agendamentosDoDia.map((ag) => (
              <div
                key={ag.id}
                onClick={() => setAgendamentoSelecionado(ag)}
                className="p-4 border rounded-xl hover:shadow-md transition cursor-pointer"
              >
                <p className="font-semibold text-green-700">
                  {ag.servico_nome}
                </p>

                <p className="text-sm text-gray-600">
                  🐶 {ag.pet_nome} • {ag.cliente_nome}
                </p>

                {ag.observacoes && (
                  <p className="text-xs text-orange-600 mt-1">
                    Obs: {ag.observacoes}
                  </p>
                )}

                <p className="text-sm text-gray-500">
                  {new Date(ag.data_inicio).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>  

      {/* MODAL */}
      {agendamentoSelecionado && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">

            {modoCriacao ? (
              <>
                <h2 className="text-xl font-bold mb-4 text-green-700">
                  Novo Agendamento
                </h2>

                <input
                  type="text"
                  name="cliente_nome_externo"
                  placeholder="Nome do cliente"
                  value={formData.cliente_nome_externo}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mb-3"
                />

                <input
                  type="text"
                  name="cliente_telefone_externo"
                  placeholder="Telefone"
                  value={formData.cliente_telefone_externo}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mb-3"
                />

                <input
                  type="text"
                  name="pet_nome"
                  placeholder="Nome do pet"
                  value={formData.pet_nome}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mb-3"
                />

                <input
                  type="date"
                  name="data"
                  value={formData.data || ""}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mb-3"
                />

                <input
                  type="time"
                  name="hora"
                  value={formData.hora || ""}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mb-3"
                />

                <select
                  name="servico_id"
                  value={formData.servico_id}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mb-3"
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.map((servico) => (
                    <option key={servico.id} value={servico.id}>
                      {servico.nome} - R$ {servico.preco}
                    </option>
                  ))}
                </select>

                <textarea
                  name="observacoes"
                  placeholder="Observações"
                  value={formData.observacoes}
                  onChange={handleChange}
                  className="w-full border p-2 rounded mb-3"
                />

                <button
                  onClick={criarAgendamento}
                  className="w-full bg-green-600 text-white py-2 rounded-xl"
                >
                  Salvar
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-green-700">
                  {agendamentoSelecionado.servico_nome}
                </h2>

                <p>
                  <strong>Cliente:</strong>{" "}
                  {agendamentoSelecionado.cliente_nome}
                </p>

                <p>
                  <strong>Pet:</strong>{" "}
                  {agendamentoSelecionado.pet_nome}
                </p>

                <p>
                  <strong>Data:</strong>{" "}
                  {new Date(
                    agendamentoSelecionado.data_inicio
                  ).toLocaleString()}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      statusFormatado[agendamentoSelecionado.status]?.classe
                    }
                  >
                    {statusFormatado[agendamentoSelecionado.status]?.texto}
                  </span>
                </p>

                <p>
                  <strong>Telefone:</strong> {agendamentoSelecionado.cliente_telefone_externo}
                </p>

                {agendamentoSelecionado.observacoes && (
                  <p>
                    <strong>Observações:</strong> {agendamentoSelecionado.observacoes}
                  </p>
                )}

                <div className="mt-5">

                  {agendamentoSelecionado.status === "confirmado" && (

                    <button
                      onClick={() =>
                        alterarStatus(
                          agendamentoSelecionado.id,
                          "concluido"
                        )
                      }
                      className="w-full bg-green-600 text-white py-2 rounded-xl hover:bg-green-700"
                    >
                      ✔ Concluir Atendimento
                    </button>

                  )}

                  {agendamentoSelecionado.status === "concluido" && (

                    <div className="bg-green-100 text-green-700 py-3 rounded-xl text-center font-semibold">
                      ✅ Atendimento concluído
                    </div>

                  )}

                  {agendamentoSelecionado.status === "cancelado_cliente" && (

                    <div className="bg-red-100 text-red-700 py-3 rounded-xl text-center font-semibold">
                      ❌ Cancelado pelo cliente
                    </div>

                  )}

                  {agendamentoSelecionado.status === "cancelado_lojista" && (

                    <div className="bg-red-100 text-red-700 py-3 rounded-xl text-center font-semibold">
                      ❌ Cancelado pela loja
                    </div>

                  )}

                </div>

                {/*<button
                  onClick={() =>
                    setConfirmarDelete(agendamentoSelecionado)
                  }
                  className="w-full mt-4 bg-gray-200 py-2 rounded-xl"
                >
                  <FaTrash className="inline mr-2" />
                  Deletar
                </button>*/}
              </>
            )}

            <button
              onClick={() => {
                setModoCriacao(false);
                setAgendamentoSelecionado(null);
              }}
              className="w-full mt-4 text-gray-500"
            >
              Fechar
            </button>

          </div>
        </div>
      )}

      {confirmarDelete && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">

            <h2 className="text-lg font-bold text-red-600 mb-4">
              Confirmar exclusão
            </h2>

            <p className="text-gray-700 mb-6">
              Deseja realmente excluir o agendamento de{" "}
              <strong>{confirmarDelete.pet_nome}</strong> com{" "}
              <strong>{confirmarDelete.cliente_nome}</strong>?
            </p>

            <div className="flex gap-3">

              <button
                onClick={() => setConfirmarDelete(null)}
                className="flex-1 bg-gray-200 py-2 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  deletarAgendamento(confirmarDelete.id);
                  setConfirmarDelete(null);
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700"
              >
                Excluir
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}