import { CalendarDays, ChartColumn, Package, ShoppingCart, Store } from "lucide-react";

const DESTAQUES = [
  { icone: ShoppingCart, texto: "Venda produtos online" },
  { icone: CalendarDays, texto: "Agende seus serviços" },
  { icone: Package, texto: "Compre de distribuidores", emBreve: true },
  { icone: ChartColumn, texto: "Acompanhe seus resultados" },
];

export function BannerBoasVindas() {
  return (
    <section
      aria-labelledby="titulo-boas-vindas"
      className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#022B19] via-[#0E4A26] to-[#23663B] text-white shadow-pc-card"
    >
      <div className="relative z-10 flex min-h-[190px] items-center gap-6 p-5 pr-[38%] sm:p-7 sm:pr-[40%] lg:min-h-[212px] lg:p-8 xl:pr-[50%]">
        <Store aria-hidden="true" strokeWidth={1.5} className="hidden h-16 w-16 shrink-0 sm:block lg:h-[72px] lg:w-[72px]" />
        <div>
          <h1 id="titulo-boas-vindas" className="text-[26px] font-extrabold leading-tight sm:text-4xl lg:text-[44px]">
            Bem-vindo à <span className="block text-pc-lima">Área do Lojista!</span>
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/90 sm:text-base lg:text-lg">
            Gerencie seus produtos, serviços, pedidos e agendamentos em um só lugar.
          </p>
        </div>
      </div>

      <img
        src="/midia/site/lojista/boas-vindas-pets.png"
        alt=""
        width={360}
        height={218}
        decoding="async"
        className="absolute bottom-0 right-0 h-full w-auto max-w-[48%] object-cover object-left [mask-image:linear-gradient(to_right,transparent,black_20%)] xl:right-[340px]"
      />

      <ul className="absolute right-5 top-1/2 z-10 hidden w-[310px] -translate-y-1/2 divide-y divide-white/15 rounded-2xl border border-white/15 bg-white/10 px-5 py-1 backdrop-blur-sm xl:block">
        {DESTAQUES.map(({ icone: Icone, texto, emBreve }) => (
          <li key={texto} className="flex items-center gap-3 whitespace-nowrap py-2 text-[15px] font-semibold">
            <Icone aria-hidden="true" className="h-6 w-6 shrink-0 text-pc-lima" />
            <span>{texto}</span>
            {emBreve && <span className="ml-auto rounded-pc-pill bg-white/15 px-2 py-0.5 text-[11px] font-semibold">Em breve</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
