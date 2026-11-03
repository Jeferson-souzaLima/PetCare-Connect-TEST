import { Heart } from "lucide-react";
import { useFavorito } from "@/hooks/useFavorito";

export function FavoriteButton({
    tipo,
    referenciaId,
    className = "",
}) {

    const {
        favoritado,
        loading,
        toggleFavorito,
    } = useFavorito(
        tipo,
        referenciaId
    );

    return (

        <button
            type="button"
            disabled={loading}
            onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                await toggleFavorito();
            }}
            className={`
                w-10
                h-10
                rounded-full
                bg-white/90
                backdrop-blur-sm
                shadow-md
                flex
                items-center
                justify-center
                transition-all
                hover:scale-110
                active:scale-95
                disabled:opacity-60
                ${className}
            `}
        >

            <Heart
                size={22}
                className={`
                    transition-all
                    duration-300
                    ${loading ? "animate-pulse" : ""}
                    ${
                        favoritado
                            ? "fill-red-500 text-red-500"
                            : "text-gray-500"
                    }
                `}
            />

        </button>

    );

}