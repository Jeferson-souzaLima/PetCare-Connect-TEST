import { formatarMoeda } from "../../utils/formatadores";

/** Linha "rótulo .... R$ valor" do resumo de valores. */
export default function LinhaValor({
  label,
  valor,
}) {
  return (
    <div className="flex justify-between">

      <span className="text-gray-600">
        {label}
      </span>

      <span className="font-medium text-gray-800">
        {formatarMoeda(valor)}
      </span>

    </div>
  );
}
