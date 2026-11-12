import { Footer } from "@/components/layout/Footer";
import { AtalhosCategorias } from "@/components/home/AtalhosCategorias";
import { CardsDestaque } from "@/components/home/CardsDestaque";
import { ExplorarCatalogo } from "@/components/home/ExplorarCatalogo";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeAside } from "@/components/home/HomeAside";
import { HomeHeader } from "@/components/home/HomeHeader";
import { BarraInferiorCliente } from "@/components/navigation/BarraInferiorCliente";
import { HomeSidebar } from "@/components/home/HomeSidebar";
import { VitrineProdutos } from "@/components/home/VitrineProdutos";
import { useAuth } from "@/hooks/useAuth";
import { useCatalogoHome } from "@/hooks/useCatalogoHome";
import { useResumoCliente } from "@/hooks/useResumoCliente";

/** Home do cliente e do visitante. A home do lojista continua em HomeLojistaPage. */
export default function NovaHomePage() {
  const { usuario, logout } = useAuth();
  const catalogo = useCatalogoHome();
  const resumo = useResumoCliente();

  return (
    // Celular: espaço no fim da página = altura da barra inferior flutuante (~66 px), a distância
    // dela até a borda (12 px), uma folga e a safe-area; nada fica escondido atrás da barra.
    // O fundo do topo é verde no celular: enquanto a folha sobe, o que aparece atrás dela é o verde.
    <div className="min-h-screen bg-pc-fundo pb-[calc(7rem+env(safe-area-inset-bottom))] text-pc-texto max-md:bg-[linear-gradient(to_bottom,#0B5A24_0,#0B5A24_60vh,#F8F8F8_60vh)] md:pb-0">
      <a
        href="#conteudo-home"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pc-pill focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-pc-verde-900 focus:shadow-pc-card"
      >
        Pular para o conteúdo
      </a>

      <HomeHeader usuario={usuario} logout={logout} />

      {/* Celular: a página é uma folha clara de cantos arredondados que sobe sobre o verde do
          cabeçalho ao abrir (sem animação com "reduzir movimento"). O banner fica no topo da
          folha e avança sobre o fim do verde. A partir de 768 px o layout é o de antes. */}
      <main
        id="conteudo-home"
        className="max-md:relative max-md:-mt-7 max-md:rounded-t-[28px] max-md:bg-pc-fundo max-md:motion-safe:animate-pc-folha"
      >
        <h1 className="sr-only">PetCare Connect: produtos e serviços para o seu pet</h1>

        <div className="mx-auto flex max-w-[1440px] gap-6 px-4 pb-4 pt-0 md:px-6 md:pt-4">
          <HomeSidebar />

          <div className="min-w-0 flex-1 space-y-5">
            <div className="relative max-md:-mt-7">
              <HeroCarousel />
            </div>
            <AtalhosCategorias />
            <CardsDestaque />
            <VitrineProdutos
              produtos={catalogo.produtos}
              carregando={catalogo.loadingDados && catalogo.selectedCategory === "produtos"}
              logado={Boolean(usuario)}
              porProximidade={catalogo.modoBuscaProdutos === "proximidade"}
            />
          </div>

          <HomeAside resumo={resumo} logado={usuario?.tipo === "cliente"} />
        </div>

        {/* Catálogo na largura total, no mesmo contêiner da home anterior (max-w-7xl),
            para os cards compartilhados manterem o tamanho original. */}
        <div className="mx-auto w-full max-w-7xl md:pb-10">
          <ExplorarCatalogo catalogo={catalogo} />
        </div>
      </main>

      <Footer />
      <BarraInferiorCliente />
    </div>
  );
}
