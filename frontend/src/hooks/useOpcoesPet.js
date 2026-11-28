import { useEffect, useState } from "react";
import petService from "@/services/petService";

// Uma busca por visita: o catálogo muda raramente. Em caso de erro, a próxima tela tenta de novo.
let pedido = null;

function buscarOpcoes() {
  if (!pedido) {
    pedido = petService.opcoes().then(({ data }) => data).catch((erro) => {
      pedido = null;
      throw erro;
    });
  }
  return pedido;
}

/**
 * Espécies (com as raças de cada uma) e fases de vida do cadastro de pets (GET /pets/opcoes).
 * Devolve { opcoes, erro }: opcoes fica null enquanto carrega ou se falhar.
 */
export function useOpcoesPet() {
  const [estado, setEstado] = useState({ opcoes: null, erro: false });

  useEffect(() => {
    let ativo = true;
    buscarOpcoes()
      .then((opcoes) => ativo && setEstado({ opcoes, erro: false }))
      .catch(() => ativo && setEstado({ opcoes: null, erro: true }));
    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}
