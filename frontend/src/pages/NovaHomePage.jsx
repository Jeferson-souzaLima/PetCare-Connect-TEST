import { Footer } from "@/components/layout/Footer";
import { AtalhosCategorias } from "@/components/home/AtalhosCategorias";
import { CardsDestaque } from "@/components/home/CardsDestaque";
import { ExplorarCatalogo } from "@/components/home/ExplorarCatalogo";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { HomeAside } from "@/components/home/HomeAside";
import { HomeBottomNav } from "@/components/home/HomeBottomNav";
import { HomeHeader } from "@/components/home/HomeHeader";
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
  const coords =
    catalogo.latitude && catalogo.longitude ? { latitude: catalogo.latitude, longitude: catalogo.longitude } : null;

  return (
    <div className="min-h-screen bg-pc-fundo text-pc-texto">
      <a
        href="#conteudo-home"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pc-pill focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-pc-verde-900 focus:shadow-pc-card"
      >
        Pular para o conteúdo
      </a>

      <HomeHeader usuario={usuario} logout={logout} coords={coords} carregandoLocalizacao={catalogo.geoLoading} />

      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 pb-4 pt-4 md:px-6">
        <HomeSidebar />

        <main id="conteudo-home" className="min-w-0 flex-1 space-y-5">
          <HeroCarousel />
          <AtalhosCategorias />
          <CardsDestaque />
          <VitrineProdutos
            produtos={catalogo.produtos}
            carregando={catalogo.loadingDados && catalogo.selectedCategory === "produtos"}
            logado={Boolean(usuario)}
          />
        </main>

        <HomeAside resumo={resumo} logado={usuario?.tipo === "cliente"} />
      </div>

      {/* Catálogo na largura total, no mesmo contêiner da home anterior (max-w-7xl),
          para os cards compartilhados manterem o tamanho original. */}
      <div className="mx-auto w-full max-w-7xl pb-28 md:pb-10">
        <ExplorarCatalogo catalogo={catalogo} />
      </div>

      <Footer />
      <HomeBottomNav />
    </div>
  );
}
