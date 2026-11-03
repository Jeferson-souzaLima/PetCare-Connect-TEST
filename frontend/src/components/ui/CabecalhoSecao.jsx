/**
 * Cabeçalho padrão de seção: ícone em destaque + título + descrição.
 * `icon` recebe o componente do ícone (lucide-react).
 */
export default function CabecalhoSecao({
  icon: Icon,
  titulo,
  descricao,
  className = "",
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#0E5617]" />
      </div>

      <div>
        <h2 className="font-bold text-gray-800">
          {titulo}
        </h2>

        <p className="text-sm text-gray-500">
          {descricao}
        </p>
      </div>
    </div>
  );
}
