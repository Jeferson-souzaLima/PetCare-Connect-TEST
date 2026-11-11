// Slides do banner da home. Imagens no R2 em banners/home/ (ver spec, seção 7).
// O slide "html" aceita uma foto opcional: preencha `imagem` quando a foto
// licenciada for enviada ao R2. Sem ela, mostra só o fundo verde e o texto.
export const SLIDES_HOME = [
  {
    id: "principal",
    tipo: "html",
    chip: "PetCare Connect",
    titulo: "Produtos e serviços para o seu pet,",
    destaque: "no mesmo lugar!",
    texto: "Compre o que seu pet precisa e agende serviços com as melhores lojas da sua região.",
    acoes: [
      { rotulo: "Comprar Produtos", destino: "/?categoria=produtos#explorar", principal: true },
      { rotulo: "Agendar Serviços", destino: "/?categoria=servicos#explorar", principal: false },
    ],
    imagem: null, // ex.: { mobile: "hero-pets-mobile.webp", desktop: "hero-pets-desktop.webp", alt: "" }
  },
  {
    id: "promo-1",
    tipo: "imagem",
    arquivo: "promo-1-desktop.webp",
    alt: "Lançamento exclusivo: nova linha Animalife, nutrição avançada para o seu pet.",
  },
  {
    id: "promo-2",
    tipo: "imagem",
    arquivo: "promo-2-desktop.webp",
    alt: "Produtos para quem faz parte da família: encontre tudo o que seu pet precisa em um só lugar.",
  },
  {
    id: "promo-3",
    tipo: "imagem",
    arquivo: "promo-3-desktop.webp",
    alt: "Felicity Prime: nutrição completa para seu melhor amigo, ingredientes selecionados e alta digestibilidade.",
  },
  {
    id: "promo-4",
    tipo: "imagem",
    arquivo: "promo-4-desktop.webp",
    alt: "Novidades para o seu pet: produtos selecionados para mais conforto, diversão e bem-estar.",
  },
];

export const INTERVALO_SLIDES_MS = 6000;
