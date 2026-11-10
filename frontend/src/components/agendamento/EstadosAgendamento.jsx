import { CalendarDays } from "lucide-react";

/** Tela exibida enquanto os dados do agendamento carregam. */
export function AgendamentoCarregando() {
  return (
    <div className="bg-[#EBE9E9] min-h-screen">
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 text-center">
          <div className="w-10 h-10 border-4 border-green-100 border-t-[#0E5617] rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm text-gray-600">
            Carregando agendamento...
          </p>
        </div>
      </main>
    </div>
  );
}

/** Tela de erro quando loja ou serviço não puderam ser carregados. */
export function AgendamentoErro({ erro, onVoltar }) {
  return (
    <div className="bg-[#EBE9E9] min-h-screen">
      <main className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-red-600" />
          </div>

          <h1 className="mt-4 text-xl font-bold text-gray-800">
            Não foi possível carregar o agendamento
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            {erro}
          </p>

          <button
            type="button"
            onClick={onVoltar}
            className="
              mt-6
              w-full
              rounded-xl
              bg-[#0E5617]
              text-white
              font-semibold
              py-3
              hover:bg-[#0b4612]
              transition
            "
          >
            Voltar
          </button>
        </div>
      </main>
    </div>
  );
}
