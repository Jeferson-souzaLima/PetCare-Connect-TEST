import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CategoryTabs } from "@/components/navigation/CategoryTabs";
import { ProductSection } from "@/components/sections/ProductSection";
import { LojaSection } from "@/components/sections/LojaSection";
import { ServicosSection } from "@/components/sections/ServicosSection";
import { Alert } from "@/components/ui/Alert";

/**
 * Catálogo por localização (abas Produtos, Lojas e Serviços), o mesmo da
 * home anterior. O JSX abaixo foi movido sem alteração de pages/HomePage.jsx.
 */
const CATEGORIAS = ["produtos", "lojas", "servicos"];

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
    } = catalogo;

    const location = useLocation();
    const [searchParams] = useSearchParams();
    const secaoRef = useRef(null);
    const categoriaUrl = searchParams.get("categoria");

    // Atalhos, banner, menu e "Ver mais" levam a /?categoria=...#explorar.
    // A cada navegação (location.key), a aba segue a URL, mesmo que a categoria
    // seja a mesma de antes e o usuário tenha trocado de aba à mão.
    useEffect(() => {
        if (CATEGORIAS.includes(categoriaUrl)) handleCategoryChange(categoriaUrl);
        if (location.hash === "#explorar") {
            const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            secaoRef.current?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
        }
    }, [location.key, location.hash, categoriaUrl, handleCategoryChange]);

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
