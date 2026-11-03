import { useEffect, useState } from "react";

import {
    verificarFavorito,
    adicionarFavorito,
    removerFavorito,
} from "@/services/favoritoService";

export function useFavorito(
    tipo,
    referenciaId
) {

    const [favoritado, setFavoritado] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        async function carregarStatus() {

            try {

                const data = await verificarFavorito(
                    tipo,
                    referenciaId
                );

                setFavoritado(data.favoritado);

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);

            }

        }

        carregarStatus();

    }, [tipo, referenciaId]);

    

    async function toggleFavorito() {

        try {

            setLoading(true);

            if (favoritado) {

                await removerFavorito(
                    tipo,
                    referenciaId
                );

                setFavoritado(false);

            } else {

                await adicionarFavorito(
                    tipo,
                    referenciaId
                );

                setFavoritado(true);

            }

        } catch (error) {

            // Só o status: o objeto de erro do axios inclui o cabeçalho com o token.
            console.error("Erro ao atualizar favorito:", error.response?.status ?? error.message);

        } finally {

            setLoading(false);

        }

    }

    return {

        favoritado,
        loading,
        toggleFavorito,

    };

}