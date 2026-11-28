import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { listarFavoritos } from "@/services/favoritoService";
import { listarMeusAgendamentos, listarMeusPedidos } from "@/services/homeService";

const VAZIO = { favoritos: null, agendamentos: null, pedidos: null };

/**
 * Listas usadas nos números do "Acesso rápido" (favoritos, agendamentos e pedidos).
 * Cada uma falha sozinha (fica null); fora do perfil de cliente nada é buscado.
 */
export function useListasPerfil() {
  const { usuario } = useAuth();
  const ehCliente = usuario?.tipo === "cliente";
  const [listas, setListas] = useState(VAZIO);

  useEffect(() => {
    if (!ehCliente) {
      setListas(VAZIO);
      return undefined;
    }

    let ativo = true;
    Promise.allSettled([listarFavoritos(), listarMeusAgendamentos(), listarMeusPedidos()]).then(
      ([favoritos, agendamentos, pedidos]) => {
        if (!ativo) return;
        const lista = (resultado) => (resultado.status === "fulfilled" && Array.isArray(resultado.value) ? resultado.value : null);
        // Favoritos vêm agrupados ({ produtos, lojas, servicos }): quem conta é contadoresPerfil.
        const favoritosRecebidos = favoritos.status === "fulfilled" ? favoritos.value : null;
        setListas({ favoritos: favoritosRecebidos, agendamentos: lista(agendamentos), pedidos: lista(pedidos) });
      }
    );

    return () => {
      ativo = false;
    };
  }, [ehCliente, usuario?.id]);

  return listas;
}
