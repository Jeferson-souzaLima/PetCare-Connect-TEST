import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCarrinho } from "../context/CarrinhoContext";
import { useAuth } from "../hooks/useAuth";
import { Footer } from "../components/layout/Footer";
import CarrinhoItem from "../components/cards/CarrinhoItem";
import CarrinhoVazio from "../components/carrinho/CarrinhoVazio";
import CabecalhoCarrinho from "../components/carrinho/CabecalhoCarrinho";
import OpcoesRecebimento from "../components/carrinho/OpcoesRecebimento";
import DadosContato from "../components/carrinho/DadosContato";
import EnderecoEntrega from "../components/carrinho/EnderecoEntrega";
import AvisoPagamento from "../components/carrinho/AvisoPagamento";
import ResumoPedido from "../components/carrinho/ResumoPedido";
import api from "../services/api";
import { calcularFrete as calcularFreteApi } from "../services/freteService";
import {
  enderecoEstaCompleto,
  extrairEndereco,
  normalizarEndereco as normalizar,
  validarEnderecoNormalizado,
} from "../utils/endereco";
import { formatarMoeda } from "../utils/formatadores";
import { obterLocalizacaoAtual } from "../utils/localizacao";

export default function CarrinhoPage() {
  const navigate = useNavigate();

  const {
    carrinho,
    aumentarQuantidade,
    diminuirQuantidade,
    removerItem,
  } = useCarrinho();

  const { usuario, token, atualizarUsuario } = useAuth();

  const [retirada, setRetirada] = useState("retirada");

  const [contato, setContato] = useState({
    nome: usuario?.nome || "",
    telefone: usuario?.telefone || "",
  });

  const [endereco, setEndereco] = useState(extrairEndereco(usuario));

  const [coordenadasEntrega, setCoordenadasEntrega] = useState(
    usuario?.latitude && usuario?.longitude
      ? {
          latitude: Number(usuario.latitude),
          longitude: Number(usuario.longitude),
        }
      : null
  );

  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [salvarNoPerfil, setSalvarNoPerfil] = useState(false);

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [usandoLocalizacao, setUsandoLocalizacao] = useState(false);
  const [mensagemLocalizacao, setMensagemLocalizacao] = useState("");

  const [erro, setErro] = useState("");
  const [erroEndereco, setErroEndereco] = useState("");

  const [frete, setFrete] = useState(0);
  const [, setDistanciaEntrega] = useState(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);

  const [finalizando, setFinalizando] = useState(false);
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);

  /*
   * Carrega os dados mais recentes do perfil.
   */
  useEffect(() => {
    if (!token) return;

    let ativo = true;

    async function carregarPerfil() {
      try {
        const { data } = await api.get("/usuarios/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!ativo) return;

        const perfil = data.usuario || data;

        atualizarUsuario(perfil);

        setContato({
          nome: perfil.nome || "",
          telefone: perfil.telefone || "",
        });

        setEndereco(extrairEndereco(perfil));

        if (perfil.latitude && perfil.longitude) {
          setCoordenadasEntrega({
            latitude: Number(perfil.latitude),
            longitude: Number(perfil.longitude),
          });
        }
      } catch {
        /*
         * Se o perfil não puder ser carregado, o checkout continua
         * funcionando com os dados que eventualmente já existam.
         */
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [token, atualizarUsuario]);

  /*
   * Verifica se existe um endereço completo salvo no perfil.
   */
  const possuiEnderecoPerfil = enderecoEstaCompleto(usuario);

  /*
   * Quantidade total de itens.
   */
  const quantidadeItens = carrinho.itens.reduce(
    (total, item) => total + Number(item.quantidade || 0),
    0
  );

  /*
   * Nome da loja do carrinho.
   */
  const nomeLoja = carrinho.itens[0]?.loja_nome || "Loja selecionada";

  /*
   * Totais.
   */
  const totalFormatado = formatarMoeda(carrinho.total);

  const totalComFrete =
    Number(carrinho.total || 0) +
    (retirada === "entrega" ? Number(frete || 0) : 0);

  const totalComFreteFormatado = formatarMoeda(totalComFrete);

  /*
   * Normaliza endereço antes de enviar.
   */
  function normalizarEndereco() {
    return normalizar(endereco);
  }

  /*
   * Validação do endereço.
   */
  function validarEndereco() {
    const mensagem = validarEnderecoNormalizado(normalizarEndereco());

    setErroEndereco(mensagem);

    return !mensagem;
  }

  /*
   * Busca endereço pelo CEP usando o endpoint já existente.
   */
  async function buscarCep() {
    const cep = endereco.cep.replace(/\D/g, "");

    if (!/^\d{8}$/.test(cep)) {
      setErroEndereco("Informe um CEP válido para realizar a busca.");
      return;
    }

    setBuscandoCep(true);
    setErroEndereco("");

    try {
      const { data } = await api.get(`/cep/${cep}`);

      setEndereco((prev) => ({
        ...prev,
        cep: data.cep || prev.cep,
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        uf: data.uf || "",
      }));
    } catch {
      setErroEndereco(
        "Não foi possível localizar esse CEP. Confira o número e tente novamente."
      );
    } finally {
      setBuscandoCep(false);
    }
  }

  /*
   * Usa a localização atual para esta entrega.
   */
  async function usarLocalizacaoAtual() {
    setUsandoLocalizacao(true);
    setErro("");
    setMensagemLocalizacao("");

    try {
      const coordenadas = await obterLocalizacaoAtual();

      setCoordenadasEntrega(coordenadas);

      setMensagemLocalizacao(
        "Localização atual definida para esta entrega."
      );
    } catch {
      setErro(
        "Não foi possível obter sua localização. Permita o acesso à localização no navegador."
      );
    } finally {
      setUsandoLocalizacao(false);
    }
  }

  /*
   * Salva o endereço no perfil quando o usuário optar por isso.
   */
  async function aplicarEndereco() {
    setErro("");
    setErroEndereco("");

    if (!validarEndereco()) return;

    const enderecoNormalizado = normalizarEndereco();

    if (salvarNoPerfil) {
      setSalvandoEndereco(true);

      try {
        const dadosParaSalvar = {
          ...enderecoNormalizado,
          ...(coordenadasEntrega
            ? {
                latitude: coordenadasEntrega.latitude,
                longitude: coordenadasEntrega.longitude,
              }
            : {}),
        };

        const { data } = await api.put(
          "/usuarios/me",
          dadosParaSalvar,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        atualizarUsuario(
          data.usuario || data || dadosParaSalvar
        );
      } catch (requestError) {
        setErro(
          requestError.response?.data?.mensagem ||
            "Não foi possível salvar o endereço no seu perfil."
        );

        setSalvandoEndereco(false);
        return;
      }

      setSalvandoEndereco(false);
    }

    setEditandoEndereco(false);
    setMensagemLocalizacao("");
  }

  function cancelarEdicaoEndereco() {
    setEditandoEndereco(false);
    setErroEndereco("");
    setSalvarNoPerfil(false);

    setEndereco(extrairEndereco(usuario));
  }

  const latitudeEntrega = coordenadasEntrega?.latitude;
  const longitudeEntrega = coordenadasEntrega?.longitude;

  /*
   * Recalcula o frete quando muda a forma de receber, a loja ou o endereço.
   * Se o endereço mudar antes de a resposta chegar, a resposta antiga é
   * descartada (não sobrescreve o frete do endereço atual).
   */
  useEffect(() => {
    let atual = true;

    async function calcularFreteEntrega() {
      if (
        retirada !== "entrega" ||
        !carrinho.loja_id ||
        !latitudeEntrega ||
        !longitudeEntrega
      ) {
        setFrete(0);
        setDistanciaEntrega(null);
        return;
      }

      try {
        setCalculandoFrete(true);

        const resultado = await calcularFreteApi({
          lojaId: carrinho.loja_id,
          latitude: latitudeEntrega,
          longitude: longitudeEntrega,
        });

        if (!atual) return;
        setFrete(resultado.frete);
        setDistanciaEntrega(resultado.distanciaKm);
      } catch (erro) {
        console.error("Erro ao calcular frete:", erro);

        if (!atual) return;
        setFrete(0);
        setDistanciaEntrega(null);
      } finally {
        if (atual) setCalculandoFrete(false);
      }
    }

    calcularFreteEntrega();

    return () => {
      atual = false;
    };
  }, [retirada, carrinho.loja_id, latitudeEntrega, longitudeEntrega]);

  /*
   * Encerra o checkout.
   */
  async function finalizarPedido() {
    setErro("");

    if (!contato.nome.trim()) {
      setErro("Informe seu nome para contato.");
      return;
    }

    if (!contato.telefone.trim()) {
      setErro("Informe seu telefone para contato.");
      return;
    }

    let enderecoComCoordenadas = normalizarEndereco();

    if (retirada === "entrega") {
      if (!validarEndereco()) {
        setErro(erroEndereco || "Preencha corretamente o endereço.");
        return;
      }

      /*
       * Se já temos coordenadas do perfil ou obtidas manualmente,
       * reutilizamos.
       *
       * Caso contrário, tentamos obter a localização automaticamente.
       */
      let coordenadas = coordenadasEntrega;

      if (!coordenadas) {
        try {
          coordenadas = await obterLocalizacaoAtual();

          setCoordenadasEntrega(coordenadas);
        } catch {
          setErro(
            "Permita o acesso à localização para calcular a entrega."
          );
          return;
        }
      }

      enderecoComCoordenadas = {
        ...enderecoComCoordenadas,
        ...coordenadas,
      };
    }

    setFinalizando(true);

    try {
      const resposta = await api.post("/pedidos/checkout", {
        loja_id: carrinho.loja_id,

        itens: carrinho.itens.map((item) => ({
          produto_id: item.item_id,
          quantidade: item.quantidade,
        })),

        modalidade_entrega: retirada,

        contato,

        endereco: enderecoComCoordenadas,
      });

      window.location.assign(resposta.data.checkout_url);
    } catch (requestError) {
      setErro(
        requestError.response?.data?.mensagem ||
          "Não foi possível iniciar o pagamento."
      );

      setFinalizando(false);
    }
  }

  /*
   * Carrinho vazio.
   */
  if (!carrinho.itens.length) {
    return <CarrinhoVazio onExplorar={() => navigate("/")} />;
  }

  return (
    <div className="bg-[#EBE9E9] min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">

          <CabecalhoCarrinho
            quantidadeItens={quantidadeItens}
            nomeLoja={nomeLoja}
          />

          {/* ITENS */}
          <section>
            <div className="space-y-4">
              {carrinho.itens.map((item) => (
                <CarrinhoItem
                  key={item.item_id}
                  item={item}
                  onIncrease={() =>
                    aumentarQuantidade(item.item_id)
                  }
                  onDecrease={() =>
                    diminuirQuantidade(item.item_id)
                  }
                  onRemove={() =>
                    removerItem(item.item_id)
                  }
                />
              ))}
            </div>
          </section>

          <OpcoesRecebimento
            retirada={retirada}
            onSelecionar={(opcao) => {
              setRetirada(opcao);
              setErro("");
            }}
          />

          <DadosContato contato={contato} setContato={setContato} />

          {retirada === "entrega" && (
            <EnderecoEntrega
              possuiEnderecoPerfil={possuiEnderecoPerfil}
              editandoEndereco={editandoEndereco}
              onAlterar={() => {
                setEditandoEndereco(true);
                setSalvarNoPerfil(true);
                setErroEndereco("");
              }}
              endereco={endereco}
              setEndereco={setEndereco}
              buscarCep={buscarCep}
              buscandoCep={buscandoCep}
              erroEndereco={erroEndereco}
              coordenadasEntrega={coordenadasEntrega}
              usandoLocalizacao={usandoLocalizacao}
              usarLocalizacaoAtual={usarLocalizacaoAtual}
              mensagemLocalizacao={mensagemLocalizacao}
              salvarNoPerfil={salvarNoPerfil}
              setSalvarNoPerfil={setSalvarNoPerfil}
              aplicarEndereco={aplicarEndereco}
              salvandoEndereco={salvandoEndereco}
              onCancelar={cancelarEdicaoEndereco}
            />
          )}

          <AvisoPagamento />

          <ResumoPedido
            totalFormatado={totalFormatado}
            totalComFreteFormatado={totalComFreteFormatado}
            retirada={retirada}
            frete={frete}
            calculandoFrete={calculandoFrete}
            quantidadeItens={quantidadeItens}
            erro={erro}
            finalizando={finalizando}
            onFinalizar={finalizarPedido}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
