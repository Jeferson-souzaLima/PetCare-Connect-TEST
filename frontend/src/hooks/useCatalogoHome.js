import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { buscarProdutos } from "@/services/produtoService";
import { buscarLojas } from "@/services/lojaService";
import { buscarServicos } from "@/services/servicoService";
import { buscarConteudoPorLocalizacao } from "@/services/geolocalizacaoService";
import { useLocalizacao } from "./useLocalizacao";

const CATEGORIAS_VALIDAS = ["produtos", "lojas", "servicos"];

/**
 * Catálogo por localização da home (abas Produtos, Lojas e Serviços).
 * Lógica movida sem alteração de pages/HomePage.jsx; a nova home usa os
 * mesmos dados para a vitrine e para a seção "Explorar".
 */
export function useCatalogoHome() {
    const [searchParams] = useSearchParams();

    const categoriaInicial = searchParams.get("categoria");

    const [selectedCategory, setSelectedCategory] = useState(
    CATEGORIAS_VALIDAS.includes(categoriaInicial)
        ? categoriaInicial
        : "produtos"
    );

    useEffect(() => {
        if (CATEGORIAS_VALIDAS.includes(categoriaInicial)) {
            setSelectedCategory(categoriaInicial);
        }
    }, [categoriaInicial]);

    const [produtos, setProdutos] = useState([]);
    const [lojas, setLojas] = useState(null);
    const [servicos, setServicos] = useState([]);

    const [modoBusca, setModoBusca] = useState(null);
    const [modoBuscaProdutos, setModoBuscaProdutos] = useState("geral");
    const [modoBuscaServicos, setModoBuscaServicos] = useState("geral");

    const [paginaProdutos, setPaginaProdutos] = useState(1);
    const [temMaisProdutos, setTemMaisProdutos] = useState(false);
    const [carregandoMaisProdutos, setCarregandoMaisProdutos] = useState(false);
    const [paginaLojas, setPaginaLojas] = useState(1);
    const [temMaisLojas, setTemMaisLojas] = useState(false);
    const [carregandoMaisLojas, setCarregandoMaisLojas] = useState(false);
    const [paginaServicos, setPaginaServicos] = useState(1);
    const [temMaisServicos, setTemMaisServicos] = useState(false);
    const [carregandoMaisServicos, setCarregandoMaisServicos] = useState(false);

    const [loadingDados, setLoadingDados] = useState(false);

    // Localização escolhida pela pessoa no cabeçalho (sem ela, as listas gerais).
    const { localizacao } = useLocalizacao();
    const latitude = localizacao?.latitude ?? null;
    const longitude = localizacao?.longitude ?? null;

    const handleCategoryChange = useCallback((categoria) => {

        setSelectedCategory(categoria);

    }, []);

    const carregarMaisProdutos = useCallback(async () => {
        if (
            selectedCategory !== "produtos" ||
            carregandoMaisProdutos ||
            !temMaisProdutos
        ) {
            return;
        }

        try {
            setCarregandoMaisProdutos(true);

            const proximaPagina = paginaProdutos + 1;

            let resultado;

            if (
                modoBuscaProdutos === "proximidade" &&
                latitude &&
                longitude
            ) {
                const data = await buscarConteudoPorLocalizacao(
                    latitude,
                    longitude,
                    proximaPagina,
                    20
                );

                resultado = data?.produtos;
            } else {
                resultado = await buscarProdutos(
                    proximaPagina,
                    20
                );
            }

            const novosProdutos = resultado?.dados ?? [];

            if (novosProdutos.length > 0) {
                setProdutos((produtosAtuais) => [
                    ...produtosAtuais,
                    ...novosProdutos
                ]);
            }

            setPaginaProdutos(
                resultado?.pagina ?? proximaPagina
            );

            setTemMaisProdutos(
                resultado?.temMais ?? false
            );

        } catch (error) {
            console.error(
                "Erro ao carregar mais produtos:",
                error
            );
        } finally {
            setCarregandoMaisProdutos(false);
        }
    }, [
        selectedCategory,
        carregandoMaisProdutos,
        temMaisProdutos,
        paginaProdutos,
        modoBuscaProdutos,
        latitude,
        longitude
    ]);

    const carregarMaisLojas = useCallback(async () => {
        if (
            selectedCategory !== "lojas" ||
            carregandoMaisLojas ||
            !temMaisLojas
        ) {
            return;
        }

        try {
            setCarregandoMaisLojas(true);

            const proximaPagina = paginaLojas + 1;

            let resultado;

            if (
                modoBusca === "proximidade" &&
                latitude &&
                longitude
            ) {
                const data = await buscarConteudoPorLocalizacao(
                    latitude,
                    longitude,
                    proximaPagina,
                    20
                );

                resultado = data?.lojas;
            } else {
                resultado = await buscarLojas(
                    proximaPagina,
                    20
                );
            }

            const novasLojas = resultado?.dados ?? [];

            if (novasLojas.length > 0) {
                setLojas((lojasAtuais) => [
                    ...(lojasAtuais ?? []),
                    ...novasLojas
                ]);
            }

            setPaginaLojas(
                resultado?.pagina ?? proximaPagina
            );

            setTemMaisLojas(
                resultado?.temMais ?? false
            );

        } catch (error) {

            console.error(
                "Erro ao carregar mais lojas:",
                error
            );

        } finally {

            setCarregandoMaisLojas(false);

        }
    }, [
        selectedCategory,
        carregandoMaisLojas,
        temMaisLojas,
        paginaLojas,
        modoBusca,
        latitude,
        longitude
    ]);

    const carregarMaisServicos = useCallback(async () => {
        if (selectedCategory !== "servicos" || carregandoMaisServicos || !temMaisServicos) return;

        try {
            setCarregandoMaisServicos(true);
            const proximaPagina = paginaServicos + 1;
            let resultado;

            if (modoBuscaServicos === "proximidade" && latitude && longitude) {
                const data = await buscarConteudoPorLocalizacao(latitude, longitude, proximaPagina, 20);
                resultado = data?.servicos;
            } else {
                resultado = await buscarServicos(proximaPagina, 20);
            }

            const novosServicos = resultado?.dados ?? [];
            if (novosServicos.length) setServicos((atuais) => [...atuais, ...novosServicos]);
            setPaginaServicos(resultado?.pagina ?? proximaPagina);
            setTemMaisServicos(resultado?.temMais ?? false);
        } catch (loadError) {
            console.error("Erro ao carregar mais serviços:", loadError);
        } finally {
            setCarregandoMaisServicos(false);
        }
    }, [selectedCategory, carregandoMaisServicos, temMaisServicos, paginaServicos, modoBuscaServicos, latitude, longitude]);

    useEffect(() => {

        let isMounted = true;

        async function carregarDados() {

            try {

                setLoadingDados(true);

                if (selectedCategory === "produtos") {

                let dadosProdutos = [];

                if (latitude && longitude) {

                    const data = await buscarConteudoPorLocalizacao(
                        latitude,
                        longitude
                    );

                    const resultadoProximidade = data?.produtos;

                    const produtosProximos =
                        resultadoProximidade?.dados ?? [];

                    if (produtosProximos.length > 0) {

                        dadosProdutos = produtosProximos;

                        setPaginaProdutos(
                            resultadoProximidade?.pagina ?? 1
                        );

                        setTemMaisProdutos(
                            resultadoProximidade?.temMais ?? false
                        );

                        setModoBuscaProdutos("proximidade");

                    } else {

                        const resultado = await buscarProdutos(1, 20);

                        dadosProdutos = resultado?.dados ?? [];

                        setPaginaProdutos(
                            resultado?.pagina ?? 1
                        );

                        setTemMaisProdutos(
                            resultado?.temMais ?? false
                        );

                        setModoBuscaProdutos("geral");
                    }

                } else {

                    const resultado = await buscarProdutos(1, 20);

                    dadosProdutos = resultado?.dados ?? [];

                    setPaginaProdutos(resultado?.pagina ?? 1);
                    setTemMaisProdutos(resultado?.temMais ?? false);

                    setModoBuscaProdutos("geral");
                }

                if (isMounted) {
                    setProdutos(dadosProdutos);
                }

                return;
            }
                if (selectedCategory === "lojas") {

                    if (latitude && longitude) {

                        const data =
                            await buscarConteudoPorLocalizacao(
                                latitude,
                                longitude
                            );

                        const resultadoProximidade = data?.lojas;

                        const lojasProximas =
                            resultadoProximidade?.dados ?? [];

                        if (lojasProximas.length > 0) {

                            if (isMounted) {

                                setLojas(lojasProximas);

                                setPaginaLojas(
                                    resultadoProximidade?.pagina ?? 1
                                );

                                setTemMaisLojas(
                                    resultadoProximidade?.temMais ?? false
                                );

                                setModoBusca("proximidade");
                            }

                            return;
                        }

                        const resultado = await buscarLojas(1, 20);

                        if (isMounted) {
                            setLojas(resultado?.dados ?? []);

                            setPaginaLojas(
                                resultado?.pagina ?? 1
                            );

                            setTemMaisLojas(
                                resultado?.temMais ?? false
                            );

                            setModoBusca("todas_sem_resultado");
                        }

                    }

                    const resultado = await buscarLojas(1, 20);

                    if (isMounted) {
                        setLojas(resultado?.dados ?? []);

                        setPaginaLojas(
                            resultado?.pagina ?? 1
                        );

                        setTemMaisLojas(
                            resultado?.temMais ?? false
                        );

                        setModoBusca("todas_localizacao_desativada");
                    }

                    return;

                }

                if (selectedCategory === "servicos") {

                    let dadosServicos = [];

                    if (latitude && longitude) {

                        const data =
                            await buscarConteudoPorLocalizacao(
                                latitude,
                                longitude
                            );

                        const resultadoProximidade = data?.servicos;
                        const servicosProximos = resultadoProximidade?.dados ?? [];

                        if (servicosProximos.length > 0) {

                            dadosServicos = servicosProximos;
                            setPaginaServicos(resultadoProximidade?.pagina ?? 1);
                            setTemMaisServicos(resultadoProximidade?.temMais ?? false);
                            setModoBuscaServicos("proximidade");

                        } else {

                            const resultado = await buscarServicos(1, 20);
                            dadosServicos = resultado?.dados ?? [];
                            setPaginaServicos(resultado?.pagina ?? 1);
                            setTemMaisServicos(resultado?.temMais ?? false);
                            setModoBuscaServicos("geral");

                        }

                    } else {

                        const resultado = await buscarServicos(1, 20);
                        dadosServicos = resultado?.dados ?? [];
                        setPaginaServicos(resultado?.pagina ?? 1);
                        setTemMaisServicos(resultado?.temMais ?? false);
                        setModoBuscaServicos("geral");

                    }

                    if (isMounted) {
                        setServicos(dadosServicos ?? []);
                    }

                }

            } catch (error) {

                console.error(
                    "Erro ao carregar dados da home:",
                    error
                );

            } finally {

                if (isMounted) {
                    setLoadingDados(false);
                }

            }

        }

        carregarDados();

        return () => {
            isMounted = false;
        };

    }, [
        selectedCategory,
        latitude,
        longitude
    ]);

    return {
        selectedCategory,
        handleCategoryChange,
        produtos,
        lojas,
        servicos,
        modoBusca,
        modoBuscaProdutos,
        temMaisProdutos,
        carregandoMaisProdutos,
        carregarMaisProdutos,
        temMaisLojas,
        carregandoMaisLojas,
        carregarMaisLojas,
        temMaisServicos,
        carregandoMaisServicos,
        carregarMaisServicos,
        loadingDados,
        latitude,
        longitude,
    };
}
