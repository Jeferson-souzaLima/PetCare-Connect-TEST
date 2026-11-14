import { useCallback, useEffect, useState } from "react";
import { buscarLojas } from "@/services/lojaService";
import { buscarProdutos } from "@/services/produtoService";
import { buscarServicos } from "@/services/servicoService";
import { buscarConteudoPorLocalizacao } from "@/services/geolocalizacaoService";
import { useLocalizacao } from "@/hooks/useLocalizacao";

const POR_FAIXA = 12;
const TIPOS = ["lojas", "produtos", "servicos"];
const LISTA_GERAL = { lojas: buscarLojas, produtos: buscarProdutos, servicos: buscarServicos };
const FAIXA_CARREGANDO = { itens: [], estado: "carregando", perto: false };

async function listaGeral(tipo) {
  const resultado = await LISTA_GERAL[tipo](1, POR_FAIXA);
  return { itens: resultado?.dados ?? [], perto: false };
}

/**
 * Conteúdo das faixas da home (lojas, produtos e serviços). Com localização escolhida,
 * uma consulta traz os três tipos perto dela; o tipo sem nada perto (ou se a consulta falhar)
 * cai na lista geral. Cada faixa tem o seu estado: "carregando" | "ok" | "vazio" | "erro".
 */
export function useConteudoHome() {
  const { localizacao } = useLocalizacao();
  const latitude = localizacao?.latitude ?? null;
  const longitude = localizacao?.longitude ?? null;
  const [faixas, setFaixas] = useState({ lojas: FAIXA_CARREGANDO, produtos: FAIXA_CARREGANDO, servicos: FAIXA_CARREGANDO });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let vivo = true;
    setFaixas({ lojas: FAIXA_CARREGANDO, produtos: FAIXA_CARREGANDO, servicos: FAIXA_CARREGANDO });

    async function carregar() {
      let perto = null;
      if (latitude != null && longitude != null) {
        try {
          perto = await buscarConteudoPorLocalizacao(latitude, longitude, 1, POR_FAIXA);
        } catch (erro) {
          console.error("Erro ao buscar conteúdo perto da localização:", erro?.response?.status ?? erro?.message);
        }
      }
      const resultados = await Promise.allSettled(
        TIPOS.map((tipo) => {
          const proximos = perto?.[tipo]?.dados;
          return proximos?.length ? Promise.resolve({ itens: proximos, perto: true }) : listaGeral(tipo);
        })
      );
      if (!vivo) return;
      setFaixas(
        Object.fromEntries(
          TIPOS.map((tipo, i) => {
            const r = resultados[i];
            if (r.status === "rejected") return [tipo, { itens: [], estado: "erro", perto: false }];
            return [tipo, { ...r.value, estado: r.value.itens.length ? "ok" : "vazio" }];
          })
        )
      );
    }

    carregar();
    return () => {
      vivo = false;
    };
  }, [latitude, longitude, tentativa]);

  const tentarDeNovo = useCallback(() => setTentativa((n) => n + 1), []);

  return { ...faixas, tentarDeNovo };
}
