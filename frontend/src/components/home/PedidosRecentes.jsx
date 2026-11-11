import { Package } from "lucide-react";
import { formatarMoeda } from "@/utils/formatadores";
import { formatarStatus } from "@/utils/statusPedido";
import { BlocoResumo } from "./BlocoResumo";

export function PedidosRecentes({ estado, itens }) {
  return (
    <BlocoResumo
      titulo="Meus Pedidos"
      icone={Package}
      estado={estado}
      link={{ destino: "/meus-pedidos", rotulo: "Ver todos" }}
      vazio={<p className="text-sm text-pc-texto-suave">Nenhum pedido ainda.</p>}
    >
      <ul className="space-y-2">
        {itens.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-pc-fundo p-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-pc-texto">Pedido #{p.id}{p.nome_loja ? ` · ${p.nome_loja}` : ""}</span>
              <span className="block text-xs text-pc-texto-suave">{formatarStatus(p.status)}</span>
            </span>
            <span className="shrink-0 text-sm font-bold text-pc-verde-900">{formatarMoeda(p.total)}</span>
          </li>
        ))}
      </ul>
    </BlocoResumo>
  );
}
