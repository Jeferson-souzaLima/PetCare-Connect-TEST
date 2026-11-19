import { useOutletContext } from "react-router-dom";
import AvisoLojaPendente from "@/components/perfil/AvisoLojaPendente";
import { AcoesRapidas } from "@/components/lojista/painel/AcoesRapidas";
import { AtalhosLojista } from "@/components/lojista/painel/AtalhosLojista";
import { BannerBoasVindas } from "@/components/lojista/painel/BannerBoasVindas";
import { CartoesIndicadores } from "@/components/lojista/painel/CartoesIndicadores";
import { FaixaDistribuidores } from "@/components/lojista/painel/FaixaDistribuidores";
import { GraficoVendas } from "@/components/lojista/painel/GraficoVendas";
import { ProximosAgendamentosLojista } from "@/components/lojista/painel/ProximosAgendamentosLojista";

/** Home da área do lojista. Os dados vêm do LayoutLojista (loja e painel). */
export default function PainelLojistaPage() {
  const { loja, painel } = useOutletContext();
  const carregando = painel.estado === "carregando";
  const dados = painel.dados;

  return (
    <div className="space-y-4 sm:space-y-5">
      <AvisoLojaPendente loja={loja} />
      <BannerBoasVindas />
      <AtalhosLojista />

      {painel.estado === "erro" && (
        <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          Não foi possível carregar os números da loja agora. Tente novamente em alguns instantes.
        </p>
      )}

      <CartoesIndicadores indicadores={dados?.indicadores} carregando={carregando} />

      <div className="grid gap-4 sm:gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <GraficoVendas vendasPorDia={dados?.vendas_por_dia} carregando={carregando} />
        </div>
        <div className="xl:col-span-5">
          <ProximosAgendamentosLojista itens={dados?.proximos_agendamentos} carregando={carregando} />
        </div>
        <div className="hidden md:block xl:col-span-7">
          <AcoesRapidas />
        </div>
        <div className="xl:col-span-5">
          <FaixaDistribuidores />
        </div>
      </div>
    </div>
  );
}
