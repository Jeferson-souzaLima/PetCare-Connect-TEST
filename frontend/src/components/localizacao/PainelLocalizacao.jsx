import { useEffect, useId, useRef, useState } from "react";
import { Home, LoaderCircle, LocateFixed, Search, X } from "lucide-react";
import api from "@/services/api";
import { buscarCidadePorCoordenadas, buscarLocal } from "@/services/geolocalizacaoService";
import { useLocalizacao } from "@/hooks/useLocalizacao";
import { mensagemErroGeolocalizacao, obterLocalizacaoAtual } from "@/utils/localizacao";

const OPCAO =
  "flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-black/5 bg-white px-3 text-left hover:bg-pc-verde-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700 disabled:opacity-60";

function mensagemErroBusca(erro) {
  const status = erro?.response?.status;
  if (status === 404) return "Não encontramos esse CEP ou cidade. Confira e tente de novo.";
  if (status === 400) return "Digite um CEP com 8 números ou o nome de uma cidade.";
  if (status === 429) return "Muitas buscas seguidas. Aguarde alguns minutos e tente de novo.";
  return "Não foi possível buscar a localização agora. Tente de novo em instantes.";
}

/** Endereço do perfil do cliente (o banco guarda um por pessoa). Visitante e lojista: nenhum. */
function useEnderecoDoPerfil(ativo) {
  const [endereco, setEndereco] = useState(null);
  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    api
      .get("/usuarios/me")
      .then(({ data }) => {
        if (vivo && data?.cidade && data?.uf) setEndereco(data);
      })
      .catch((err) => console.error("Erro ao carregar o endereço do perfil:", err?.response?.status ?? err?.message));
    return () => {
      vivo = false;
    };
  }, [ativo]);
  return endereco;
}

/**
 * Painel "Onde você está?": usar a localização atual, o endereço do perfil ou digitar CEP/cidade.
 * A escolha vale para a home e fica salva no navegador.
 */
export function PainelLocalizacao({ usuario, aoFechar }) {
  const { definirLocalizacao } = useLocalizacao();
  const tituloId = useId();
  const painelRef = useRef(null);
  const [estado, setEstado] = useState({ carregando: null, erro: "" });
  const [texto, setTexto] = useState("");
  const endereco = useEnderecoDoPerfil(usuario?.tipo === "cliente");

  useEffect(() => {
    const anterior = document.activeElement;
    painelRef.current?.querySelector("button, input")?.focus();
    function aoTeclar(evento) {
      if (evento.key === "Escape") aoFechar();
      if (evento.key !== "Tab" || !painelRef.current) return;
      const focaveis = [...painelRef.current.querySelectorAll("button:not([disabled]), input, a[href]")];
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      anterior?.focus?.();
    };
  }, [aoFechar]);

  function escolher(localizacao) {
    definirLocalizacao(localizacao);
    aoFechar();
  }

  async function usarLocalizacaoAtual() {
    setEstado({ carregando: "gps", erro: "" });
    let coords;
    try {
      coords = await obterLocalizacaoAtual();
    } catch (erro) {
      setEstado({ carregando: null, erro: mensagemErroGeolocalizacao(erro) });
      return;
    }
    const atual = { origem: "gps", cidade: null, uf: null, latitude: coords.latitude, longitude: coords.longitude };
    try {
      const { cidade, uf } = await buscarCidadePorCoordenadas(coords.latitude, coords.longitude);
      escolher({ ...atual, cidade, uf });
    } catch {
      // Sem a cidade, a busca por proximidade continua valendo: o botão mostra "Perto de você".
      escolher(atual);
    }
  }

  async function procurar(consulta, origem) {
    setEstado({ carregando: origem, erro: "" });
    try {
      const { cidade, uf, latitude, longitude } = await buscarLocal(consulta);
      escolher({ origem, cidade, uf, latitude, longitude });
    } catch (erro) {
      setEstado({ carregando: null, erro: mensagemErroBusca(erro) });
    }
  }

  function usarEnderecoDoPerfil() {
    const latitude = Number(endereco.latitude);
    const longitude = Number(endereco.longitude);
    if (endereco.latitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)) {
      escolher({ origem: "perfil", cidade: endereco.cidade, uf: endereco.uf, latitude, longitude });
    } else {
      procurar(endereco.cep || `${endereco.cidade} ${endereco.uf}`, "perfil");
    }
  }

  const ocupado = Boolean(estado.carregando);
  const iconeCarregando = <LoaderCircle size={20} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onPointerDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="w-full max-w-md rounded-t-[28px] bg-pc-fundo p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-pc-texto shadow-xl md:rounded-[24px]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id={tituloId} className="text-lg font-bold">
            Onde você está?
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2">
          <button type="button" onClick={usarLocalizacaoAtual} disabled={ocupado} className={OPCAO}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pc-verde-100 text-pc-verde-700">
              {estado.carregando === "gps" ? iconeCarregando : <LocateFixed size={20} aria-hidden="true" />}
            </span>
            <span>
              <span className="block text-sm font-semibold">Usar minha localização atual</span>
              <span className="block text-xs text-pc-texto-suave">
                {estado.carregando === "gps" ? "Procurando sua localização…" : "O navegador vai pedir sua permissão"}
              </span>
            </span>
          </button>

          {endereco && (
            <button type="button" onClick={usarEnderecoDoPerfil} disabled={ocupado} className={OPCAO}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pc-verde-100 text-pc-verde-700">
                {estado.carregando === "perfil" ? iconeCarregando : <Home size={20} aria-hidden="true" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Meu endereço</span>
                <span className="block truncate text-xs text-pc-texto-suave">
                  {[endereco.logradouro && `${endereco.logradouro}${endereco.numero ? `, ${endereco.numero}` : ""}`, `${endereco.cidade} - ${endereco.uf}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </button>
          )}

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (texto.trim()) procurar(texto.trim(), "busca");
            }}
            className="flex gap-2"
          >
            <label htmlFor="local-busca" className="sr-only">
              CEP ou cidade
            </label>
            <input
              id="local-busca"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={80}
              autoComplete="postal-code"
              placeholder="Digite seu CEP ou cidade"
              className="h-12 min-w-0 flex-1 rounded-pc-pill border border-black/10 bg-white px-4 text-sm placeholder:text-pc-texto-suave focus:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-700"
            />
            <button
              type="submit"
              disabled={ocupado || !texto.trim()}
              aria-label="Buscar CEP ou cidade"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pc-verde-700 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pc-verde-900 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {estado.carregando === "busca" ? iconeCarregando : <Search size={20} aria-hidden="true" />}
            </button>
          </form>
        </div>

        <p role="alert" className="mt-3 min-h-[1.25rem] text-sm text-red-700">
          {estado.erro}
        </p>

        <p className="mt-1 text-[11px] text-pc-texto-suave">
          Dados de localização ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
            OpenStreetMap
          </a>
        </p>
      </div>
    </div>
  );
}
