import {
  Boxes,
  CalendarDays,
  ChartColumn,
  Headset,
  House,
  Megaphone,
  Package,
  PackageCheck,
  Scissors,
  Settings,
  Truck,
  Users,
} from "lucide-react";

export const INICIO_LOJISTA = "/perfil-lojista";

/*
 * Menu da área do lojista. "emBreve" marca o que ainda não tem funcionalidade:
 * aparece no menu, mas não navega. "contador" liga o item a uma pendência do painel.
 */
export const ITENS_PRINCIPAIS = [
  { id: "painel", rotulo: "Painel Principal", icone: House, destino: INICIO_LOJISTA },
  { id: "produtos", rotulo: "Produtos", icone: Package, destino: "/lojista/produtos" },
  { id: "servicos", rotulo: "Serviços", icone: Scissors, destino: "/lojista/servicos" },
  { id: "pedidos", rotulo: "Pedidos", icone: PackageCheck, destino: "/lojista/pedidos", contador: "pedidos_a_preparar" },
  { id: "agenda", rotulo: "Agendamentos", icone: CalendarDays, destino: "/lojista/agenda", contador: "agendamentos_hoje" },
  { id: "clientes", rotulo: "Clientes", icone: Users, emBreve: true },
  { id: "relatorios", rotulo: "Relatórios", icone: ChartColumn, destino: "/lojista/relatorios" },
  { id: "marketing", rotulo: "Marketing", icone: Megaphone, emBreve: true },
  { id: "distribuidores", rotulo: "Distribuidores", icone: Truck, emBreve: true },
  { id: "mercadorias", rotulo: "Mercadorias", icone: Boxes, emBreve: true },
];

export const ITENS_CONTA = [
  { id: "configuracoes", rotulo: "Configurações", icone: Settings, destino: "/lojista/perfil" },
  { id: "ajuda", rotulo: "Ajuda e Suporte", icone: Headset, destino: "/lojista/ajuda-suporte" },
];

/** Barra inferior do celular; o restante do menu fica em "Mais". */
export const ITENS_BARRA_INFERIOR = ["painel", "produtos", "servicos", "agenda", "relatorios"];
