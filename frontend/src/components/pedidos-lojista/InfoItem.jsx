/** Ícone + rótulo + valor (ex.: cliente, telefone). */
export default function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="p-3 rounded-xl bg-green-50 text-green-900">
        {icon}
      </div>

      <div>
        <p className="text-xs text-gray-500">
          {label}
        </p>

        <p className="font-medium text-gray-800">
          {value}
        </p>
      </div>

    </div>
  );
}
