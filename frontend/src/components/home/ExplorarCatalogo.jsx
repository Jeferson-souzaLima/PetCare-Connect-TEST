import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { CategoryTabs } from "@/components/navigation/CategoryTabs";
import { ProductSection } from "@/components/sections/ProductSection";
import { LojaSection } from "@/components/sections/LojaSection";
import { ServicosSection } from "@/components/sections/ServicosSection";
import { Alert } from "@/components/ui/Alert";

/**
 * Catálogo por localização (abas Produtos, Lojas e Serviços), o mesmo da
 * home anterior. O JSX abaixo foi movido sem alteração de pages/HomePage.jsx.
 */
export function ExplorarCatalogo({ catalogo }) {
    const {
        selectedCategory,
        handleCategoryChange,
        produtos,
        lojas,
        servicos,
        modoBusca,
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
        geoLoading,
    } = catalogo;

    const location = useLocation();
    const secaoRef = useRef(null);

    // Atalhos, banner e "Ver mais" levam a /?categoria=...#explorar.
    useEffect(() => {
        if (location.hash === "#explorar") {
            secaoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [location.key, location.hash]);

    return (
        <section id="explorar" ref={secaoRef} aria-labelledby="titulo-explorar" className="scroll-mt-4">
            <h2 id="titulo-explorar" className="px-4 pt-2 text-lg font-bold text-pc-texto md:text-xl">
                Explorar
            </h2>
            {/* As abas (CategoryTabs, compartilhado) passam 4 px da borda em 375 px;
                aqui elas rolam no próprio contêiner em vez de empurrar a página. */}
            <div className="max-w-full overflow-x-auto">
                <CategoryTabs
                    selected={selectedCategory}
                    onChange={handleCategoryChange}
                />

                <div className="px-4 pt-4 pb-8">

                    {geoLoading && (

                        <p className="text-center text-sm text-gray-500">
                            Obtendo sua localização...
                        </p>

                    )}
                    
                    {loadingDados && (

                        <p className="text-center text-sm text-gray-500">
                            Carregando resultados...
                        </p>

                    )}

                    {!loadingDados &&
                        selectedCategory === "produtos" &&
                        produtos && (

                            <ProductSection
                                produtos={produtos}
                                onCarregarMais={carregarMaisProdutos}
                                temMais={temMaisProdutos}
                                carregandoMais={carregandoMaisProdutos}
                            />

                        )}

                    {!loadingDados &&
                    selectedCategory === "lojas" &&
                    lojas && (

                    <>

                        {modoBusca === "proximidade" && (

                            <Alert
                                variant="success"
                                closable
                            >

                                📍 Exibindo as lojas mais próximas da sua localização.

                            </Alert>

                        )}

                        {modoBusca === "todas_localizacao_desativada" && (

                            <Alert
                                variant="warning"
                                closable
                            >

                                📍 Ative sua localização e recarregue a página para visualizar as lojas mais próximas de você.
                                Enquanto isso, estamos exibindo todas as lojas disponíveis.

                            </Alert>

                        )}

                        {modoBusca === "todas_sem_resultado" && (

                            <Alert
                                variant="info"
                                closable
                            >

                                📍 Nenhuma loja foi encontrada em um raio de 10 km da sua localização.
                                Estamos exibindo todas as lojas disponíveis.

                            </Alert>

                        )}

                        <LojaSection
                            lojas={lojas}
                            onCarregarMais={carregarMaisLojas}
                            temMais={temMaisLojas}
                            carregandoMais={carregandoMaisLojas}
                        />

                    </>

                )}

                    {!loadingDados &&
                        selectedCategory === "servicos" &&
                        servicos && (

                            <ServicosSection
                                servicos={servicos}
                                onCarregarMais={carregarMaisServicos}
                                temMais={temMaisServicos}
                                carregandoMais={carregandoMaisServicos}
                            />

                        )}

                </div>
            </div>
        </section>
    );
}
