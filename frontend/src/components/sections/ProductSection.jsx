import { useEffect, useRef } from "react";
import { ProductCard } from "../cards/ProductCard";

export function ProductSection({
    produtos = [],
    onCarregarMais,
    temMais = false,
    carregandoMais = false
}) {
    const carregamentoRef = useRef(null);

    useEffect(() => {
        const elemento = carregamentoRef.current;

        if (!elemento || !temMais) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onCarregarMais();
                }
            },
            {
                rootMargin: "600px"
            }
        );

        observer.observe(elemento);

        return () => {
            observer.disconnect();
        };
    }, [
        onCarregarMais,
        temMais
    ]);

    return (
        <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {produtos.map((produto) => (
                    <ProductCard
                        key={produto.id}
                        produto={produto}
                    />
                ))}
            </div>

            {temMais && (
                <div
                    ref={carregamentoRef}
                    className="h-16 flex items-center justify-center mt-6"
                >
                    {carregandoMais && (
                        <p className="text-sm text-gray-500">
                            Carregando mais produtos...
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}