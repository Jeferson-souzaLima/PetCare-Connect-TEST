const axios = require("axios");
const cepService = require("./cepService");

/*
 * Nominatim (OpenStreetMap), seguindo a política de uso do serviço público:
 * - User-Agent que identifica a aplicação;
 * - no máximo 1 consulta por segundo (fila única para todo o backend);
 * - resultados recentes guardados em memória, para não repetir consultas.
 * https://operations.osmfoundation.org/policies/nominatim/
 */
const NOMINATIM = "https://nominatim.openstreetmap.org";
const USER_AGENT = "PetCare Connect/1.0 (+https://mvp-beige-sigma.vercel.app)";
const INTERVALO_MINIMO_MS = 1000;
const VALIDADE_MEMORIA_MS = 24 * 60 * 60 * 1000;
const MAXIMO_NA_MEMORIA = 500;
const TEMPO_LIMITE_MS = 8000;

let proximaLiberacao = 0;
const memoria = new Map();

function esperarAte(instante) {
    const falta = instante - Date.now();
    if (falta <= 0) return Promise.resolve();
    // O timer pode disparar 1 ms antes do previsto: confere de novo antes de liberar.
    return new Promise((resolve) => setTimeout(resolve, falta)).then(() => esperarAte(instante));
}

/** Reserva a próxima vaga da fila e espera até ela (1 consulta por segundo). */
function aguardarVez() {
    const vaga = Math.max(Date.now(), proximaLiberacao);
    proximaLiberacao = vaga + INTERVALO_MINIMO_MS;
    return esperarAte(vaga);
}

function lerMemoria(chave) {
    const item = memoria.get(chave);
    if (!item) return undefined;
    if (item.expira < Date.now()) {
        memoria.delete(chave);
        return undefined;
    }
    return item.valor;
}

function guardarMemoria(chave, valor) {
    if (memoria.size >= MAXIMO_NA_MEMORIA) {
        memoria.delete(memoria.keys().next().value);
    }
    memoria.set(chave, { valor, expira: Date.now() + VALIDADE_MEMORIA_MS });
}

/** Consulta o Nominatim respeitando a fila e a memória. Erros de rede sobem para quem chamou. */
async function consultarNominatim(caminho, params) {
    const chave = `${caminho}?${JSON.stringify(params)}`;
    const guardado = lerMemoria(chave);
    if (guardado !== undefined) return guardado;

    await aguardarVez();
    const response = await axios.get(`${NOMINATIM}${caminho}`, {
        params,
        headers: { "User-Agent": USER_AGENT },
        timeout: TEMPO_LIMITE_MS
    });
    guardarMemoria(chave, response.data);
    return response.data;
}

async function buscarNoNominatim(enderecoCompleto) {
    const resultados = await consultarNominatim("/search", {
        q: enderecoCompleto,
        format: "json",
        limit: 1,
        countrycodes: "br"
    });
    return resultados?.length ? resultados[0] : null;
}

function cidadeDoEndereco(address = {}) {
    return address.city || address.town || address.village || address.municipality || address.hamlet || null;
}

function ufDoEndereco(address = {}) {
    const iso = address["ISO3166-2-lvl4"] || "";
    return /^BR-[A-Z]{2}$/.test(iso) ? iso.slice(3) : null;
}

exports.buscarCoordenadas = async ({
    endereco,
    cidade,
    uf
}) => {
    try {
        /*
         * 1ª tentativa: endereço completo, sem CEP.
         * Exemplo: Rua X, 100, Centro, Carapicuíba, SP, Brasil
         */
        const enderecoComNumero = [endereco, cidade, uf, "Brasil"].filter(Boolean).join(", ");
        let resultado = await buscarNoNominatim(enderecoComNumero);

        /*
         * 2ª tentativa: sem o número, para achar ao menos a rua, o bairro ou a cidade
         * (localização aproximada).
         */
        if (!resultado) {
            const enderecoSemNumero = [
                endereco ? endereco.replace(/,\s*\d+.*$/, "") : "",
                cidade,
                uf,
                "Brasil"
            ].filter(Boolean).join(", ");
            resultado = await buscarNoNominatim(enderecoSemNumero);
        }

        if (!resultado) return null;

        return {
            latitude: Number(resultado.lat),
            longitude: Number(resultado.lon)
        };
    } catch (err) {
        console.error("Erro ao buscar coordenadas:", err.message);
        return null;
    }
};

/** Coordenadas → { cidade, uf } (ou null se o ponto não estiver numa cidade brasileira). */
exports.buscarCidadePorCoordenadas = async (latitude, longitude) => {
    const dados = await consultarNominatim("/reverse", {
        lat: Number(latitude).toFixed(4),
        lon: Number(longitude).toFixed(4),
        format: "jsonv2",
        zoom: 10,
        addressdetails: 1,
        "accept-language": "pt-BR"
    });
    const cidade = cidadeDoEndereco(dados?.address);
    const uf = ufDoEndereco(dados?.address);
    return cidade && uf ? { cidade, uf } : null;
};

/**
 * CEP ou nome de cidade → { cidade, uf, latitude, longitude, cep? } (ou null se não achar).
 * CEP: cidade pelo ViaCEP e coordenadas pelo Nominatim. Cidade: Nominatim.
 */
exports.buscarCidade = async (texto) => {
    const digitos = texto.replace(/\D/g, "");
    const ehCep = /^\d{5}-?\d{3}$/.test(texto.trim()) && digitos.length === 8;

    if (ehCep) {
        const endereco = await cepService.buscarPorCep(digitos);
        if (!endereco?.cidade) return null;
        const coordenadas = await exports.buscarCoordenadas({
            endereco: endereco.logradouro,
            cidade: endereco.cidade,
            uf: endereco.uf
        });
        if (!coordenadas) return null;
        return { cidade: endereco.cidade, uf: endereco.uf, cep: endereco.cep, ...coordenadas };
    }

    const resultados = await consultarNominatim("/search", {
        q: `${texto.trim()}, Brasil`,
        format: "jsonv2",
        addressdetails: 1,
        limit: 1,
        countrycodes: "br",
        featureType: "settlement",
        "accept-language": "pt-BR"
    });
    const local = resultados?.[0];
    const cidade = cidadeDoEndereco(local?.address);
    const uf = ufDoEndereco(local?.address);
    if (!local || !cidade || !uf) return null;
    return { cidade, uf, latitude: Number(local.lat), longitude: Number(local.lon) };
};

/** Esvazia a memória e a fila (usado nos testes). */
exports.limparMemoria = () => {
    memoria.clear();
    proximaLiberacao = 0;
};
