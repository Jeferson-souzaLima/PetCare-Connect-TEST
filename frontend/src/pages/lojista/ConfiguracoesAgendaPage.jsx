import { API_URL } from "@/services/apiUrl";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Dias da semana com o horário padrão. Cria uma lista nova a cada chamada,
// para que nenhuma tela altere a lista usada por outra.
function criarDiasPadrao() {
  return [
    { dia_semana: 0, nome: "Domingo", ativo: false, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: null, intervalo_fim: null },
    { dia_semana: 1, nome: "Segunda", ativo: false, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: null, intervalo_fim: null },
    { dia_semana: 2, nome: "Terça", ativo: false, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: null, intervalo_fim: null },
    { dia_semana: 3, nome: "Quarta", ativo: false, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: null, intervalo_fim: null },
    { dia_semana: 4, nome: "Quinta", ativo: false, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: null, intervalo_fim: null },
    { dia_semana: 5, nome: "Sexta", ativo: false, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: null, intervalo_fim: null },
    { dia_semana: 6, nome: "Sábado", ativo: false, hora_inicio: "08:00", hora_fim: "18:00", intervalo_inicio: null, intervalo_fim: null }
  ];
}

export default function ConfiguracoesAgendaPage() {
  const navigate = useNavigate();

  const [config, setConfig] = useState({
    disponibilidade: criarDiasPadrao(),
    capacidade_por_horario: 1
  });

  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const token = localStorage.getItem("token");

        const configResponse = await fetch(
          `${API_URL}/agenda-lojista/config`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (configResponse.status === 404) {
          return;
        }

        const configData = await configResponse.json();

        const disponibilidadeResponse = await fetch(
          `${API_URL}/agenda-lojista/disponibilidade`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const disponibilidade = await disponibilidadeResponse.json();

        const disponibilidadeFormatada = criarDiasPadrao().map((dia) => {
          const registro = disponibilidade.find(
            (d) => d.dia_semana === dia.dia_semana
          );

          if (!registro) {
            return dia;
          }

          return {
            ...dia,
            ativo: true,
            hora_inicio: registro.hora_inicio.slice(0, 5),
            hora_fim: registro.hora_fim.slice(0, 5),
            intervalo_inicio: registro.intervalo_inicio
              ? registro.intervalo_inicio.slice(0, 5)
              : null,
            intervalo_fim: registro.intervalo_fim
              ? registro.intervalo_fim.slice(0, 5)
              : null
          };
        });

        setConfig({
          capacidade_por_horario: configData.capacidade_por_horario,
          disponibilidade: disponibilidadeFormatada
        });
      } catch (error) {
        console.error(error);
      }
    };

    carregarConfiguracoes();
  }, []);

  const salvarConfiguracoes = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Usuário não autenticado.");
        return;
      }

      const diasAtivos = config.disponibilidade.filter((dia) => dia.ativo);

      if (diasAtivos.length === 0) {
        alert("Selecione pelo menos um dia de funcionamento.");
        return;
      }

      for (const dia of diasAtivos) {
        if (dia.hora_inicio >= dia.hora_fim) {
          alert(`O horário de ${dia.nome} está inválido.`);
          return;
        }
      }

      const configResponse = await fetch(
        `${API_URL}/agenda-lojista/config`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            capacidade_por_horario: config.capacidade_por_horario,
            dias_limite_agendamento: 30,
            intervalo_minutos: 30,
            trabalha_24h: false
          })
        }
      );

      const configData = await configResponse.json();

      if (!configResponse.ok) {
        console.error("Erro config:", configData);
        alert(configData.message || "Erro ao salvar configuração");
        return;
      }

      const deleteResponse = await fetch(
        `${API_URL}/agenda-lojista/disponibilidade/loja`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!deleteResponse.ok) {
        const err = await deleteResponse.json();
        console.error("Erro ao limpar disponibilidade:", err);
        alert("Erro ao limpar horários antigos");
        return;
      }

      for (const dia of config.disponibilidade.filter((d) => d.ativo)) {
        const response = await fetch(
          `${API_URL}/agenda-lojista/disponibilidade`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              dia_semana: dia.dia_semana,
              hora_inicio: dia.hora_inicio,
              hora_fim: dia.hora_fim,
              intervalo_inicio: dia.intervalo_inicio,
              intervalo_fim: dia.intervalo_fim
            })
          }
        );

        if (!response.ok) {
          const err = await response.json();
          console.error(err);
          alert(`Erro ao salvar ${dia.nome}`);
          return;
        }
      }

      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro geral:", error);
      alert("Erro ao salvar configurações");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <header className="rounded-b-3xl bg-gradient-to-r from-green-200 to-green-300 p-8 shadow-md sm:p-10">
        <button
          type="button"
          onClick={() => navigate("/lojista/agenda")}
          className="mb-5 flex items-center gap-2 text-sm font-semibold text-green-900 hover:underline"
        >
          <FaArrowLeft />
          Voltar para Agenda
        </button>

        <h1 className="text-3xl font-bold text-green-900">
          Configurações da Agenda
        </h1>

        <p className="mt-2 text-green-800">
          Defina os dias, horários e capacidade de atendimento da sua agenda.
        </p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Dias de funcionamento
        </h2>

        <p className="text-sm text-gray-500 mb-5">
          Selecione os dias em que sua loja realiza atendimentos.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.disponibilidade.map((dia) => (
            <div
              key={dia.dia_semana}
              className="border rounded-xl p-4 bg-white"
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={dia.ativo}
                  onChange={() => {
                    setConfig({
                      ...config,
                      disponibilidade: config.disponibilidade.map((item) =>
                        item.dia_semana === dia.dia_semana
                          ? { ...item, ativo: !item.ativo }
                          : item
                      )
                    });
                  }}
                />
                <span className="font-medium">{dia.nome}</span>
              </label>

              {dia.ativo && (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Início
                    </label>
                    <input
                      type="time"
                      value={dia.hora_inicio}
                      onChange={(e) => {
                        setConfig({
                          ...config,
                          disponibilidade: config.disponibilidade.map((item) =>
                            item.dia_semana === dia.dia_semana
                              ? { ...item, hora_inicio: e.target.value }
                              : item
                          )
                        });
                      }}
                      className="border rounded-lg p-2 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Fim
                    </label>
                    <input
                      type="time"
                      value={dia.hora_fim}
                      onChange={(e) => {
                        setConfig({
                          ...config,
                          disponibilidade: config.disponibilidade.map((item) =>
                            item.dia_semana === dia.dia_semana
                              ? { ...item, hora_fim: e.target.value }
                              : item
                          )
                        });
                      }}
                      className="border rounded-lg p-2 w-full"
                    />
                  </div>
                </div>
              )}

              {dia.ativo && (
                <div className="mt-5 border-t pt-4">
                  {!dia.intervalo_inicio ? (
                    <button
                      type="button"
                      onClick={() => {
                        setConfig({
                          ...config,
                          disponibilidade: config.disponibilidade.map((item) =>
                            item.dia_semana === dia.dia_semana
                              ? {
                                  ...item,
                                  intervalo_inicio: "12:00",
                                  intervalo_fim: "13:00"
                                }
                              : item
                          )
                        });
                      }}
                      className="text-sm text-green-700 hover:underline font-medium"
                    >
                      ➕ Adicionar intervalo
                    </button>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Início do intervalo
                          </label>
                          <input
                            type="time"
                            value={dia.intervalo_inicio}
                            onChange={(e) => {
                              setConfig({
                                ...config,
                                disponibilidade: config.disponibilidade.map((item) =>
                                  item.dia_semana === dia.dia_semana
                                    ? { ...item, intervalo_inicio: e.target.value }
                                    : item
                                )
                              });
                            }}
                            className="border rounded-lg p-2 w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Fim do intervalo
                          </label>
                          <input
                            type="time"
                            value={dia.intervalo_fim}
                            onChange={(e) => {
                              setConfig({
                                ...config,
                                disponibilidade: config.disponibilidade.map((item) =>
                                  item.dia_semana === dia.dia_semana
                                    ? { ...item, intervalo_fim: e.target.value }
                                    : item
                                )
                              });
                            }}
                            className="border rounded-lg p-2 w-full"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="mt-3 text-sm text-red-600 hover:underline"
                        onClick={() => {
                          setConfig({
                            ...config,
                            disponibilidade: config.disponibilidade.map((item) =>
                              item.dia_semana === dia.dia_semana
                                ? { ...item, intervalo_inicio: null, intervalo_fim: null }
                                : item
                            )
                          });
                        }}
                      >
                        Remover intervalo
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Atendimentos simultâneos
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Informe quantos clientes podem ser atendidos no mesmo horário.
        </p>
        <input
          type="number"
          min="1"
          value={config.capacidade_por_horario}
          onChange={(e) =>
            setConfig({
              ...config,
              capacidade_por_horario: Number(e.target.value)
            })
          }
          className="border rounded-xl p-3 w-full"
        />
        <p className="text-xs text-gray-400 mt-3">
          1 = atendimento exclusivo • 2 ou mais = atendimentos simultâneos.
        </p>
      </div>

      <button
        onClick={salvarConfiguracoes}
        className="w-full bg-[#0E5617] text-white py-3 rounded-xl hover:bg-green-800 transition font-semibold"
      >
        Salvar alterações
      </button>
    </div>
  );
}