import { API_URL } from "@/services/apiUrl";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FileText, Lock, Mail, MapPin, Phone, Store } from "lucide-react";
import { CaixaAceiteTermos } from "@/components/legal/CaixaAceiteTermos";
import { MolduraAutenticacao } from "@/components/autenticacao/MolduraAutenticacao";
import {
  AvisoAcesso,
  BotaoAcesso,
  CampoAcesso,
  CampoSenhaAcesso,
  LinkAcesso,
  PainelConfirmeEmail,
} from "@/components/autenticacao/ElementosAcesso";

function Secao({ titulo, children }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-bold uppercase tracking-wide text-pc-verde-700">{titulo}</legend>
      {children}
    </fieldset>
  );
}

export default function RegisterLojista() {
  const navigate = useNavigate();
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [descricao, setDescricao] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!nomeFantasia || !cnpj || !email || !senha) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    if (senha !== confirmacaoSenha) {
      setErro("A confirmação de senha não confere.");
      return;
    }

    if (!aceiteTermos) {
      setErro("Para cadastrar a loja, aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/auth/register-lojista`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeFantasia,
          razaoSocial,
          cnpj,
          email,
          senha,
          confirmacaoSenha,
          telefone,
          cidade,
          uf,
          descricao,
          aceiteTermos,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.mensagem || "Erro ao cadastrar lojista.");
        return;
      }

      setSucesso(data.mensagem);
    } catch (err) {
      console.error(err);
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) {
    return (
      <MolduraAutenticacao titulo="Loja cadastrada!" publico="lojista">
        <PainelConfirmeEmail mensagem={sucesso} aoIrParaLogin={() => navigate("/login")} />
        <p className="mt-4 text-center text-sm text-pc-texto-suave">
          Depois de confirmar o e-mail, você já pode cadastrar produtos e serviços. A loja aparece para os clientes
          assim que nossa equipe aprovar o cadastro.
        </p>
      </MolduraAutenticacao>
    );
  }

  return (
    <MolduraAutenticacao
      titulo="Cadastre sua loja"
      subtitulo="Depois da análise da nossa equipe, sua loja aparece para os clientes."
      publico="lojista"
      larga
    >
      <form onSubmit={handleRegister} className="space-y-6">
        <Secao titulo="Sua loja">
          <CampoAcesso
            id="loja-nome-fantasia"
            rotulo="Nome fantasia"
            icone={Store}
            autoComplete="organization"
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            obrigatorio
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoAcesso
              id="loja-cnpj"
              rotulo="CNPJ"
              icone={FileText}
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              obrigatorio
            />
            <CampoAcesso
              id="loja-telefone"
              rotulo="Telefone"
              icone={Phone}
              type="tel"
              autoComplete="tel"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />
          </div>
          <CampoAcesso
            id="loja-razao-social"
            rotulo="Razão social (opcional)"
            icone={Building2}
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
          />
          <div className="grid grid-cols-[1fr_96px] gap-4">
            <CampoAcesso
              id="loja-cidade"
              rotulo="Cidade"
              icone={MapPin}
              autoComplete="address-level2"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <CampoAcesso
              id="loja-uf"
              rotulo="UF"
              autoComplete="address-level1"
              maxLength={2}
              placeholder="SP"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
            />
          </div>
          <CampoAcesso
            id="loja-descricao"
            rotulo="Descrição da loja (opcional)"
            multilinha
            rows={3}
            placeholder="Conte o que sua loja oferece"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </Secao>

        <Secao titulo="Acesso à conta">
          <CampoAcesso
            id="loja-email"
            rotulo="E-mail"
            icone={Mail}
            type="email"
            autoComplete="email"
            placeholder="contato@sualoja.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            obrigatorio
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoSenhaAcesso
              id="loja-senha"
              rotulo="Senha"
              icone={Lock}
              autoComplete="new-password"
              minLength={8}
              dica="Mínimo de 8 caracteres."
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              obrigatorio
            />
            <CampoSenhaAcesso
              id="loja-confirmacao"
              rotulo="Confirme a senha"
              icone={Lock}
              autoComplete="new-password"
              minLength={8}
              value={confirmacaoSenha}
              onChange={(e) => setConfirmacaoSenha(e.target.value)}
              obrigatorio
            />
          </div>
        </Secao>

        <CaixaAceiteTermos marcado={aceiteTermos} onChange={setAceiteTermos} />
        <AvisoAcesso erro={erro} />
        <BotaoAcesso carregando={enviando} textoCarregando="Cadastrando...">Cadastrar loja</BotaoAcesso>
      </form>

      <p className="mt-6 text-center text-[15px] text-pc-texto-suave">
        Já tem conta? <LinkAcesso to="/login">Entrar</LinkAcesso>
      </p>
    </MolduraAutenticacao>
  );
}
