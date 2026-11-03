/** Caixa de mensagem de sucesso/erro. `mensagem` = { tipo: "sucesso" | "erro", texto }. */
export default function MensagemStatus({ mensagem }) {
  if (!mensagem) return null;

  return (
    <div
      className={`p-3 rounded-xl text-sm ${
        mensagem.tipo === "sucesso"
          ? "bg-green-50 text-green-800 border border-green-100"
          : "bg-red-50 text-red-700 border border-red-100"
      }`}
    >
      {mensagem.texto}
    </div>
  );
}
