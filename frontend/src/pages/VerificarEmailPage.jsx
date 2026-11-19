import { API_URL } from "@/services/apiUrl";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { MolduraAutenticacao } from "@/components/autenticacao/MolduraAutenticacao";
import { BotaoAcesso } from "@/components/autenticacao/ElementosAcesso";

const ICONE_POR_STATUS = {
  carregando: { icone: LoaderCircle, classe: "animate-spin text-pc-verde-700" },
  sucesso: { icone: CircleCheck, classe: "text-pc-verde-700" },
  erro: { icone: CircleAlert, classe: "text-red-600" },
};

export default function VerificarEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("carregando");
  const [mensagem, setMensagem] = useState("Confirmando seu e-mail...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("erro");
      setMensagem("O link de confirmação é inválido.");
      return;
    }

    fetch(`${API_URL}/auth/confirmar-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.mensagem);
        setStatus("sucesso");
        setMensagem(data.mensagem);
      })
      .catch((error) => {
        setStatus("erro");
        setMensagem(error.message || "Não foi possível confirmar seu e-mail.");
      });
  }, [searchParams]);

  const { icone: Icone, classe } = ICONE_POR_STATUS[status];

  return (
    <MolduraAutenticacao titulo="Confirmação de e-mail">
      <div role="status" className="text-center">
        <Icone aria-hidden="true" className={`mx-auto h-14 w-14 ${classe}`} />
        <p className={`mt-3 text-[15px] ${status === "erro" ? "text-red-700" : "text-pc-texto-suave"}`}>{mensagem}</p>
        {status !== "carregando" && (
          <BotaoAcesso type="button" onClick={() => navigate("/login")} className="mt-6">
            Ir para o login
          </BotaoAcesso>
        )}
      </div>
    </MolduraAutenticacao>
  );
}
