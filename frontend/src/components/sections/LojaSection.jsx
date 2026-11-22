import { useEffect, useRef } from "react";
import { LojaCard } from "../cards/LojaCard";

export function LojaSection({
  lojas = [],
  onCarregarMais,
  temMais = false,
  carregandoMais = false
}) {
  const carregamentoRef = useRef(null);

  useEffect(() => {
    const elemento = carregamentoRef.current;

    if (!elemento || !temMais) return;

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

    return () => observer.disconnect();
  }, [onCarregarMais, temMais]);

  return (
    <section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {lojas.map((loja) => (

          <LojaCard
            key={loja.id}
            loja={loja}
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
              Carregando mais lojas...
            </p>
          )}
        </div>
      )}

    </section>
  );
}