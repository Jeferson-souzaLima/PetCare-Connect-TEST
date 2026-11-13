// Slides do banner da home. Imagens no R2 em banners/home/ (ver spec, seção 7):
// versão mobile 3:2 (1125×750) e desktop 1440×525. O banner inteiro é um link para `destino`,
// porque o botão desenhado na arte ("Agendar agora", "Ver produtos"...) precisa funcionar.
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
    imagem: { desktop: "hero-pets-desktop.webp", alt: "" },
  },
  {
    id: "banho-tosa",
    tipo: "imagem",
    arquivo: { mobile: "banho-tosa-mobile.webp", desktop: "banho-tosa-desktop.webp" },
    alt: "Banho e tosa sem fila: agende pelo PetCare Connect.",
    destino: "/servicos?tipo=banho_tosa",
  },
  {
    id: "racao",
    tipo: "imagem",
    arquivo: { mobile: "racao-mobile.webp", desktop: "racao-desktop.webp" },
    alt: "Ração e petiscos perto de você: ver produtos.",
    destino: "/produtos",
  },
  {
    id: "vacinas",
    tipo: "imagem",
    arquivo: { mobile: "vacinas-mobile.webp", desktop: "vacinas-desktop.webp" },
    alt: "Vacinas em dia, pet feliz: encontre clínicas e agende a consulta.",
    destino: "/servicos?tipo=saude",
  },
  {
    id: "vender",
    tipo: "imagem",
    arquivo: { mobile: "vender-mobile.webp", desktop: "vender-desktop.webp" },
    alt: "Tem um pet shop? Venda no PetCare Connect: cadastre sua loja grátis.",
    destino: "/register-lojista",
  },
  {
    id: "promo-1",
    tipo: "imagem",
    arquivo: { mobile: "promo-1-mobile.webp", desktop: "promo-1-desktop.webp" },
    destino: "/produtos",
    alt: "Lançamento exclusivo: nova linha Animalife, nutrição avançada para o seu pet.",
  },
  {
    id: "promo-2",
    tipo: "imagem",
    arquivo: { mobile: "promo-2-mobile.webp", desktop: "promo-2-desktop.webp" },
    destino: "/produtos",
    alt: "Produtos para quem faz parte da família: encontre tudo o que seu pet precisa em um só lugar.",
  },
  {
    id: "promo-3",
    tipo: "imagem",
    arquivo: { mobile: "promo-3-mobile.webp", desktop: "promo-3-desktop.webp" },
    destino: "/produtos",
    alt: "Felicity Prime: nutrição completa para seu melhor amigo, ingredientes selecionados e alta digestibilidade.",
  },
  {
    id: "promo-4",
    tipo: "imagem",
    arquivo: { mobile: "promo-4-mobile.webp", desktop: "promo-4-desktop.webp" },
    destino: "/produtos",
    alt: "Novidades para o seu pet: produtos selecionados para mais conforto, diversão e bem-estar.",
  },
];

export const INTERVALO_SLIDES_MS = 6000;
