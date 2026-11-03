import { useState } from "react";

import api from "../services/api";
import {
  ENDERECO_VAZIO,
  extrairEndereco,
  normalizarEndereco,
  validarEnderecoNormalizado,
} from "../utils/endereco";
import { obterLocalizacaoAtual } from "../utils/localizacao";

/**
 * Edição do endereço do perfil: busca por CEP, validação, gravação e,
 * se o geocoding falhar, oferta de usar a localização atual do dispositivo.
 */
export function useEnderecoPerfil({ usuario, token, atualizarUsuario }) {
  const [usandoLocalizacao, setUsandoLocalizacao] = useState(false);

  const [editandoEndereco, setEditandoEndereco] = useState(false);

  const [enderecoForm, setEnderecoForm] = useState(ENDERECO_VAZIO);

  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [mensagemEndereco, setMensagemEndereco] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  function iniciarEdicaoEndereco() {
    setMensagemEndereco(null);
    setEnderecoForm(extrairEndereco(usuario));
    setEditandoEndereco(true);
  }

  function cancelarEdicaoEndereco() {
    setEditandoEndereco(false);
    setEnderecoForm(ENDERECO_VAZIO);
    setMensagemEndereco(null);
  }

  async function buscarCep() {
    const cep = enderecoForm.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      setMensagemEndereco({
        tipo: "erro",
        texto: "Digite um CEP válido com 8 números."
      });
      return;
    }

    setBuscandoCep(true);
    setMensagemEndereco(null);

    try {
      const { data } = await api.get(`/cep/${cep}`);

      setEnderecoForm((prev) => ({
        ...prev,
        cep: data.cep || prev.cep,
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        uf: data.uf || ""
      }));

      setMensagemEndereco({
        tipo: "sucesso",
        texto: "CEP encontrado. Confira os dados e informe o número."
      });
    } catch (err) {
      console.error("Erro ao consultar CEP:", err?.response?.status ?? err?.message);

      setMensagemEndereco({
        tipo: "erro",
        texto:
          err.response?.data?.mensagem ||
          "Não foi possível consultar o CEP."
      });
    } finally {
      setBuscandoCep(false);
    }
  }

  async function salvarEndereco() {
    const enderecoNormalizado = normalizarEndereco(enderecoForm);

    if (validarEnderecoNormalizado(enderecoNormalizado)) {
      setMensagemEndereco({
        tipo: "erro",
        texto:
          "Informe CEP, endereço, número, bairro, cidade e UF válidos."
      });
      return;
    }

    setSalvandoEndereco(true);
    setMensagemEndereco(null);

    try {
      const { data } = await api.put(
        "/usuarios/me",
        enderecoNormalizado,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      atualizarUsuario(data.usuario || enderecoNormalizado);

      setMensagemEndereco({
        tipo: "sucesso",
        texto: "Endereço atualizado com sucesso."
      });

      setEditandoEndereco(false);
    } catch (err) {
      console.error("Erro ao atualizar endereço:", err?.response?.status ?? err?.message);

      const mensagemBackend =
        err.response?.data?.mensagem || "";

      const erroGeocoding =
        err.response?.status === 400 &&
        mensagemBackend.toLowerCase().includes("localizar");

      if (!erroGeocoding) {
        setMensagemEndereco({
          tipo: "erro",
          texto:
            mensagemBackend ||
            "Não foi possível atualizar seu endereço."
        });

        setSalvandoEndereco(false);
        return;
      }

      const usarGps = window.confirm(
        "Não conseguimos localizar automaticamente esse endereço.\n\n" +
        "Deseja usar sua localização atual para definir a posição do endereço?"
      );

      if (!usarGps) {
        setMensagemEndereco({
          tipo: "erro",
          texto:
            "O endereço não foi localizado automaticamente. " +
            "Você pode tentar novamente ou usar sua localização atual."
        });

        setSalvandoEndereco(false);
        return;
      }

      setUsandoLocalizacao(true);

      try {
        const coordenadas = await obterLocalizacaoAtual();

        const dadosComLocalizacao = {
          ...enderecoNormalizado,
          latitude: coordenadas.latitude,
          longitude: coordenadas.longitude
        };

        const { data } = await api.put(
          "/usuarios/me",
          dadosComLocalizacao,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        atualizarUsuario(
          data.usuario || dadosComLocalizacao
        );

        setMensagemEndereco({
          tipo: "sucesso",
          texto:
            "Endereço atualizado usando sua localização atual."
        });

        setEditandoEndereco(false);
      } catch (gpsErr) {
        console.error(
          "Erro ao obter localização atual:",
          gpsErr
        );

        let mensagemGps =
          "Não foi possível obter sua localização atual.";

        if (gpsErr?.code === 1) {
          mensagemGps =
            "Permissão de localização negada. " +
            "Permita o acesso à localização e tente novamente.";
        } else if (gpsErr?.code === 2) {
          mensagemGps =
            "Não foi possível determinar sua localização.";
        } else if (gpsErr?.code === 3) {
          mensagemGps =
            "A localização demorou demais para responder. Tente novamente.";
        }

        setMensagemEndereco({
          tipo: "erro",
          texto: mensagemGps
        });
      } finally {
        setUsandoLocalizacao(false);
      }
    } finally {
      setSalvandoEndereco(false);
    }
  }

  return {
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
  };
}
