import { Link } from "react-router-dom";

/** Caixa obrigatória de aceite dos Termos e ciência da Política de Privacidade. */
export function CaixaAceiteTermos({ marcado, onChange }) {
  return (
    <label className="flex items-start gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-green-900"
        checked={marcado}
        onChange={(event) => onChange(event.target.checked)}
        required
      />
      <span>
        Li e aceito os{" "}
        <Link to="/termos" target="_blank" rel="noopener noreferrer" className="font-semibold text-green-900 underline">
          Termos de Uso
        </Link>{" "}
        e estou ciente da{" "}
        <Link to="/privacidade" target="_blank" rel="noopener noreferrer" className="font-semibold text-green-900 underline">
          Política de Privacidade
        </Link>
        .
      </span>
    </label>
  );
}
