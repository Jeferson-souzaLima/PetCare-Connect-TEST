/** Avisa o lojista enquanto a loja não foi aprovada (ou foi suspensa) pelo admin. */
export default function AvisoLojaPendente({ loja }) {
  if (!loja || loja.ativo) return null;

  return (
    <div role="status" className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
      <p className="font-semibold">Sua loja está aguardando aprovação</p>
      <p className="mt-1 text-sm">
        Você já pode cadastrar produtos, serviços e conectar o Mercado Pago. A loja aparece para os clientes
        assim que nossa equipe aprovar o cadastro.
      </p>
    </div>
  );
}
