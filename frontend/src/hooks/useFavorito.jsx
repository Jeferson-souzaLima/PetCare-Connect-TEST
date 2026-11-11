import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import {
    verificarFavorito,
    adicionarFavorito,
    removerFavorito,
} from "@/services/favoritoService";

export function useFavorito(
    tipo,
    referenciaId
) {

    const { usuario } = useAuth();
    const navigate = useNavigate();
    // Favoritos são da conta: sem sessão não há o que consultar (evita 401 de visitante).
    const logado = Boolean(usuario);

    const [favoritado, setFavoritado] = useState(false);
    const [loading, setLoading] = useState(logado);

    useEffect(() => {

        if (!logado) {
            setFavoritado(false);
            setLoading(false);
            return;
        }

        async function carregarStatus() {

            try {

                const data = await verificarFavorito(
                    tipo,
                    referenciaId
                );

                setFavoritado(data.favoritado);

            } catch (error) {

                console.error(error?.response?.status ?? error?.message);

            } finally {

                setLoading(false);

            }

        }

        carregarStatus();

    }, [tipo, referenciaId, logado]);

    

    async function toggleFavorito() {

        if (!logado) {
            navigate("/login");
            return;
        }

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