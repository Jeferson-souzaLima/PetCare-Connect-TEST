// Slides do banner da home. Imagens no R2 em banners/home/ (ver spec, seção 7):
// versão mobile 750×500 (3:2) e desktop 1440×525.
// O slide "html" aceita uma foto opcional (metade direita, só do tablet para cima;
// arquivo ~1080×790 em banners/home/). Sem ela, mostra só o fundo verde e o texto.
export const SLIDES_HOME = [
  {
    id: "principal",
    tipo: "html",
    chip: "PetCare Connect",
    titulo: "Produtos e serviços para o seu pet,",
    destaque: "no mesmo lugar!",
    texto: "Compre o que seu pet precisa e agende serviços com as melhores lojas da sua região.",
    acoes: [
      { rotulo: "Comprar Produtos", destino: "/produtos", principal: true },
      { rotulo: "Agendar Serviços", destino: "/servicos", principal: false },
    ],
    // Foto decorativa (alt vazio): o título e os botões já dizem tudo. Sem o arquivo, fica só o verde.
    imagem: { desktop: "hero-passeio-desktop.webp", alt: "" },
  },
  {
    id: "promo-1",
    tipo: "imagem",
    arquivo: { mobile: "promo-1-mobile.webp", desktop: "promo-1-desktop.webp" },
    alt: "Lançamento exclusivo: nova linha Animalife, nutrição avançada para o seu pet.",
  },
  {
    id: "promo-2",
    tipo: "imagem",
    arquivo: { mobile: "promo-2-mobile.webp", desktop: "promo-2-desktop.webp" },
    alt: "Produtos para quem faz parte da família: encontre tudo o que seu pet precisa em um só lugar.",
  },
  {
    id: "promo-3",
    tipo: "imagem",
    arquivo: { mobile: "promo-3-mobile.webp", desktop: "promo-3-desktop.webp" },
    alt: "Felicity Prime: nutrição completa para seu melhor amigo, ingredientes selecionados e alta digestibilidade.",
  },
  {
    id: "promo-4",
    tipo: "imagem",
    arquivo: { mobile: "promo-4-mobile.webp", desktop: "promo-4-desktop.webp" },
    alt: "Novidades para o seu pet: produtos selecionados para mais conforto, diversão e bem-estar.",
  },
];

export const INTERVALO_SLIDES_MS = 6000;
