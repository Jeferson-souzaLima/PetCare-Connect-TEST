# Nova home do cliente — especificação

- **Data:** 11/11/2026
- **Branch:** `feature/nova-home`, criada da `main` de produção `4a205c8`
- **Backup:** tag local `backup-antes-nova-home-2026-11-11`
- **Status:** aguardando aprovação. O celular está desenhado a partir do mockup; o desktop, a partir da descrição, até o mockup chegar.

## 1. Objetivo e critérios de sucesso

Redesenhar a página inicial do **cliente e do visitante** seguindo o mockup. Todos os dados vêm da API e do usuário logado.

A entrega está pronta quando:

1. A home fica visualmente próxima do mockup em 375, 768, 1280 e 1440 px.
2. Nenhuma outra página muda. As outras páginas e a área do lojista continuam idênticas pixel a pixel nas telas já cobertas pela comparação existente.
3. A home funciona e mostra estados adequados nestes casos:
   - visitante;
   - logado;
   - sem pets;
   - sem pedidos;
   - sem agendamentos;
   - API lenta;
   - API fora do ar.
4. Build, lint e testes passam, e não aparecem erros novos no console nem na rede.

## 2. Decisões já aprovadas

| Tema | Decisão |
| --- | --- |
| Alcance | O novo cabeçalho e a nova barra inferior valem **só na home do cliente**. A home do lojista, as outras páginas e os componentes compartilhados não mudam; quando preciso, crio uma variante para a home. |
| Carrinho no celular | Fica acessível pelo ícone do cabeçalho, porque a barra inferior da home não tem mais "Carrinho". |
| Sino de notificações, leitor de QR, cupons, "Indique e Ganhe" | Ficam escondidos. Nenhum componente falso é escrito. O cabeçalho e a coluna direita recebem os itens por listas de configuração, então ativar um recurso depois é só acrescentar um item. |
| Ofertas | Produtos reais, sem preço riscado e sem estrelas. |
| Categorias | 4 atalhos: Produtos, Serviços, Lojas e Clínicas. A categoria de produto vira tarefa separada; a migração é proposta (seção 9) e não executada. |
| Cidade | Mostra só a cidade atual, sem opção de troca. |
| Banner | Imagens otimizadas em WebP de até cerca de 300 KB, servidas pelo R2. Nenhum arquivo grande entra em commit. |

## 3. Arquitetura

### 3.1 Roteamento

Hoje `/` fica dentro do `Layout` compartilhado (`Header` + `MobileBottomNav`), e o `HomeRoute` escolhe entre a home do lojista e a do cliente.

- `HomeRoute` passa a renderizar:
  - lojista: `<Layout><HomeLojistaPage /></Layout>`, exatamente como hoje;
  - cliente ou visitante: `<NovaHomePage />`, com estrutura própria.
- **Única mudança em código compartilhado:** `Layout` passa a aceitar `children` (`{children ?? <Outlet />}`). As rotas que já usam `Outlet` continuam iguais.
- A rota `/` sai de dentro do grupo do `Layout` e passa a usar o `HomeRoute` acima.

### 3.2 Estrutura da página (`components/home/`)

```
NovaHomePage
├── HomeShell                  grade: cabeçalho / [menu lateral] / conteúdo / [coluna direita] / barra inferior
│   ├── HomeHeader             logo, CidadeAtual, BuscaHome, AcoesCabecalho (favoritos, carrinho, menu do usuário)
│   ├── HomeSidebar            só a partir de lg (1024 px): navegação + "Para Lojistas"
│   ├── HomeAside              só a partir de xl (1280 px): MeusPetsResumo, ProximosAgendamentos, PedidosRecentes
│   └── HomeBottomNav          só abaixo de md (768 px): Início, Explorar, Agendamentos, Pedidos, Conta
└── conteúdo central
    ├── HeroCarousel           slides em HTML e imagem, com controles
    ├── AtalhosCategorias      Produtos · Serviços · Lojas · Clínicas
    ├── CardsDestaque          "Agende serviços" + "Lojas perto de você"
    ├── VitrineProdutos        carrossel horizontal com ProdutoCardHome
    └── ExplorarCatalogo       a listagem atual (abas Produtos/Lojas/Serviços por localização), extraída do HomePage sem mudar o comportamento
```

- Cada componente fica num arquivo pequeno, com responsabilidade única.
- Os dados de cada bloco vêm de hooks próprios (`useResumoCliente`, `useVitrineHome`). Os componentes de apresentação só recebem props.

### 3.3 Preservar o que a home faz hoje

A home atual é também o **catálogo por localização**: abas Produtos, Lojas e Serviços com a lista completa.

- Essa parte vira o componente `ExplorarCatalogo`, na âncora `#explorar`, logo abaixo da vitrine. A lógica é movida sem alteração.
- Os atalhos, os botões do banner, o "Ver mais" e o Explorar da barra inferior levam a `/?categoria=<aba>#explorar`, que continua funcionando como hoje.
- Assim nenhuma funcionalidade da home atual se perde.

## 4. Origem dos dados

| Bloco | Origem | Sem login | Vazio | Erro ou lento |
| --- | --- | --- | --- | --- |
| Cidade atual | Endereço salvo no perfil (`cidade`/`uf`). Não há geocodificação reversa no sistema | Com a localização do navegador liberada: "Perto de você"; sem ela: "Definir localização" (leva ao login) | Logado sem endereço: "Definir localização" (leva a `/perfil`) | Esqueleto, depois "Definir localização" |
| Busca | Navega para `/busca?q=` | Igual | — | — |
| Favoritos | Link para `/favoritos` (rota protegida) | Vai para o login | — | — |
| Carrinho | `CarrinhoContext` (contador) | Igual | Sem selo de contagem | — |
| Banner | Configuração local de slides + imagens do R2 | Igual | — | Sem `VITE_MEDIA_URL` ou se a imagem falhar: o slide em HTML aparece com fundo em gradiente e os slides só de imagem são escondidos |
| Atalhos | Fixos | Igual | — | — |
| "Lojas perto de você" | Link para `#explorar` na aba Lojas | Igual | — | — |
| Vitrine | `buscarConteudoPorLocalizacao` (mesmo fluxo de hoje); sem localização, `GET /produtos` | Igual | Bloco escondido | Esqueleto; no erro, o bloco some e o resto da página continua |
| Meus Pets | `GET /pets` | Card "Entre para ver seus pets" | "Cadastre seu pet" (vai para `/perfil`) | Esqueleto / mensagem curta |
| Próximos Agendamentos | `GET /agendamentos/meus` filtrado no navegador (futuros, ordem de data, até 3) | Escondido | "Nenhum agendamento" + link para serviços | Idem |
| Pedidos recentes | `GET /pedidos/meus` (até 3, mais recentes) | Escondido | "Nenhum pedido ainda" | Idem |

**Nenhum endpoint novo e nenhuma mudança no banco nesta tarefa.**

## 5. Visual e tokens de design

Os tokens ficam em `tailwind.config.js` (`theme.extend`), com prefixo `pc`. Nenhum componente usa valor solto.

- **Cores:** medidas no mockup e ajustadas para contraste AA.

  | Token | Valor | Uso |
  | --- | --- | --- |
  | `pc-verde-900` | `#023F1E` | Cabeçalho |
  | `pc-verde-700` | `#0B5A24` | Botões e item ativo |
  | `pc-lima` | `#BFF837` | Destaque e CTA principal |
  | `pc-fundo` | `#F8F8F8` | Fundo da página |
  | `pc-pessego` | `#F9E2D0` | Card "Agende serviços" |
  | `pc-verde-100` | `#E6F2E1` | Card "Lojas perto de você" |
  | `pc-texto` | `#212121` | Texto |

- **Formas:**
  - raios `rounded-pc-card` (16 px) e `rounded-pc-pill`;
  - sombra `shadow-pc-card`;
  - espaçamentos com a escala padrão do Tailwind (4 px).
- **Fonte:** a atual do projeto.
- **Ícones:** `lucide-react`, que já está instalado.

## 6. Acessibilidade

- Contraste AA em todos os textos, conferido por script na validação.
- Imagens com `alt`; imagens decorativas com `alt=""`.
- Foco visível com `ring` em todos os itens que recebem clique.
- Ordem de tabulação: cabeçalho → menu lateral → conteúdo → coluna direita.
- **Carrossel:**
  - botão de pausa visível;
  - pausa ao passar o mouse e ao receber foco;
  - setas e pontos como `<button>`, com `aria-label`;
  - `aria-roledescription="carousel"` e `aria-live="off"` enquanto passa sozinho;
  - sem troca automática se o usuário pede menos movimento (`prefers-reduced-motion`);
  - navegação por teclado com ← e →.
- Áreas de toque de no mínimo 44 px no celular.

## 7. Imagens do banner no R2

- Os arquivos são gerados localmente para teste e **não entram em commit** (`.gitignore`).
- Quem tem acesso envia ao bucket com estes nomes:

  | Arquivo | Uso | Tamanho |
  | --- | --- | --- |
  | `banners/home/hero-pets-mobile.webp` | Imagem do slide principal (pets), celular | 750 px de largura |
  | `banners/home/hero-pets-desktop.webp` | Idem, desktop | 1200 px |
  | `banners/home/promo-1-desktop.webp` … `promo-4-desktop.webp` | Banners promocionais atuais (texto dentro da imagem) | 1440 × 525 |

- Os banners promocionais aparecem **só a partir de 768 px**: no celular, o texto embutido ficaria ilegível.
- **A foto de pets do slide principal precisa ser fornecida por vocês.** Não há hoje uma imagem sem texto e sem marca d'água. Até lá, o slide usa só o gradiente verde.
- Variável nova na Vercel: `VITE_MEDIA_URL` (URL pública do bucket, igual a `R2_PUBLIC_URL`; não é segredo).
- `getMediaUrl` não muda. A home monta a URL completa a partir de `VITE_MEDIA_URL`.

## 8. Testes

- **Funções puras:** filtro de próximos agendamentos, escolha da cidade e montagem das URLs. Escritas com TDD e testadas com `node --test`, que já vem no Node, sem instalar framework.
- **Playwright com API simulada:**
  - os 7 estados da seção 1, em 375, 768, 1280 e 1440 px;
  - comparação lado a lado com o mockup;
  - console e rede sem erro.
- **Regressão:**
  - roteiro de comparação pixel a pixel nas outras páginas e na área do lojista contra o build de produção;
  - `HomeLojistaPage` precisa ficar idêntica.
- **Build, lint** (o ESLint do frontend voltou a funcionar no PR #7) e testes do backend, comparando com antes.
- **Revisão final** com `requesting-code-review`.

## 9. Fora do escopo (tarefas separadas propostas)

| Tarefa | Precisa de |
| --- | --- |
| Categoria de produto | Migração (rascunho em `database/migrations/rascunhos/`, não executada): tabela `categorias_produto` (id, nome, slug, icone) + coluna `produtos.categoria_id` NULL com FK; filtro `GET /produtos?categoria=`; campo no cadastro de produto do lojista |
| Preço promocional | Colunas `preco_promocional` e `promocao_ate` em `produtos`; regra no checkout para cobrar o menor preço válido |
| Avaliações | Tabela de avaliações ligada a pedido entregue, para impedir avaliação falsa |
| Notificações | Tabela de notificações + endpoint de leitura; ícone com contador |
| Cupons e indicação | Regras de negócio a definir; envolvem pagamento |
| Troca de cidade | Lista de cidades atendidas, ou busca por CEP |
| Novo visual no resto do site | Segunda tarefa, depois de a home ser aprovada |

## 10. Riscos

| Risco | Mitigação |
| --- | --- |
| Perder funções da home atual ao trocar o layout | `ExplorarCatalogo` move o código atual sem mudar a lógica; teste de regressão no catálogo |
| A mudança no `Layout` afetar outras páginas | Mudança mínima (`children ?? <Outlet />`) + comparação pixel a pixel |
| O título "Ofertas" sugerir desconto que não existe (CDC) | Usar **"Destaques perto de você"** até existir preço promocional. Pendente de confirmação. |
| Mockup do desktop ausente | O layout desktop segue a descrição e é ajustado quando o mockup chegar |
