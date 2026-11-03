const axios = require("axios");

async function buscarNoNominatim(enderecoCompleto) {
    const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
            params: {
                q: enderecoCompleto,
                format: "json",
                limit: 1,
                countrycodes: "br"
            },
            headers: {
                "User-Agent": "PetCareConnect/1.0"
            }
        }
    );

    if (!response.data.length) {
        return null;
    }

    return response.data[0];
}

exports.buscarCoordenadas = async ({
    endereco,
    cidade,
    uf,
    cep
}) => {


    try {

        /*
         * 1ª tentativa:
         * endereço completo, sem CEP.
         *
         * Exemplo:
         * Rua X, 100, Centro, Carapicuíba, SP, Brasil
         */
        const enderecoComNumero = [
            endereco,
            cidade,
            uf,
            "Brasil"
        ]
            .filter(Boolean)
            .join(", ");


        let resultado = await buscarNoNominatim(
            enderecoComNumero
        );

        /*
         * 2ª tentativa:
         * remove o número para aumentar a chance de encontrar
         * a rua/bairro/cidade.
         *
         * Isso é um fallback de localização aproximada.
         */
        if (!resultado) {

            const enderecoSemNumero = [
                endereco
                    ? endereco.replace(/,\s*\d+.*$/, "")
                    : "",
                cidade,
                uf,
                "Brasil"
            ]
                .filter(Boolean)
                .join(", ");


            resultado = await buscarNoNominatim(
                enderecoSemNumero
            );
        }

        if (!resultado) {


            return null;
        }


        return {
            latitude: Number(resultado.lat),
            longitude: Number(resultado.lon)
        };

    } catch (err) {

        console.error(
            "Erro ao buscar coordenadas:",
            err.message
        );

        return null;
    }
};