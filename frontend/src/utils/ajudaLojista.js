import { normalizarTexto } from "./formatadores.js";

/*
 * Conteúdo da Central de Ajuda do lojista. Os números (comissão, prazos,
 * limites) seguem as regras do backend: Config/financeiro.js,
 * pedidosController, agendamentosController e uploadMiddleware.
 * Ao mudar uma dessas regras, atualize o texto aqui.
 */

export const EMAIL_SUPORTE = "contato@petcareconnect.com.br";

export const TOPICOS_AJUDA = [
  { id: "comecar", rotulo: "Primeiros passos" },
  { id: "recebimentos", rotulo: "Recebimentos e comissão" },
  { id: "pedidos", rotulo: "Pedidos e entrega" },
  { id: "agenda", rotulo: "Agendamentos" },
  { id: "estornos", rotulo: "Cancelamentos e estornos" },
  { id: "catalogo", rotulo: "Produtos e serviços" },
  { id: "conta", rotulo: "Conta e segurança" },
];

export const ARTIGOS_AJUDA = [
  // ---------- Primeiros passos
  {
    id: "loja-nao-aparece",
    topico: "comecar",
    pergunta: "Minha loja ainda não aparece para os clientes. Por quê?",
    resposta: [
      "Toda loja nova passa por uma aprovação da equipe PetCare Connect. Enquanto isso, o painel mostra o aviso \"Sua loja está aguardando aprovação\".",
      "Você não precisa esperar para se preparar: já dá para preencher os dados da loja, cadastrar produtos e serviços e configurar a agenda. Assim que a loja for aprovada, tudo fica visível para os clientes.",
      "Se a loja for suspensa, ela deixa de aparecer na plataforma até ser reativada. Nesse caso, fale com o suporte.",
    ],
  },
  {
    id: "checklist-inicio",
    topico: "comecar",
    pergunta: "O que preciso configurar antes de começar a vender?",
    resposta: [
      "1. Dados da loja: endereço, telefone, apresentação e imagem, em Configurações.",
      "2. Recebimentos: conecte sua conta Mercado Pago, também em Configurações. Sem ela, a loja não recebe pedidos nem agendamentos pagos.",
      "3. Catálogo: cadastre seus produtos e serviços.",
      "4. Agenda: se você oferece serviços, defina os dias e horários de atendimento.",
      "5. Entrega: se você entrega, ative a entrega e informe as taxas e o raio de atendimento.",
    ],
    link: { rotulo: "Ir para Configurações", destino: "/lojista/perfil" },
  },

  // ---------- Recebimentos e comissão
  {
    id: "conectar-mercado-pago",
    topico: "recebimentos",
    pergunta: "Por que preciso conectar uma conta Mercado Pago?",
    resposta: [
      "Os pagamentos dos clientes caem direto na sua conta Mercado Pago. A PetCare Connect não recebe nem guarda o dinheiro das suas vendas.",
      "Para conectar, abra Configurações e use o quadro Recebimentos. Se você desconectar a conta, a loja deixa de receber pedidos e agendamentos pagos até conectar uma conta de novo.",
    ],
    link: { rotulo: "Conectar o Mercado Pago", destino: "/lojista/perfil" },
  },
  {
    id: "comissao",
    topico: "recebimentos",
    pergunta: "Quanto a PetCare Connect cobra por venda?",
    resposta: [
      "A comissão é de 8% sobre os produtos de um pedido e de 10% sobre o valor dos serviços agendados. O frete fica inteiro com você, sem comissão.",
      "A comissão é separada automaticamente no momento do pagamento. Você não precisa pagar boleto nem fazer transferência para a PetCare.",
      "Exemplo: um pedido com R$ 100,00 em produtos e R$ 10,00 de frete gera R$ 8,00 de comissão. Você recebe R$ 102,00, menos a tarifa do Mercado Pago.",
    ],
  },
  {
    id: "tarifa-mercado-pago",
    topico: "recebimentos",
    pergunta: "Como funciona a tarifa do Mercado Pago?",
    resposta: [
      "A tarifa do Mercado Pago é cobrada na sua conta, de acordo com o plano de recebimento escolhido por você no Mercado Pago. Em geral, receber na hora custa mais do que esperar alguns dias.",
      "O prazo em que o dinheiro fica disponível também é definido no Mercado Pago. Acompanhe os valores a liberar pelo aplicativo ou pelo site do Mercado Pago.",
    ],
  },
  {
    id: "formas-pagamento",
    topico: "recebimentos",
    pergunta: "Quais formas de pagamento os clientes podem usar?",
    resposta: [
      "Cartão de crédito, cartão de débito, Pix, saldo em conta Mercado Pago e Linha de Crédito do Mercado Pago.",
      "Boleto e pagamento em lotérica não são aceitos. Eles levam dias para compensar, e a reserva do pedido ou do horário vale só por alguns minutos.",
      "No cartão de crédito, o cliente pode parcelar. Mesmo assim, você recebe o valor total da venda no prazo do seu plano, e não parcela por parcela.",
    ],
  },
  {
    id: "prazo-pagamento",
    topico: "recebimentos",
    pergunta: "Quanto tempo o cliente tem para pagar?",
    resposta: [
      "Pedido: os produtos ficam reservados por 10 minutos. Se o pagamento não for aprovado nesse prazo, a reserva é cancelada e o estoque volta para a loja.",
      "Agendamento: o cliente tem 30 minutos para pagar. Depois disso, o horário volta a ficar livre na sua agenda.",
    ],
  },
  {
    id: "relatorios",
    topico: "recebimentos",
    pergunta: "Onde vejo quanto vendi e quanto vou receber?",
    resposta: [
      "Em Relatórios você vê as vendas do mês, ou de outro período, com o total vendido, a comissão da PetCare, a tarifa do Mercado Pago e o seu valor líquido. Vendas estornadas aparecem com líquido zero.",
      "O saldo disponível para saque e as datas de liberação ficam na sua conta Mercado Pago.",
    ],
    link: { rotulo: "Abrir Relatórios", destino: "/lojista/relatorios" },
  },

  // ---------- Pedidos e entrega
  {
    id: "etapas-pedido",
    topico: "pedidos",
    pergunta: "Quais são as etapas de um pedido?",
    resposta: [
      "Aguardando pagamento → Pago → Em preparo → Pronto para retirada ou Em entrega → Entregue.",
      "Depois que o pagamento é aprovado, cada etapa seguinte é atualizada por você, em Pedidos. O cliente acompanha as mudanças pela conta dele.",
    ],
    link: { rotulo: "Abrir Pedidos", destino: "/lojista/pedidos" },
  },
  {
    id: "cliente-cancela-pedido",
    topico: "pedidos",
    pergunta: "O cliente pode cancelar um pedido?",
    resposta: [
      "Sim, enquanto o pedido estiver como Aguardando pagamento ou Pago. Se o pedido já foi pago, o valor é devolvido automaticamente ao cliente e os produtos voltam para o estoque.",
      "Depois que você coloca o pedido Em preparo, o cliente não consegue mais cancelar por conta própria.",
    ],
  },
  {
    id: "loja-cancela-pedido",
    topico: "pedidos",
    pergunta: "Preciso cancelar um pedido pago. Como faço?",
    resposta: [
      "O cancelamento de pedidos pagos é feito pela equipe PetCare Connect. Isso protege o cliente e garante que o valor seja devolvido corretamente.",
      "Envie um e-mail ao suporte com o número do pedido e o motivo. O valor volta ao cliente pelo Mercado Pago e é descontado da sua conta.",
    ],
  },
  {
    id: "frete",
    topico: "pedidos",
    pergunta: "Como é calculado o frete?",
    resposta: [
      "Em Configurações, na parte Entrega, você define uma taxa fixa, um valor por quilômetro e o raio máximo de entrega.",
      "A distância é medida em linha reta, da loja até o endereço do cliente. Clientes fora do raio não conseguem pedir entrega da sua loja.",
    ],
    link: { rotulo: "Configurar entrega", destino: "/lojista/perfil" },
  },

  // ---------- Agendamentos
  {
    id: "configurar-horarios",
    topico: "agenda",
    pergunta: "Como configuro meus dias e horários de atendimento?",
    resposta: [
      "Em Agendamentos, abra Configurações da agenda. Para cada dia da semana, escolha se atende, o horário de início e de fim e, se quiser, um intervalo, como o de almoço.",
      "Os clientes só conseguem agendar nos horários livres dentro dessa configuração.",
    ],
    link: { rotulo: "Configurar a agenda", destino: "/lojista/agenda/configuracoes" },
  },
  {
    id: "etapas-agendamento",
    topico: "agenda",
    pergunta: "Quais são as etapas de um agendamento?",
    resposta: [
      "Aguardando pagamento → Confirmado → Em atendimento → Concluído.",
      "Na hora do atendimento, marque Em atendimento e, ao terminar, Concluído. Um agendamento também pode ser cancelado pelo cliente ou pela loja.",
    ],
    link: { rotulo: "Abrir Agendamentos", destino: "/lojista/agenda" },
  },
  {
    id: "loja-cancela-agendamento",
    topico: "agenda",
    pergunta: "Posso cancelar um agendamento?",
    resposta: [
      "Sim, enquanto ele estiver Confirmado. Se o cliente pagou online, o valor é devolvido automaticamente pelo Mercado Pago e é descontado da sua conta.",
      "Agendamentos pagos online não podem ser excluídos, só cancelados, para que o cliente sempre receba o dinheiro de volta.",
    ],
  },
  {
    id: "cliente-cancela-agendamento",
    topico: "agenda",
    pergunta: "Até quando o cliente pode cancelar?",
    resposta: [
      "O cliente pode cancelar até o horário marcado começar. Se ele pagou online, recebe o valor de volta automaticamente.",
    ],
  },
  {
    id: "agendamento-manual",
    topico: "agenda",
    pergunta: "Posso registrar um agendamento feito por telefone ou no balcão?",
    resposta: [
      "Sim. Em Agendamentos, use Novo Agendamento. O horário fica reservado na agenda e não aparece mais como livre para outros clientes.",
      "Esse agendamento não tem pagamento online: a cobrança é combinada diretamente com o cliente e não gera comissão.",
    ],
    link: { rotulo: "Abrir Agendamentos", destino: "/lojista/agenda" },
  },

  // ---------- Cancelamentos e estornos
  {
    id: "de-onde-sai-estorno",
    topico: "estornos",
    pergunta: "De onde sai o dinheiro de um estorno?",
    resposta: [
      "O cliente recebe de volta o valor integral, na mesma forma de pagamento. O valor sai da sua conta Mercado Pago, e a comissão da PetCare Connect também é devolvida.",
      "O Mercado Pago não cobra tarifa de pagamento devolvido. Por isso, num estorno total você não tem prejuízo além da venda desfeita.",
    ],
  },
  {
    id: "estorno-recusado",
    topico: "estornos",
    pergunta: "Recebi um e-mail dizendo que um estorno foi recusado. O que faço?",
    resposta: [
      "Na maioria das vezes, o motivo é falta de saldo disponível na sua conta Mercado Pago. Deixe saldo suficiente na conta.",
      "Quando o cancelamento foi pedido por alguém, a venda continua ativa e o cancelamento pode ser tentado de novo.",
      "Quando o valor precisa obrigatoriamente voltar ao cliente, por exemplo num pagamento aprovado depois do prazo, o sistema tenta de novo sozinho a cada 30 minutos.",
      "Você recebe no máximo um aviso a cada 6 horas por pagamento. Se o problema continuar, fale com o suporte.",
    ],
  },
  {
    id: "pagamento-fora-prazo",
    topico: "estornos",
    pergunta: "O que acontece se o cliente pagar depois do prazo?",
    resposta: [
      "Se o pagamento for aprovado depois que a reserva expirou, o pedido ou horário não é confirmado e o valor é devolvido automaticamente ao cliente. Assim, ninguém paga por um produto sem estoque ou por um horário que já foi para outra pessoa.",
    ],
  },

  // ---------- Produtos e serviços
  {
    id: "cadastrar-produto",
    topico: "catalogo",
    pergunta: "Como cadastro um produto?",
    resposta: [
      "Em Produtos, clique em Novo Produto, preencha nome, descrição, preço e estoque e salve.",
      "Você pode enviar até 10 imagens por vez, de até 5 MB cada, e escolher qual delas é a principal. A imagem principal aparece nas buscas e na vitrine da loja.",
    ],
    link: { rotulo: "Abrir Produtos", destino: "/lojista/produtos" },
  },
  {
    id: "cadastrar-servico",
    topico: "catalogo",
    pergunta: "Como cadastro um serviço?",
    resposta: [
      "Em Serviços, clique em Novo Serviço e informe nome, descrição, duração e preço. A duração define quanto tempo de agenda cada atendimento ocupa.",
    ],
    link: { rotulo: "Abrir Serviços", destino: "/lojista/servicos" },
  },
  {
    id: "editar-catalogo",
    topico: "catalogo",
    pergunta: "Posso editar um produto ou serviço já cadastrado?",
    resposta: [
      "Sim. Em Produtos ou Serviços, clique no ícone de lápis do item. As mudanças valem para os próximos pedidos e agendamentos. Vendas já feitas mantêm o preço da hora da compra.",
    ],
  },

  // ---------- Conta e segurança
  {
    id: "esqueci-senha",
    topico: "conta",
    pergunta: "Esqueci minha senha. O que faço?",
    resposta: [
      "Na tela de login, use \"Esqueci minha senha\" e informe seu e-mail. O link para criar uma nova senha vale por 60 minutos.",
      "Ao trocar a senha, todos os aparelhos conectados à sua conta são desconectados, inclusive os que usavam \"Manter conectado\".",
    ],
  },
  {
    id: "manter-conectado",
    topico: "conta",
    pergunta: "Como funciona o \"Manter conectado\"?",
    resposta: [
      "Com essa opção marcada no login, você continua conectado naquele aparelho por até 30 dias. Use só em aparelhos pessoais.",
      "Se perder um aparelho ou desconfiar de acesso indevido, troque a senha: todas as sessões abertas são encerradas na hora.",
    ],
  },
];

/**
 * Artigos do tópico escolhido (ou de todos) que contêm todas as palavras
 * buscadas, na pergunta ou na resposta. Ignora acentos e maiúsculas.
 */
export function filtrarArtigos(artigos, { termo = "", topico = null } = {}) {
  const palavras = normalizarTexto(termo).split(/\s+/).filter((palavra) => palavra.length >= 2);

  return artigos.filter((artigo) => {
    if (topico && artigo.topico !== topico) return false;
    if (!palavras.length) return true;
    const texto = normalizarTexto([artigo.pergunta, ...artigo.resposta].join(" "));
    return palavras.every((palavra) => texto.includes(palavra));
  });
}
