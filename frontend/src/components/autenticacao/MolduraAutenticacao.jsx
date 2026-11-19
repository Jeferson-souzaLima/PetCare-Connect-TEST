import { Link } from "react-router-dom";
import { CalendarDays, ChartColumn, MapPin, PawPrint, ShieldCheck, ShoppingCart, Wallet } from "lucide-react";
import { LogoPetCare } from "@/components/ui/LogoPetCare";

const MENSAGENS = {
  cliente: {
    titulo: "Tudo para o seu pet em um só lugar",
    itens: [
      { icone: MapPin, texto: "Lojas e serviços perto de você" },
      { icone: CalendarDays, texto: "Agende banho, tosa e consultas" },
      { icone: ShieldCheck, texto: "Pagamento seguro pelo Mercado Pago" },
    ],
  },
  lojista: {
    titulo: "Leve sua loja para o PetCare Connect",
    itens: [
      { icone: ShoppingCart, texto: "Venda produtos e serviços on-line" },
      { icone: Wallet, texto: "Receba direto na sua conta Mercado Pago" },
      { icone: ChartColumn, texto: "Acompanhe vendas e agendamentos" },
    ],
  },
};

const FOCO = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60";

/**
 * Moldura das telas de acesso (login, cadastro, senha, confirmação de e-mail):
 * fundo verde com o logo transparente fora do formulário e o formulário num cartão branco.
 */
export function MolduraAutenticacao({ titulo, subtitulo, publico = "cliente", larga = false, children }) {
  const mensagem = MENSAGENS[publico];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#01351A] bg-[radial-gradient(circle_at_15%_10%,rgba(191,248,55,0.14),transparent_45%),linear-gradient(135deg,#01351A_0%,#0B4F27_55%,#1B6B35_100%)] text-white">
      <PawPrint aria-hidden="true" strokeWidth={1} className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rotate-[-20deg] text-white/[0.05]" />
      <PawPrint aria-hidden="true" strokeWidth={1} className="pointer-events-none absolute -right-10 top-24 hidden h-56 w-56 rotate-[25deg] text-white/[0.05] lg:block" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-6 pt-8 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-10">
        <div className="flex flex-col items-center lg:flex-1 lg:items-start">
          <Link to="/" aria-label="PetCare Connect, página inicial" className={`rounded-lg ${FOCO}`}>
            <LogoPetCare alt="" larguraExibida="(min-width: 1024px) 180px, 120px" className="h-14 sm:h-16 lg:h-24" />
          </Link>

          <div className="mt-10 hidden max-w-md lg:block">
            <p className="text-4xl font-extrabold leading-tight">{mensagem.titulo}</p>
            <ul className="mt-8 space-y-4">
              {mensagem.itens.map(({ icone: Icone, texto }) => (
                <li key={texto} className="flex items-center gap-4 text-lg text-white/90">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <Icone aria-hidden="true" className="h-6 w-6 text-pc-lima" />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <main className="mt-6 flex flex-1 items-start justify-center lg:mt-0 lg:items-center">
          <div className={`w-full ${larga ? "max-w-xl" : "max-w-md"} rounded-[28px] bg-white p-6 text-pc-texto shadow-2xl sm:p-8`}>
            <h1 className="text-2xl font-extrabold text-pc-verde-900 sm:text-3xl">{titulo}</h1>
            {subtitulo && <p className="mt-2 text-[15px] text-pc-texto-suave">{subtitulo}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>

      <footer className="relative pb-6 text-center text-sm text-white/70">
        <Link to="/termos" className={`rounded hover:text-white hover:underline ${FOCO}`}>Termos de Uso</Link>
        <span aria-hidden="true" className="mx-2">·</span>
        <Link to="/privacidade" className={`rounded hover:text-white hover:underline ${FOCO}`}>Política de Privacidade</Link>
      </footer>
    </div>
  );
}
