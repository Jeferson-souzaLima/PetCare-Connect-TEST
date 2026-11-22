import { ServicoCard } from "../cards/ServicoCard";
import { useEffect, useRef } from "react";

export const ServicosSection = ({
  servicos = [],
  onCarregarMais,
  temMais = false,
  carregandoMais = false,
}) => {
  const carregamentoRef = useRef(null);

  useEffect(() => {
    const elemento = carregamentoRef.current;
    if (!elemento || !temMais) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onCarregarMais?.();
    }, { rootMargin: "600px" });

    observer.observe(elemento);
    return () => observer.disconnect();
  }, [onCarregarMais, temMais]);

  return (

    <div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">

        {servicos.map((servico) => (

          <ServicoCard
            key={servico.id}
            servico={servico}
          />

        ))}

      </div>

      {temMais && (
        <div ref={carregamentoRef} className="h-16 flex items-center justify-center mt-6">
          {carregandoMais && <p className="text-sm text-gray-500">Carregando mais serviços...</p>}
        </div>
      )}

    </div>

  );

};
