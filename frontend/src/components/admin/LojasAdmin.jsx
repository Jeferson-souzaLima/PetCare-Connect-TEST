import { useCallback, useEffect, useState } from "react";
import MensagemStatus from "@/components/ui/MensagemStatus";
import { definirSituacaoLoja, listarLojasAdmin } from "@/services/adminService";
import { formatarDataHora } from "@/utils/formatadores";
import { mensagemDeErro } from "./mensagemDeErro";

const FILTROS = [
  { valor: "pendentes", rotulo: "Aguardando aprovação" },
  { valor: "ativas", rotulo: "Ativas" },
  { valor: "todas", rotulo: "Todas" },
];

function Selo({ ativo, textoSim, textoNao }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ativo ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
      {ativo ? textoSim : textoNao}
    </span>
  );
}

export default function LojasAdmin() {
  const [filtro, setFiltro] = useState("pendentes");
  const [lojas, setLojas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setLojas(await listarLojasAdmin(filtro));
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível carregar as lojas.") });
    } finally {
      setCarregando(false);
    }
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  async function alterarSituacao(loja, ativo) {
    const pergunta = ativo
      ? `Aprovar "${loja.nome_fantasia}"? A loja passa a aparecer para os clientes.`
      : `Suspender "${loja.nome_fantasia}"? A loja deixa de aparecer e não recebe novos pedidos.`;
    if (!window.confirm(pergunta)) return;

    try {
      const resposta = await definirSituacaoLoja(loja.id, ativo);
      setMensagem({ tipo: "sucesso", texto: resposta.mensagem });
      carregar();
    } catch (erro) {
      setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível alterar a loja.") });
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTROS.map(({ valor, rotulo }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${filtro === valor ? "bg-green-900 text-white" : "bg-white text-green-900 shadow"}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <MensagemStatus mensagem={mensagem} />

      {carregando && <p className="text-gray-600">Carregando lojas...</p>}
      {!carregando && lojas.length === 0 && <p className="text-gray-600">Nenhuma loja neste filtro.</p>}

      <ul className="space-y-3">
        {lojas.map((loja) => (
          <li key={loja.id} className="rounded-2xl bg-white p-5 shadow">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-green-900">{loja.nome_fantasia}</p>
                <p className="text-sm text-gray-600">{loja.razao_social || "Razão social não informada"} · CNPJ {loja.cnpj || "não informado"}</p>
                <p className="text-sm text-gray-600">{[loja.cidade, loja.uf].filter(Boolean).join(" - ") || "Cidade não informada"} · {loja.telefone || "sem telefone"}</p>
                <p className="text-sm text-gray-600">Responsável: {loja.responsavel} ({loja.email}) · cadastro em {formatarDataHora(loja.data_criacao)}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Selo ativo={loja.ativo} textoSim="Ativa" textoNao="Aguardando aprovação ou suspensa" />
                  <Selo ativo={loja.email_verificado} textoSim="E-mail confirmado" textoNao="E-mail não confirmado" />
                  <Selo ativo={loja.recebe_online} textoSim="Mercado Pago conectado" textoNao="Mercado Pago não conectado" />
                </div>
              </div>
              {loja.ativo ? (
                <button type="button" onClick={() => alterarSituacao(loja, false)} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Suspender
                </button>
              ) : (
                <button type="button" onClick={() => alterarSituacao(loja, true)} className="rounded-xl bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">
                  Aprovar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
