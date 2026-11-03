import { API_URL } from "@/services/apiUrl";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MeusAgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const location = useLocation();
  const novoAgendamento = location.state?.novoAgendamento;

  useEffect(() => {
    fetch(`${API_URL}/agendamentos/meus`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(setAgendamentos)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <p className="text-gray-500">Carregando agendamentos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* CABEÇALHO */}
      <header className="bg-gradient-to-r from-green-200 to-green-300 shadow-md rounded-b-3xl p-6">

        <button
          onClick={() => navigate("/perfil")}
          className="flex items-center gap-2 text-green-900 hover:text-green-700 font-medium transition mb-4"
        >
          ← Voltar ao perfil
        </button>

        <h1 className="text-2xl font-bold text-green-900">
          📅 Meus Agendamentos
        </h1>

        <p className="text-green-800 text-sm mt-1">
          Acompanhe todos os seus serviços agendados em um só lugar.
        </p>

      </header>

      {/* CONTEÚDO */}
      <div className="px-4">

        {agendamentos.length === 0 ? (

          <div className="bg-white rounded-2xl shadow-md border p-10 text-center">

            <div className="text-6xl mb-4">
              🐶
            </div>

            <h2 className="text-xl font-semibold text-gray-800">
              Nenhum agendamento encontrado
            </h2>

            <p className="text-gray-500 mt-2">
              Quando você agendar um serviço,
              ele aparecerá aqui para acompanhamento.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {agendamentos.map((agendamento) => {

              return (
                <div
                  key={agendamento.id}
                  className="bg-white rounded-2xl shadow-md border hover:shadow-lg transition overflow-hidden"
                >
              
                {/* Barra lateral de status */}
                <div
                    className={`h-2 ${
                    agendamento.status === "aguardando_pagamento"
                        ? "bg-yellow-400"
                        : agendamento.status === "confirmado"
                        ? "bg-blue-500"
                        : agendamento.status === "concluido"
                        ? "bg-green-600"
                        : "bg-red-500"
                    }`}
                />

                <div className="p-5">

                    {/* Loja */}
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-bold text-green-900">
                        {agendamento.loja_nome}
                      </h2>

                      {agendamento.id === novoAgendamento && (
                        <span className="px-2 py-1 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold uppercase tracking-wide">
                          NOVO
                        </span>
                      )}
                    </div>

                    {/* Serviço */}
                    <p className="text-gray-800 font-medium mt-1">
                    {agendamento.servico_nome}
                    </p>

                    {/* Pet */}
                    <p className="text-gray-500 mt-1">
                    🐶 {agendamento.pet_nome}
                    </p>

                    {/* Data e Hora */}
                    <div className="flex justify-between mt-4 text-sm text-gray-600">

                    <span>
                        📅{" "}
                        {new Date(agendamento.data_inicio).toLocaleDateString("pt-BR")}
                    </span>

                    <span>
                        🕒{" "}
                        {new Date(agendamento.data_inicio).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        })}
                    </span>

                    </div>

                    {/* Rodapé */}
                    <div className="flex justify-between items-center mt-5">

                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        agendamento.status === "aguardando_pagamento"
                            ? "bg-yellow-100 text-yellow-800"
                            : agendamento.status === "confirmado"
                            ? "bg-blue-100 text-blue-800"
                            : agendamento.status === "concluido"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-700"
                        }`}
                    >
                        {agendamento.status.replace("_", " ")}
                    </span>

                    <button
                        className="text-green-700 font-semibold hover:underline"
                    >
                        Ver detalhes →
                    </button>

                    </div>

                    </div>

                </div>
                );
              })}

          </div>

        )}

      </div>

    </div>
  );
}