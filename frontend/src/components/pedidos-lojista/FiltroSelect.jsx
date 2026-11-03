/** Select com rótulo; `options` = [[valor, texto], ...]. */
export default function FiltroSelect({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>

      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
      >
        {options.map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>

    </div>
  );
}
