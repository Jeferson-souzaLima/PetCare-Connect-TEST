/** Chamada para a compra de distribuidores (funcionalidade ainda em preparação). */
export function FaixaDistribuidores() {
  return (
    <section
      aria-labelledby="titulo-distribuidores"
      className="flex flex-wrap items-center gap-4 rounded-pc-card bg-gradient-to-r from-[#D9F2CB] to-[#EEF8E8] p-4 shadow-pc-card sm:flex-nowrap sm:p-5"
    >
      <img
        src="/midia/site/lojista/caixas-distribuidores.png"
        alt=""
        width={148}
        height={128}
        decoding="async"
        className="h-24 w-auto shrink-0 sm:h-28"
      />
      <div className="min-w-[180px] flex-1">
        <h2 id="titulo-distribuidores" className="text-xl font-extrabold leading-tight text-pc-verde-900 sm:text-2xl">
          Abasteça sua loja
          <span className="block text-lg font-bold text-pc-texto sm:text-xl">com nossos distribuidores</span>
        </h2>
        <p className="mt-1 text-sm text-pc-texto-suave">Produtos com condições especiais e entrega rápida.</p>
      </div>
      <span className="rounded-pc-pill bg-pc-verde-900 px-5 py-3 text-sm font-bold text-white/90">
        Em breve
      </span>
    </section>
  );
}
