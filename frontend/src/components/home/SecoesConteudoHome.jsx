import { Scissors, Sparkles, Store } from "lucide-react";
import { LojaCard } from "@/components/cards/LojaCard";
import { ServicoCard } from "@/components/cards/ServicoCard";
import { useConteudoHome } from "@/hooks/useConteudoHome";
import { FaixaHome } from "./FaixaHome";
import { ProdutoCardHome } from "./ProdutoCardHome";

/**
 * Mistura de conteúdo da home: lojas, produtos em destaque e serviços, cada faixa com "Ver mais"
 * para a sua página. "Perto de você" só quando a faixa veio da localização escolhida.
 * (Sem preço promocional no banco, a faixa de produtos é "Destaques", não "Ofertas da Semana".)
 */
export function SecoesConteudoHome({ logado }) {
  const { lojas, produtos, servicos, tentarDeNovo } = useConteudoHome();

  return (
    <>
      <FaixaHome
        titulo={lojas.perto ? "Lojas perto de você" : "Lojas parceiras"}
        icone={Store}
        verMais="/lojas"
        faixa={lojas}
        larguraItem="w-64"
        alturaEsqueleto="h-24"
        vazio="Ainda não há lojas para mostrar."
        aoTentarDeNovo={tentarDeNovo}
        renderItem={(loja) => <LojaCard loja={loja} className="h-full" />}
      />
      <FaixaHome
        titulo={produtos.perto ? "Destaques perto de você" : "Destaques"}
        icone={Sparkles}
        verMais="/produtos"
        faixa={produtos}
        larguraItem="w-40 sm:w-48"
        alturaEsqueleto="h-60"
        vazio="Ainda não há produtos para mostrar."
        aoTentarDeNovo={tentarDeNovo}
        renderItem={(produto) => <ProdutoCardHome produto={produto} logado={logado} />}
      />
      <FaixaHome
        titulo={servicos.perto ? "Serviços perto de você" : "Serviços disponíveis"}
        icone={Scissors}
        verMais="/servicos"
        faixa={servicos}
        larguraItem="w-72"
        alturaEsqueleto="h-36"
        vazio="Ainda não há serviços para mostrar."
        aoTentarDeNovo={tentarDeNovo}
        renderItem={(servico) => <ServicoCard servico={servico} className="h-full" />}
      />
    </>
  );
}
