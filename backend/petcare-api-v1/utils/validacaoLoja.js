const LIMITES = {
    nome_fantasia: 100,
    razao_social: 255,
    cnpj: 18,
    telefone: 20,
    cidade: 100,
    uf: 2,
    endereco: 255,
    cep: 9,
    descricao: 1000
};

function textoOpcional(valor, limite) {
    if (valor === undefined || valor === null) return null;
    if (typeof valor !== 'string') return undefined;
    const texto = valor.trim();
    return texto.length ? texto.slice(0, limite) : null;
}

const somenteDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

/** CNPJ com 14 dígitos e dígitos verificadores corretos (aceita com ou sem máscara). */
function cnpjValido(valor) {
    const cnpj = somenteDigitos(valor);
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    const digito = (base) => {
        let peso = base.length - 7;
        let soma = 0;
        for (const numero of base) {
            soma += Number(numero) * peso--;
            if (peso < 2) peso = 9;
        }
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const primeiro = digito(cnpj.slice(0, 12));
    const segundo = digito(cnpj.slice(0, 12) + primeiro);
    return cnpj.endsWith(`${primeiro}${segundo}`);
}

/**
 * Valida e normaliza os dados de uma loja enviados pelo lojista.
 * Retorna { loja } ou { erro } com mensagem para o usuário.
 */
function validarDadosLoja(dados) {
    const loja = {};
    for (const [campo, limite] of Object.entries(LIMITES)) {
        loja[campo] = textoOpcional(dados[campo], limite);
        if (loja[campo] === undefined) return { erro: `O campo ${campo} é inválido.` };
    }
    if (!loja.nome_fantasia) return { erro: 'O nome fantasia é obrigatório.' };
    if (loja.uf) {
        loja.uf = loja.uf.toUpperCase();
        if (!/^[A-Z]{2}$/.test(loja.uf)) return { erro: 'Informe uma UF válida com duas letras.' };
    }
    if (loja.cnpj && !cnpjValido(loja.cnpj)) return { erro: 'Informe um CNPJ válido.' };
    loja.entrega_ativa = dados.entrega_ativa === true || dados.entrega_ativa === 1 || dados.entrega_ativa === '1';
    for (const campo of ['taxa_entrega_fixa', 'taxa_entrega_por_km', 'raio_entrega_km']) {
        const valor = Number(dados[campo] ?? (campo === 'raio_entrega_km' ? 10 : 0));
        if (!Number.isFinite(valor) || valor < 0 || (campo === 'raio_entrega_km' && valor === 0)) return { erro: `O campo ${campo} é inválido.` };
        loja[campo] = valor;
    }
    return { loja };
}

module.exports = { validarDadosLoja, cnpjValido, somenteDigitos };
