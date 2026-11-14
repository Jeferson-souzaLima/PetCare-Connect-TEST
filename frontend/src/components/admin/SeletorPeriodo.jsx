import { MESES } from "./meses";

const PRIMEIRO_ANO = 2025;

const anosDisponiveis = () => {
  const anoAtual = new Date().getFullYear();
  return Array.from({ length: anoAtual - PRIMEIRO_ANO + 1 }, (_, i) => anoAtual - i);
};

const CLASSE_SELECT = "rounded-xl border border-green-200 bg-white px-3 py-2 text-sm text-green-900";

/** Seleção de ano e, opcionalmente, de mês (mes = null significa o ano todo). */
export default function SeletorPeriodo({ ano, mes, onChange, comMes = false }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm font-semibold text-green-900" htmlFor="periodo-ano">Período</label>
      <select id="periodo-ano" className={CLASSE_SELECT} value={ano} onChange={(e) => onChange({ ano: Number(e.target.value), mes })}>
        {anosDisponiveis().map((opcao) => <option key={opcao} value={opcao}>{opcao}</option>)}
      </select>
      {comMes && (
        <select aria-label="Mês" className={CLASSE_SELECT} value={mes ?? ""} onChange={(e) => onChange({ ano, mes: e.target.value ? Number(e.target.value) : null })}>
          <option value="">Ano todo</option>
          {MESES.map((nome, i) => <option key={nome} value={i + 1}>{nome}</option>)}
        </select>
      )}
    </div>
  );
}
