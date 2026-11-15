import { useEffect, useState } from "react";
import MensagemStatus from "@/components/ui/MensagemStatus";
import { obterFinanceiroAdmin } from "@/services/adminService";
import { formatarMoeda } from "@/utils/formatadores";
import { mensagemDeErro } from "./mensagemDeErro";
import SeletorPeriodo from "./SeletorPeriodo";
import { nomeDoMes } from "./meses";

function Cartao({ titulo, valor, detalhe }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-gray-600">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-green-900">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-gray-500">{detalhe}</p>}
    </div>
  );
}

export default function FinanceiroAdmin() {
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setMensagem(null);
    obterFinanceiroAdmin(ano)
      .then((resposta) => { if (ativo) setDados(resposta); })
      .catch((erro) => { if (ativo) setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível carregar o financeiro.") }); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [ano]);

  const total = dados?.total;

  return (
    <section className="space-y-4">
      <SeletorPeriodo ano={ano} onChange={(periodo) => setAno(periodo.ano)} />
      <MensagemStatus mensagem={mensagem} />
      {carregando && <p className="text-gray-600">Carregando financeiro...</p>}

      {!carregando && total && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Cartao titulo={`GMV ${dados.ano}`} valor={formatarMoeda(total.gmv)} detalhe={`Produtos ${formatarMoeda(total.gmv_produtos)} · Serviços ${formatarMoeda(total.gmv_servicos)}`} />
            <Cartao titulo="Receita da PetCare (comissões)" valor={formatarMoeda(total.receita_comissoes)} detalhe="8% em produtos e 10% em serviços" />
            <Cartao titulo="Vendas aprovadas" valor={total.vendas} detalhe={`Ticket médio ${formatarMoeda(total.ticket_medio)}`} />
            <Cartao titulo="Estornos" valor={formatarMoeda(total.estornos)} detalhe={`${total.vendas_estornadas} venda(s) devolvida(s), fora do GMV`} />
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-green-50 text-green-900">
                <tr>
                  <th className="px-4 py-3">Mês</th>
                  <th className="px-4 py-3 text-right">GMV</th>
                  <th className="px-4 py-3 text-right">Produtos</th>
                  <th className="px-4 py-3 text-right">Serviços</th>
                  <th className="px-4 py-3 text-right">Receita PetCare</th>
                  <th className="px-4 py-3 text-right">Vendas</th>
                  <th className="px-4 py-3 text-right">Ticket médio</th>
                  <th className="px-4 py-3 text-right">Estornos</th>
                </tr>
              </thead>
              <tbody>
                {dados.meses.map((linha) => (
                  <tr key={linha.mes} className={`border-t ${linha.vendas || linha.estornos ? "" : "text-gray-400"}`}>
                    <td className="px-4 py-3 font-semibold">{nomeDoMes(linha.mes)}</td>
                    <td className="px-4 py-3 text-right">{formatarMoeda(linha.gmv)}</td>
                    <td className="px-4 py-3 text-right">{formatarMoeda(linha.gmv_produtos)}</td>
                    <td className="px-4 py-3 text-right">{formatarMoeda(linha.gmv_servicos)}</td>
                    <td className="px-4 py-3 text-right">{formatarMoeda(linha.receita_comissoes)}</td>
                    <td className="px-4 py-3 text-right">{linha.vendas}</td>
                    <td className="px-4 py-3 text-right">{formatarMoeda(linha.ticket_medio)}</td>
                    <td className="px-4 py-3 text-right">{formatarMoeda(linha.estornos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500">
            GMV é o total pago pelos clientes em vendas aprovadas, na data do pagamento. Vendas estornadas saem do GMV.
            A receita da PetCare são as comissões; o lucro é essa receita menos os custos da empresa, que não ficam no sistema.
            Pagamentos anteriores à divisão automática (novembro de 2026) não têm comissão registrada.
          </p>
        </>
      )}
    </section>
  );
}
