import { useEffect, useState } from "react";
import MensagemStatus from "@/components/ui/MensagemStatus";
import { obterRankingsAdmin } from "@/services/adminService";
import { formatarMoeda } from "@/utils/formatadores";
import { mensagemDeErro } from "./mensagemDeErro";
import SeletorPeriodo from "./SeletorPeriodo";

function Ranking({ titulo, itens, chave = (item) => item.id, nome, valor }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h3 className="mb-3 font-semibold text-green-900">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="text-sm text-gray-500">Nada neste período.</p>
      ) : (
        <ol className="space-y-2 text-sm">
          {itens.map((item, posicao) => (
            <li key={chave(item)} className="flex items-start justify-between gap-3">
              <span><span className="mr-2 font-semibold text-green-900">{posicao + 1}.</span>{nome(item)}</span>
              <span className="whitespace-nowrap text-gray-600">{valor(item)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const comLoja = (item) => <>{item.nome} <span className="text-gray-500">· {item.loja}</span></>;
const vezes = (total) => `${total}×`;

export default function RankingsAdmin() {
  const [periodo, setPeriodo] = useState(() => ({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 }));
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setMensagem(null);
    obterRankingsAdmin(periodo)
      .then((resposta) => { if (ativo) setDados(resposta); })
      .catch((erro) => { if (ativo) setMensagem({ tipo: "erro", texto: mensagemDeErro(erro, "Não foi possível carregar os rankings.") }); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [periodo]);

  return (
    <section className="space-y-6">
      <SeletorPeriodo ano={periodo.ano} mes={periodo.mes} onChange={setPeriodo} comMes />
      <MensagemStatus mensagem={mensagem} />
      {carregando && <p className="text-gray-600">Carregando rankings...</p>}

      {!carregando && dados && (
        <>
          <div>
            <h2 className="mb-3 text-lg font-bold text-green-900">Mais vendidos</h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <Ranking titulo="Produtos" itens={dados.mais_vendidos.produtos} nome={comLoja}
                valor={(p) => `${p.quantidade} un. · ${formatarMoeda(p.valor)}`} />
              <Ranking titulo="Serviços" itens={dados.mais_vendidos.servicos} nome={comLoja}
                valor={(s) => `${s.quantidade} agend. · ${formatarMoeda(s.valor)}`} />
              <Ranking titulo="Lojas" itens={dados.mais_vendidos.lojas} nome={(l) => l.nome}
                valor={(l) => `${formatarMoeda(l.valor)} · ${l.vendas} venda(s)`} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-green-900">Mais procurados</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <Ranking titulo="Termos mais buscados" itens={dados.buscas.mais_buscadas} chave={(b) => b.termo}
                nome={(b) => b.termo} valor={(b) => vezes(b.total)} />
              <Ranking titulo="Buscas sem resultado" itens={dados.buscas.sem_resultado} chave={(b) => b.termo}
                nome={(b) => b.termo} valor={(b) => vezes(b.total)} />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              &quot;Sem resultado&quot; mostra o que os clientes procuram e ninguém oferece na plataforma.
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-green-900">Mais favoritados <span className="text-sm font-normal text-gray-500">(todos os tempos)</span></h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <Ranking titulo="Produtos" itens={dados.mais_favoritados.produtos} nome={(f) => f.nome} valor={(f) => vezes(f.total)} />
              <Ranking titulo="Serviços" itens={dados.mais_favoritados.servicos} nome={(f) => f.nome} valor={(f) => vezes(f.total)} />
              <Ranking titulo="Lojas" itens={dados.mais_favoritados.lojas} nome={(f) => f.nome} valor={(f) => vezes(f.total)} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
