const { COMISSAO_PERCENTUAL } = require('../Config/financeiro');

/**
 * Calcula a comissão da PetCare para uma venda.
 * `base` é o valor sobre o qual a comissão incide: o subtotal dos produtos
 * (sem frete) num pedido, ou o valor do serviço num agendamento.
 * O cálculo é feito em centavos para evitar erro de arredondamento.
 */
function calcularComissao(tipoReferencia, base) {

    const percentual = COMISSAO_PERCENTUAL[tipoReferencia];

    if (percentual === undefined) {
        throw new Error(`Tipo de referência sem comissão definida: ${tipoReferencia}`);
    }

    const valorBase = Number(base);

    if (!Number.isFinite(valorBase) || valorBase < 0) {
        throw new Error('Valor base da comissão inválido.');
    }

    const centavosBase = Math.round(valorBase * 100);
    const centavosComissao = Math.round(centavosBase * percentual / 100);

    return {
        percentual,
        valor: centavosComissao / 100
    };
}

/**
 * Quanto fica com a loja: total pago menos comissão e tarifa do Mercado Pago.
 * Comissão/tarifa ausentes (vendas antigas ou tarifa ainda não informada) contam como zero.
 */
function calcularLiquido(valor, comissao, tarifa) {
    const centavos = (numero) => Math.round(Number(numero || 0) * 100);
    return (centavos(valor) - centavos(comissao) - centavos(tarifa)) / 100;
}

module.exports = {
    calcularComissao,
    calcularLiquido
};
