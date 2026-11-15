import { Link } from "react-router-dom";

/** Moldura das páginas de Termos e Privacidade. */
export function DocumentoLegal({ titulo, versao, children }) {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-md sm:p-10">
        <h1 className="text-3xl font-bold text-green-900">{titulo}</h1>
        <p className="mt-1 text-sm text-gray-500">Versão {versao}</p>

        <div className="documento-legal mt-8 space-y-6 text-gray-700 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-green-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-200 pt-6 text-sm">
          <Link to="/termos" className="font-semibold text-green-900 hover:underline">Termos de Uso</Link>
          <Link to="/privacidade" className="font-semibold text-green-900 hover:underline">Política de Privacidade</Link>
          <Link to="/" className="text-gray-600 hover:underline">Voltar ao início</Link>
        </div>
      </article>
    </div>
  );
}
