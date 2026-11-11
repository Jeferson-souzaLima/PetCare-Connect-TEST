import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { listarMeusAgendamentos, listarMeusPedidos, listarMeusPets } from "@/services/homeService";
import { pedidosRecentes, proximosAgendamentos } from "@/utils/home";

const INATIVO = { estado: "inativo", itens: [] };
const CARREGANDO = { estado: "carregando", itens: [] };

function resultado(promessa, transformar) {
  if (promessa.status === "rejected") return { estado: "erro", itens: [] };
  const itens = transformar(Array.isArray(promessa.value) ? promessa.value : []);
  return { estado: itens.length ? "ok" : "vazio", itens };
}

/**
 * Pets, próximos agendamentos e pedidos recentes do cliente logado.
 * Visitante e lojista: nenhuma chamada à API. Cada bloco falha sozinho.
 */
export function useResumoCliente() {
  const { usuario } = useAuth();
  const ehCliente = usuario?.tipo === "cliente";
  const [resumo, setResumo] = useState(() =>
    ehCliente
      ? { pets: CARREGANDO, agendamentos: CARREGANDO, pedidos: CARREGANDO }
      : { pets: INATIVO, agendamentos: INATIVO, pedidos: INATIVO }
  );

  useEffect(() => {
    if (!ehCliente) {
      setResumo({ pets: INATIVO, agendamentos: INATIVO, pedidos: INATIVO });
      return undefined;
    }

    let ativo = true;
    setResumo({ pets: CARREGANDO, agendamentos: CARREGANDO, pedidos: CARREGANDO });

    Promise.allSettled([listarMeusPets(), listarMeusAgendamentos(), listarMeusPedidos()]).then(
      ([pets, agendamentos, pedidos]) => {
        if (!ativo) return;
        setResumo({
          pets: resultado(pets, (lista) => lista),
          agendamentos: resultado(agendamentos, (lista) => proximosAgendamentos(lista, new Date())),
          pedidos: resultado(pedidos, (lista) => pedidosRecentes(lista)),
        });
      }
    );

    return () => {
      ativo = false;
    };
  }, [ehCliente, usuario?.id]);

  return resumo;
}
