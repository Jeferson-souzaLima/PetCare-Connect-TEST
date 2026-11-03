import { API_URL } from "@/services/apiUrl";
import { useCallback, useEffect, useState } from "react";

import {
  ENDERECO_VAZIO,
  enderecoEstaCompleto,
  extrairEndereco,
} from "../utils/endereco";

/**
 * Carrega o que a tela de agendamento precisa: loja, serviço, pets do cliente
 * e o endereço/coordenadas salvos no perfil (para o cálculo da busca e entrega).
 */
export function useDadosAgendamento(lojaId, servicoId) {
  const [loja, setLoja] = useState(null);
  const [servico, setServico] = useState(null);
  const [pets, setPets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [coordenadasEntrega, setCoordenadasEntrega] = useState(null);
  const [endereco, setEndereco] = useState(ENDERECO_VAZIO);
  const [possuiEnderecoPerfil, setPossuiEnderecoPerfil] = useState(false);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  const carregarPets = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/pets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json();

      setPets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar pets:", error);
      setPets([]);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      try {
        setLoading(true);
        setErro(null);

        const token = localStorage.getItem("token");

        const [lojaResponse, servicoResponse] = await Promise.all([
          fetch(`${API_URL}/lojas/${lojaId}`),
          fetch(`${API_URL}/servicos/${servicoId}`),
        ]);

        if (!lojaResponse.ok) {
          throw new Error("Não foi possível carregar a loja.");
        }

        if (!servicoResponse.ok) {
          throw new Error("Não foi possível carregar o serviço.");
        }

        const lojaData = await lojaResponse.json();
        const servicoData = await servicoResponse.json();

        if (!ativo) return;

        setLoja(lojaData);
        setServico(servicoData);

        // Tenta aproveitar as coordenadas já salvas no perfil.
        if (token) {
          try {
            const perfilResponse = await fetch(
              `${API_URL}/usuarios/me`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (perfilResponse.ok) {
              const perfilData = await perfilResponse.json();
              const perfil = perfilData.usuario || perfilData;

              const enderecoPerfil = extrairEndereco(perfil);

              setEndereco(enderecoPerfil);
              setPossuiEnderecoPerfil(enderecoEstaCompleto(enderecoPerfil));

              if (
                perfil.latitude != null &&
                perfil.longitude != null
              ) {
                setCoordenadasEntrega({
                  latitude: Number(perfil.latitude),
                  longitude: Number(perfil.longitude),
                });
              }
            }
          } catch (error) {
            console.warn(
              "Não foi possível carregar os dados do perfil:",
              error
            );
          } finally {
            setCarregandoPerfil(false);
          }
        }

        await carregarPets();
      } catch (error) {
        if (ativo) {
          setErro(
            error.message || "Erro ao carregar os dados do agendamento."
          );
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [lojaId, servicoId, carregarPets]);

  return {
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
  };
}
