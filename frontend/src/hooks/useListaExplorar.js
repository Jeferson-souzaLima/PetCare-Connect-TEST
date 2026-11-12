import { useCallback, useEffect, useRef, useState } from "react";
import { buscarLojas } from "@/services/lojaService";
import { buscarProdutos } from "@/services/produtoService";
import { buscarServicos } from "@/services/servicoService";
import { buscarResultados } from "@/services/buscaService";
import { buscarConteudoPorLocalizacao } from "@/services/geolocalizacaoService";
import { fonteDaLista, juntarPagina } from "@/utils/explorar";

const POR_PAGINA = 20;
const LISTA_GERAL = { lojas: buscarLojas, produtos: buscarProdutos, servicos: buscarServicos };

/** Uma página da lista do tipo pedido, conforme a fonte (busca, proximidade ou geral). */
async function carregarPagina({ tipo, fonte, termo, localizacao, pagina }) {
  if (fonte === "busca") {
    const dados = await buscarResultados(termo.trim());
    return { itens: dados?.[tipo] ?? [], temMais: false, fonte };
  }
  if (fonte === "proximidade") {
    const dados = await buscarConteudoPorLocalizacao(localizacao.latitude, localizacao.longitude, pagina, POR_PAGINA);
    const resultado = dados?.[tipo];
    // Nada perto na primeira página: mostra a lista geral em vez de uma tela vazia.
    if (pagina > 1 || resultado?.dados?.length) {
      return { itens: resultado?.dados ?? [], temMais: Boolean(resultado?.temMais), fonte };
    }
    return carregarPagina({ tipo, fonte: "geral", termo, localizacao, pagina });
  }
  const resultado = await LISTA_GERAL[tipo](pagina, POR_PAGINA);
  return { itens: resultado?.dados ?? [], temMais: Boolean(resultado?.temMais), fonte };
}

/**
 * Lista de lojas, produtos ou serviços com busca, proximidade e "carregar mais".
 * estado: "carregando" | "ok" | "vazio" | "erro".
 */
export function useListaExplorar(tipo, { termo, localizacao }) {
  const fonteInicial = fonteDaLista({ termo, localizacao });
  const [lista, setLista] = useState({ itens: [], pagina: 1, temMais: false, fonte: fonteInicial, estado: "carregando" });
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const pedidoRef = useRef(0);

  const latitude = localizacao?.latitude ?? null;
  const longitude = localizacao?.longitude ?? null;

  useEffect(() => {
    const pedido = ++pedidoRef.current;
    const fonte = fonteDaLista({ termo, localizacao: { latitude, longitude } });
    setLista((anterior) => ({ ...anterior, estado: "carregando" }));
    carregarPagina({ tipo, fonte, termo, localizacao: { latitude, longitude }, pagina: 1 })
      .then(({ itens, temMais, fonte: usada }) => {
        if (pedido !== pedidoRef.current) return;
        setLista({ itens, pagina: 1, temMais, fonte: usada, estado: itens.length ? "ok" : "vazio" });
      })
      .catch((erro) => {
        if (pedido !== pedidoRef.current) return;
        console.error(`Erro ao carregar ${tipo}:`, erro?.response?.status ?? erro?.message);
        setLista((anterior) => ({ ...anterior, itens: [], temMais: false, estado: "erro" }));
      });
  }, [tipo, termo, latitude, longitude, tentativa]);

  const carregarMais = useCallback(async () => {
    if (carregandoMais || !lista.temMais) return;
    const pedido = pedidoRef.current;
    const pagina = lista.pagina + 1;
    setCarregandoMais(true);
    try {
      const { itens, temMais } = await carregarPagina({ tipo, fonte: lista.fonte, termo, localizacao: { latitude, longitude }, pagina });
      if (pedido !== pedidoRef.current) return;
      setLista((anterior) => ({ ...anterior, itens: juntarPagina(anterior.itens, itens, pagina), pagina, temMais }));
    } catch (erro) {
      console.error(`Erro ao carregar mais ${tipo}:`, erro?.response?.status ?? erro?.message);
    } finally {
      setCarregandoMais(false);
    }
  }, [carregandoMais, lista.temMais, lista.pagina, lista.fonte, tipo, termo, latitude, longitude]);

  const tentarDeNovo = useCallback(() => setTentativa((n) => n + 1), []);

  return { ...lista, carregandoMais, carregarMais, tentarDeNovo };
}
