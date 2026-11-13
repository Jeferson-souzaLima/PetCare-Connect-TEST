import { getMediaUrl } from "@/services/mediaUrl";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaBuilding, FaImage, FaMapMarkerAlt, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { buscarMinhaLoja, salvarMinhaLoja, enviarImagemMinhaLoja } from "../../services/lojaService";
import RecebimentosMercadoPago from "@/components/perfil/RecebimentosMercadoPago";

const initialForm = {
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  telefone: "",
  cep: "",
  cidade: "",
  uf: "",
  endereco: "",
  descricao: "",
  entrega_ativa: false,
  taxa_entrega_fixa: 0,
  taxa_entrega_por_km: 0,
  raio_entrega_km: 10
};

function formatarTelefone(valor) {

  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) return numeros;

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;

}

function formatarCep(valor) {

  const numeros = valor.replace(/\D/g, "").slice(0, 8);

  if (numeros.length <= 5) return numeros;

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;

}

function formatarCnpj(valor) {

  const numeros = valor.replace(/\D/g, "").slice(0, 14);

  if (numeros.length <= 2) return numeros;

  if (numeros.length <= 5) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
  }

  if (numeros.length <= 8) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
  }

  if (numeros.length <= 12) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
  }

  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12)}`;

}

function validarFormulario(form) {

  if (!form.nome_fantasia.trim()) {
    return "Informe o nome fantasia da loja.";
  }

  if (form.uf && !/^[A-Z]{2}$/.test(form.uf)) {
    return "A UF deve conter exatamente duas letras.";
  }

  if (form.cep) {

    const cep = form.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      return "Informe um CEP válido.";
    }

  }

  if (form.cnpj) {

    const cnpj = form.cnpj.replace(/\D/g, "");

    if (cnpj.length !== 14) {
      return "Informe um CNPJ válido.";
    }

  }

  if (form.telefone) {

    const telefone = form.telefone.replace(/\D/g, "");

    if (telefone.length !== 10 && telefone.length !== 11) {

        return "Informe um telefone válido.";

    }

  }

  return null;

}

export default function DadosLojaPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [lojaExiste, setLojaExiste] = useState(false);
  const [imagemAtual, setImagemAtual] = useState("");
  const [imagem, setImagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    buscarMinhaLoja(token).then((loja) => {
      setForm({ ...initialForm, ...loja });
      setImagemAtual(loja.imagem || "");
      setLojaExiste(true);
    }).catch((requestError) => {
      if (requestError.response?.status !== 404) setErro(requestError.response?.data?.mensagem || "Não foi possível carregar os dados da loja.");
    }).finally(() => setCarregando(false));
  }, [token]);

  const atualizarCampo = (event) => {

  const { name, value } = event.target;

  let novoValor = value;

  switch (name) {

    case "telefone":
      novoValor = formatarTelefone(value);
      break;

    case "cep":
      novoValor = formatarCep(value);
      break;

    case "cnpj":
      novoValor = formatarCnpj(value);
      break;

    case "uf":
      novoValor = value.toUpperCase();
      break;

    default:
      break;

  }

  setForm((current) => ({

    ...current,

    [name]: novoValor

  }));

};

  const salvar = async (event) => {

  event.preventDefault();

  setErro("");
  setSucesso("");

  // ===============================
  // VALIDAÇÃO DO FORMULÁRIO
  // ===============================

  const erroValidacao = validarFormulario(form);

  if (erroValidacao) {

    setErro(erroValidacao);

    return;

  }

  // ===============================
  // INICIA O SALVAMENTO
  // ===============================

  setSalvando(true);

  try {

    const result = await salvarMinhaLoja(
      form,
      token,
      lojaExiste
    );

    setLojaExiste(true);

    if (imagem) {

      const imagemResult =
        await enviarImagemMinhaLoja(
          imagem,
          token
        );

      setImagemAtual(imagemResult.imagem);

      setImagem(null);

    }

    setSucesso(
      result.mensagem ||
      "Dados da loja salvos com sucesso."
    );

  } catch (requestError) {

    setErro(
      requestError.response?.data?.mensagem ||
      "Não foi possível salvar os dados da loja."
    );

  } finally {

    setSalvando(false);

  }

};

  if (carregando) return <p className="mt-10 text-center text-gray-600">Carregando dados da loja...</p>;

  return <div className="mx-auto max-w-4xl pb-12">
    <header className="rounded-b-3xl bg-gradient-to-r from-green-200 to-green-300 p-8 shadow-md sm:p-10">
      <button type="button" onClick={() => navigate("/perfil-lojista")} className="mb-5 flex items-center gap-2 text-sm font-semibold text-green-900 hover:underline"><FaArrowLeft /> Voltar ao painel</button>
      <h1 className="text-3xl font-bold text-green-900">Dados da Loja</h1>
      <p className="mt-2 text-green-800">Mantenha essas informações atualizadas para transmitir confiança aos clientes.</p>
    </header>
    <form onSubmit={salvar} className="space-y-6 p-4 sm:p-6">
      {erro && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p>}
      {sucesso && <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{sucesso}</p>}

      <Section icon={<FaBuilding />} title="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome fantasia" 
            name="nome_fantasia" 
            value={form.nome_fantasia} 
            onChange={atualizarCampo} 
            required 
          />
          <Field label="Razão social" 
            name="razao_social" 
            value={form.razao_social} 
            onChange={atualizarCampo} 
          />
          <Field
            label="CNPJ"
            name="cnpj"
            value={form.cnpj}
            onChange={atualizarCampo}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            autoComplete="off"
          />
          <Field
            label="Telefone"
            name="telefone"
            value={form.telefone}
            onChange={atualizarCampo}
            placeholder="(11) 99999-9999"
            maxLength={15}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
      </Section>

      <Section icon={<FaMapMarkerAlt />} title="Localização">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="CEP"
            name="cep"
            value={form.cep}
            onChange={atualizarCampo}
            placeholder="00000-000"
            maxLength={9}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </div>
        <div className="mt-4">
          <Field
            label="Endereço"
            name="endereco"
            value={form.endereco}
            onChange={atualizarCampo}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3 mt-4">
          <div className="sm:col-span-2">
            <Field
              label="Cidade"
              name="cidade"
              value={form.cidade}
              onChange={atualizarCampo}
            />
          </div>
          <Field
            label="UF"
            name="uf"
            value={form.uf}
            onChange={atualizarCampo}
            maxLength={2}
          />
        </div>
      </Section>
      
      <Section icon={<FaBuilding />} title="Apresentação">
       <label className="mt-5 block text-sm font-semibold text-gray-700">Descrição<textarea name="descricao" value={form.descricao || ""} onChange={atualizarCampo} rows={5} maxLength={1000} className="mt-2 w-full rounded-xl border p-3 font-normal focus:outline-none focus:ring-2 focus:ring-green-900" placeholder="Conte aos clientes sobre sua loja, especialidades e diferenciais." /></label></Section>

      <Section icon={<FaMapMarkerAlt />} title="Entrega">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700"><input type="checkbox" name="entrega_ativa" checked={Boolean(form.entrega_ativa)} onChange={(event) => setForm((current) => ({ ...current, entrega_ativa: event.target.checked }))} /> Oferecer entrega</label>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Taxa fixa (R$)" name="taxa_entrega_fixa" type="number" inputMode="decimal" value={form.taxa_entrega_fixa} onChange={atualizarCampo} />
          <Field label="Valor por km (R$)" name="taxa_entrega_por_km" type="number" inputMode="decimal" value={form.taxa_entrega_por_km} onChange={atualizarCampo} />
          <Field label="Raio máximo (km)" name="raio_entrega_km" type="number" inputMode="decimal" value={form.raio_entrega_km} onChange={atualizarCampo} />
        </div>
        <p className="mt-3 text-xs text-gray-500">O frete usa a distância em linha reta entre a loja e o endereço do cliente.</p>
      </Section>
      
      <Section icon={<FaImage />} title="Imagem da loja">
       <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">{imagemAtual ? <img src={getMediaUrl(imagemAtual)} alt="Logo da loja" className="h-24 w-24 rounded-2xl object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-green-100 text-3xl text-green-900"><FaBuilding /></div>}<div><input type="file" accept="image/jpeg,image/png" onChange={(event) => setImagem(event.target.files?.[0] || null)} className="block text-sm text-gray-600" /><p className="mt-2 text-xs text-gray-500">PNG ou JPG, até 5 MB. A imagem é enviada ao salvar.</p></div></div></Section>
      
      <button type="submit" disabled={salvando} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-900 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"><FaSave /> {salvando ? "Salvando..." : "Salvar dados da loja"}</button>
    </form>
    {lojaExiste && <div className="px-4 sm:px-6"><RecebimentosMercadoPago /></div>}
  </div>;
}

function Section({ icon, title, children }) {

  return (

    <section className="rounded-2xl bg-white p-6 shadow-md">

      <h2 className="flex items-center gap-3 text-xl font-bold text-green-900">
        {icon}
        {title}
      </h2>

      <div className="mt-5">
        {children}
      </div>

    </section>

  );

}

function Field({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
  maxLength,
  type = "text",
  autoComplete = "off",
  inputMode
}) {

  return (

    <label className="block text-sm font-semibold text-gray-700">

      {label}

      {required && (
        <span className="text-red-600"> *</span>
      )}

      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="
          mt-2
          w-full
          rounded-xl
          border
          border-gray-300
          p-3
          font-normal
          transition
          focus:border-green-900
          focus:outline-none
          focus:ring-2
          focus:ring-green-900
        "
      />

    </label>

  );

}
