import { useCallback, useEffect, useRef, useState } from "react";
import { buscarLojas } from "@/services/lojaService";
import { buscarProdutos } from "@/services/produtoService";
import { buscarServicos } from "@/services/servicoService";
import { buscarConteudoPorLocalizacao } from "@/services/geolocalizacaoService";
import { fonteDaLista, juntarPagina, parametrosDaLista } from "@/utils/explorar";

const POR_PAGINA = 20;
const LISTA_GERAL = { lojas: buscarLojas, produtos: buscarProdutos, servicos: buscarServicos };

/** Uma página da lista do tipo pedido, conforme a fonte (filtrada na API, proximidade ou geral). */
async function carregarPagina({ tipo, fonte, parametros, localizacao, pagina }) {
  if (fonte === "proximidade") {
    const dados = await buscarConteudoPorLocalizacao(localizacao.latitude, localizacao.longitude, pagina, POR_PAGINA);
    const resultado = dados?.[tipo];
    // Nada perto na primeira página: mostra a lista geral em vez de uma tela vazia.
    if (pagina > 1 || resultado?.dados?.length) {
      return { itens: resultado?.dados ?? [], temMais: Boolean(resultado?.temMais), fonte };
    }
    return carregarPagina({ tipo, fonte: "geral", parametros, localizacao, pagina });
  }
  const resultado = await LISTA_GERAL[tipo](pagina, POR_PAGINA, fonte === "filtrada" ? parametros : {});
  return { itens: resultado?.dados ?? [], temMais: Boolean(resultado?.temMais), fonte };
}

/**
 * Lista de lojas, produtos ou serviços com busca e filtro (na API), proximidade e "carregar mais".
 * Com busca ou filtro, a lista vem da API filtrada; sem eles, perto da localização escolhida.
 * estado: "carregando" | "ok" | "vazio" | "erro".
 */
export function useListaExplorar(tipo, { termo, filtros, localizacao }) {
  const fonteInicial = fonteDaLista({ termo, filtros, localizacao });
  const [lista, setLista] = useState({ itens: [], pagina: 1, temMais: false, fonte: fonteInicial, estado: "carregando" });
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const pedidoRef = useRef(0);

  const latitude = localizacao?.latitude ?? null;
  const longitude = localizacao?.longitude ?? null;
  // Chave estável dos parâmetros: o objeto de filtros muda a cada render.
  const chaveParametros = JSON.stringify(parametrosDaLista({ termo, filtros }));

  useEffect(() => {
    const pedido = ++pedidoRef.current;
    const parametros = JSON.parse(chaveParametros);
    const fonte = fonteDaLista({ termo: parametros.q, filtros: parametros, localizacao: { latitude, longitude } });
    setLista((anterior) => ({ ...anterior, estado: "carregando" }));
    carregarPagina({ tipo, fonte, parametros, localizacao: { latitude, longitude }, pagina: 1 })
      .then(({ itens, temMais, fonte: usada }) => {
        if (pedido !== pedidoRef.current) return;
        setLista({ itens, pagina: 1, temMais, fonte: usada, estado: itens.length ? "ok" : "vazio" });
      })
      .catch((erro) => {
        if (pedido !== pedidoRef.current) return;
        console.error(`Erro ao carregar ${tipo}:`, erro?.response?.status ?? erro?.message);
        setLista((anterior) => ({ ...anterior, itens: [], temMais: false, estado: "erro" }));
      });
  }, [tipo, chaveParametros, latitude, longitude, tentativa]);

  const carregarMais = useCallback(async () => {
    if (carregandoMais || !lista.temMais) return;
    const pedido = pedidoRef.current;
    const pagina = lista.pagina + 1;
    setCarregandoMais(true);
    try {
      const parametros = JSON.parse(chaveParametros);
      const { itens, temMais } = await carregarPagina({ tipo, fonte: lista.fonte, parametros, localizacao: { latitude, longitude }, pagina });
      if (pedido !== pedidoRef.current) return;
      setLista((anterior) => ({ ...anterior, itens: juntarPagina(anterior.itens, itens, pagina), pagina, temMais }));
    } catch (erro) {
      console.error(`Erro ao carregar mais ${tipo}:`, erro?.response?.status ?? erro?.message);
    } finally {
      setCarregandoMais(false);
    }
  }, [carregandoMais, lista.temMais, lista.pagina, lista.fonte, tipo, chaveParametros, latitude, longitude]);

  const tentarDeNovo = useCallback(() => setTentativa((n) => n + 1), []);

  return { ...lista, carregandoMais, carregarMais, tentarDeNovo };
}
