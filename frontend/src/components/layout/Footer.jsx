import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { LogoPetCare } from "@/components/ui/LogoPetCare";
import { EMAIL_SUPORTE } from "@/utils/ajudaLojista";

// Mesmos destinos do menu lateral da home (HomeSidebar).
const GRUPOS = [
  {
    titulo: "Explorar",
    links: [
      { rotulo: "Início", destino: "/" },
      { rotulo: "Produtos", destino: "/produtos" },
      { rotulo: "Serviços", destino: "/servicos" },
      { rotulo: "Lojas e parceiros", destino: "/lojas" },
    ],
  },
  {
    titulo: "Minha conta",
    links: [
      { rotulo: "Meus pedidos", destino: "/meus-pedidos" },
      { rotulo: "Meus agendamentos", destino: "/meus-agendamentos" },
      { rotulo: "Meus pets", destino: "/perfil" },
      { rotulo: "Favoritos", destino: "/favoritos" },
    ],
  },
  {
    titulo: "Para lojistas",
    links: [
      { rotulo: "Cadastre sua loja", destino: "/register-lojista" },
      { rotulo: "Área do lojista", destino: "/login" },
      { rotulo: "Ajuda para lojistas", destino: "/lojista/ajuda-suporte" },
    ],
  },
];

const LINK =
  "rounded text-sm text-white/75 transition-colors hover:text-pc-lima focus-visible:text-pc-lima focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-lima/60";

/**
 * Rodapé do site: apresentação, links por assunto, contato e termos.
 * No celular as páginas reservam 7rem embaixo para a barra flutuante; o rodapé ocupa esse
 * espaço (margem negativa + padding) para o verde ir até o fim, com a barra por cima.
 */
export function Footer() {
  const ano = new Date().getFullYear();
  const [usuarioEmail, dominioEmail] = EMAIL_SUPORTE.split("@");

  return (
    <footer className="mt-10 bg-pc-verde-900 text-white max-md:-mb-[calc(7rem+env(safe-area-inset-bottom))] max-md:pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-pc-pagina grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 md:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.3fr] lg:py-12">
        <div className="col-span-2 lg:col-span-1">
          <Link to="/" aria-label="PetCare Connect, página inicial" className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pc-lima/60">
            <LogoPetCare alt="" className="h-12" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/75">
            Produtos e serviços para o seu pet, no mesmo lugar. Compre e agende com as melhores lojas da sua região.
          </p>
        </div>

        <nav aria-label="Rodapé" className="contents">
          {GRUPOS.map(({ titulo, links }) => (
            <div key={titulo}>
              <h2 className="text-sm font-bold text-white">{titulo}</h2>
              <ul className="mt-3 space-y-2.5">
                {links.map(({ rotulo, destino }) => (
                  <li key={rotulo}>
                    <Link to={destino} className={LINK}>
                      {rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="col-span-2 sm:col-span-1">
          <h2 className="text-sm font-bold text-white">Atendimento</h2>
          <a href={`mailto:${EMAIL_SUPORTE}`} className={`${LINK} mt-3 inline-flex items-start gap-2 [overflow-wrap:anywhere]`}>
            <Mail size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            {/* Se não couber, quebra antes do "@" (e não no meio do domínio). */}
            <span>
              {usuarioEmail}
              <wbr />@{dominioEmail}
            </span>
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-pc-pagina flex-col gap-3 px-4 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p>© {ano} PetCare Connect. Todos os direitos reservados.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li>
              <Link to="/termos" className="rounded hover:text-pc-lima focus-visible:text-pc-lima focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-lima/60">
                Termos de uso
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="rounded hover:text-pc-lima focus-visible:text-pc-lima focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-lima/60">
                Política de privacidade
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
