/** Card de indicador (Hoje, Em andamento, Entregues, Cancelados). */
export default function ResumoCard({
  icon,
  titulo,
  valor,
  destaque = false,
}) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md p-5 border ${
        destaque
          ? "border-yellow-300"
          : "border-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">

        <div
          className={`p-3 rounded-full ${
            destaque
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-900"
          }`}
        >
          {icon}
        </div>

        <div>

          <p className="text-sm text-gray-500">
            {titulo}
          </p>

          <p className="text-2xl font-bold text-green-900">
            {valor}
          </p>

        </div>

      </div>
    </div>
  );
}
