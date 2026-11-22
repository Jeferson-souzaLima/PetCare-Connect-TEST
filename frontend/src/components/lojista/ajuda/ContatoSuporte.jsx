import { Clock, Headset, Lightbulb, Mail } from "lucide-react";
import { EMAIL_SUPORTE } from "@/utils/ajudaLojista";

/** Link de e-mail já com assunto e um roteiro do que informar, para agilizar o atendimento. */
function linkEmail(loja) {
  const nome = loja?.nome_fantasia || "minha loja";
  const assunto = `Suporte lojista - ${nome}`;
  const corpo = [
    `Loja: ${nome}`,
    "Número do pedido ou agendamento (se houver):",
    "O que aconteceu:",
    "",
  ].join("\n");
  return `mailto:${EMAIL_SUPORTE}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

export function ContatoSuporte({ loja }) {
  return (
    <section aria-labelledby="titulo-contato" className="rounded-pc-card bg-pc-verde-900 p-5 text-white shadow-pc-card sm:p-6">
      <h2 id="titulo-contato" className="flex items-center gap-2 text-lg font-bold">
        <Headset aria-hidden="true" className="h-6 w-6 text-pc-lima" />
        Ainda precisa de ajuda?
      </h2>
      <p className="mt-2 text-sm text-white/85">Fale com a equipe PetCare Connect por e-mail.</p>

      <a
        href={linkEmail(loja)}
        className="mt-4 flex items-center justify-center gap-2 rounded-pc-pill bg-pc-lima px-5 py-3 font-bold text-pc-verde-900 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      >
        <Mail aria-hidden="true" className="h-5 w-5" />
        Escrever para o suporte
      </a>
      <p className="mt-2 break-all text-center text-xs text-white/75">{EMAIL_SUPORTE}</p>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex gap-3">
          <Clock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-pc-lima" />
          <div>
            <dt className="font-semibold">Atendimento</dt>
            <dd className="text-white/85">Segunda a sexta, das 9h às 18h. Resposta em até 1 dia útil.</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <Lightbulb aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-pc-lima" />
          <div>
            <dt className="font-semibold">Para agilizar</dt>
            <dd className="text-white/85">Informe o número do pedido ou agendamento e, se puder, envie um print da tela.</dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
