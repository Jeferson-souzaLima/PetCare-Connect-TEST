import { useState } from "react";
import { Mail } from "lucide-react";
import { solicitarRedefinicaoSenha } from "@/services/authService";
import { MolduraAutenticacao } from "@/components/autenticacao/MolduraAutenticacao";
import { AvisoAcesso, BotaoAcesso, CampoAcesso, LinkAcesso } from "@/components/autenticacao/ElementosAcesso";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setEnviando(true);

    try {
      const resposta = await solicitarRedefinicaoSenha(email);
      setAviso(`${resposta.mensagem} Confira também a caixa de spam.`);
    } catch (falha) {
      setErro(falha?.response?.data?.mensagem || "Erro ao conectar com o servidor.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MolduraAutenticacao
      titulo="Esqueci minha senha"
      subtitulo="Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha."
    >
      <form onSubmit={enviar} className="space-y-4">
        <CampoAcesso
          id="recuperar-email"
          rotulo="E-mail"
          icone={Mail}
          type="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          obrigatorio
        />
        <AvisoAcesso erro={erro} aviso={aviso} />
        <BotaoAcesso carregando={enviando} textoCarregando="Enviando...">Enviar link</BotaoAcesso>
      </form>

      <p className="mt-6 text-center text-[15px]">
        <LinkAcesso to="/login">Voltar para o login</LinkAcesso>
      </p>
    </MolduraAutenticacao>
  );
}
