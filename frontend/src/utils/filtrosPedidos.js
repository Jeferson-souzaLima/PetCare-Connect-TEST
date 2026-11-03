import { STATUS_EM_ANDAMENTO, STATUS_FINAIS } from "./statusPedido";

export function inicioDoDia(data = new Date()) {
  const resultado = new Date(data);
  resultado.setHours(0, 0, 0, 0);
  return resultado;
}

export function fimDoDia(data = new Date()) {
  const resultado = new Date(data);
  resultado.setHours(23, 59, 59, 999);
  return resultado;
}

export function pedidoEstaEmAndamento(pedido) {
  return STATUS_EM_ANDAMENTO.includes(pedido.status);
}

export function pedidoEhDeHoje(pedido) {
  const dataPedido = new Date(pedido.data_pedido);

  return (
    dataPedido >= inicioDoDia() &&
    dataPedido <= fimDoDia()
  );
}

/**
 * Aplica período, status, busca textual e ordenação à lista de pedidos da loja.
 */
export function filtrarPedidos(pedidos, { periodo, statusFiltro, busca, ordenacao }) {
  let resultado = [...pedidos];

  /*
   * FILTRO DE PERÍODO
   */
  if (periodo === "hoje") {
    resultado = resultado.filter((pedido) => {
      /*
       * Hoje mostra os pedidos de hoje.
       *
       * Pedidos de dias anteriores continuam aparecendo
       * somente se ainda estiverem em andamento, pois são
       * pendências operacionais.
       */
      return (
        pedidoEhDeHoje(pedido) ||
        pedidoEstaEmAndamento(pedido)
      );
    });
  }

  if (periodo === "ontem") {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    resultado = resultado.filter((pedido) => {
      const data = new Date(pedido.data_pedido);

      return (
        data >= inicioDoDia(ontem) &&
        data <= fimDoDia(ontem)
      );
    });
  }

  if (periodo === "7dias") {
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);

    resultado = resultado.filter(
      (pedido) =>
        new Date(pedido.data_pedido) >= limite
    );
  }

  if (periodo === "30dias") {
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);

    resultado = resultado.filter(
      (pedido) =>
        new Date(pedido.data_pedido) >= limite
    );
  }

  /*
   * FILTRO DE STATUS
   */
  if (statusFiltro !== "todos") {
    resultado = resultado.filter((pedido) => {
      if (statusFiltro === "andamento") {
        return pedidoEstaEmAndamento(pedido);
      }

      if (statusFiltro === "finais") {
        return STATUS_FINAIS.includes(pedido.status);
      }

      return pedido.status === statusFiltro;
    });
  }

  /*
   * BUSCA
   */
  const termo = busca.trim().toLowerCase();

  if (termo) {
    resultado = resultado.filter((pedido) => {
      const textoBusca = [
        pedido.id,
        pedido.nome_contato,
        pedido.telefone_contato,
        ...(pedido.itens || []).map(
          (item) => item.nome_item
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return textoBusca.includes(termo);
    });
  }

  /*
   * ORDENAÇÃO
   */
  resultado.sort((a, b) => {
    if (ordenacao === "recentes") {
      return (
        new Date(b.data_pedido) -
        new Date(a.data_pedido)
      );
    }

    if (ordenacao === "antigos") {
      return (
        new Date(a.data_pedido) -
        new Date(b.data_pedido)
      );
    }

    if (ordenacao === "maior_valor") {
      return Number(b.total) - Number(a.total);
    }

    if (ordenacao === "menor_valor") {
      return Number(a.total) - Number(b.total);
    }

    return 0;
  });

  return resultado;
}
