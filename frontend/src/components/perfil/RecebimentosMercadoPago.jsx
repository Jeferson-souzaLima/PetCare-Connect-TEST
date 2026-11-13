import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationTriangle, FaWallet } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import MensagemStatus from "@/components/ui/MensagemStatus";
import {
  buscarContaMercadoPago,
  desconectarMercadoPago,
  iniciarConexaoMercadoPago
} from "@/services/mercadoPagoContaService";

const MENSAGENS_RETORNO = {
  conectado: { tipo: "sucesso", texto: "Conta Mercado Pago conectada. Suas vendas já podem cair direto na sua conta." },
  erro: { tipo: "erro", texto: "Não foi possível conectar sua conta Mercado Pago. Tente novamente." }
};

const mensagemDoErro = (erro, padrao) => ({
  tipo: "erro",
  texto: erro.response?.data?.mensagem || padrao
});

/**
 * Card "Recebimentos" do perfil da loja: conecta a conta Mercado Pago do
 * lojista, para onde vão os pagamentos (com a comissão da PetCare descontada).
 */
export default function RecebimentosMercadoPago() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conta, setConta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState(
    () => MENSAGENS_RETORNO[searchParams.get("mercadopago")] || null
  );

  // Remove ?mercadopago= da URL para a mensagem não voltar ao recarregar.
  useEffect(() => {
    if (searchParams.has("mercadopago")) {
      const semRetorno = new URLSearchParams(searchParams);
      semRetorno.delete("mercadopago");
      setSearchParams(semRetorno, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    buscarContaMercadoPago()
      .then(setConta)
      .catch((erro) => setMensagem(mensagemDoErro(erro, "Não foi possível consultar sua conta Mercado Pago.")))
      .finally(() => setCarregando(false));
  }, []);

  const conectar = async () => {
    setProcessando(true);
    setMensagem(null);
    try {
      window.location.assign(await iniciarConexaoMercadoPago());
    } catch (erro) {
      setMensagem(mensagemDoErro(erro, "Não foi possível iniciar a conexão com o Mercado Pago."));
      setProcessando(false);
    }
  };

  const desconectar = async () => {
    if (!window.confirm("Ao desconectar, sua loja deixa de receber pedidos e agendamentos pagos até conectar uma conta novamente. Deseja continuar?")) return;

    setProcessando(true);
    setMensagem(null);
    try {
      await desconectarMercadoPago();
      setConta((atual) => ({ ...atual, conectado: false }));
      setMensagem({ tipo: "sucesso", texto: "Conta Mercado Pago desconectada." });
    } catch (erro) {
      setMensagem(mensagemDoErro(erro, "Não foi possível desconectar a conta Mercado Pago."));
    } finally {
      setProcessando(false);
    }
  };

  const precisaConectar = !conta?.conectado || conta?.expirado;
  const taxas = conta?.comissao_percentual;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-md">
      <h2 className="flex items-center gap-3 text-xl font-bold text-green-900">
        <FaWallet />
        Recebimentos
      </h2>

      <div className="mt-5 space-y-4">
        <MensagemStatus mensagem={mensagem} />

        {carregando ? (
          <p className="text-sm text-gray-600">Consultando sua conta Mercado Pago...</p>
        ) : (
          <>
            {conta?.conectado && !conta.expirado && (
              <p className="flex items-center gap-2 font-semibold text-green-800">
                <FaCheckCircle /> Conta Mercado Pago conectada
              </p>
            )}

            {conta?.expirado && (
              <p className="flex items-center gap-2 font-semibold text-amber-700">
                <FaExclamationTriangle /> A autorização expirou. Conecte sua conta novamente para continuar recebendo.
              </p>
            )}

            {!conta?.conectado && (
              <p className="flex items-center gap-2 font-semibold text-amber-700">
                <FaExclamationTriangle /> Conecte sua conta Mercado Pago para começar a receber pedidos e agendamentos pagos.
              </p>
            )}

            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>O pagamento de cada venda cai direto na sua conta Mercado Pago.</li>
              {taxas && (
                <li>
                  A comissão da PetCare é descontada automaticamente: {taxas.pedido}% sobre produtos
                  e {taxas.agendamento}% sobre serviços. O frete não entra no cálculo.
                </li>
              )}
              <li>A tarifa do Mercado Pago é cobrada na sua conta, conforme o seu plano de recebimento.</li>
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              {precisaConectar && (
                <button
                  type="button"
                  onClick={conectar}
                  disabled={processando}
                  className="rounded-xl bg-green-900 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:opacity-60"
                >
                  {processando ? "Aguarde..." : "Conectar Mercado Pago"}
                </button>
              )}

              {conta?.conectado && (
                <button
                  type="button"
                  onClick={desconectar}
                  disabled={processando}
                  className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                >
                  Desconectar conta
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
