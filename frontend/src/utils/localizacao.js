// Localização: posição do navegador e regras da localização escolhida pela pessoa
// (lerLocalizacao, salvarLocalizacao, rótulo e mensagens testados em localizacao.test.js).

/**
 * Obtém a posição atual do dispositivo pelo navegador.
 * Rejeita com o erro original da Geolocation API (code 1, 2 ou 3).
 */
export function obterLocalizacaoAtual() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalização não é suportada neste dispositivo."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}


export const CHAVE_LOCALIZACAO = "petcare_localizacao";

function armazenamentoPadrao() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function coordenadaValida(valor, limite) {
  return typeof valor === "number" && Number.isFinite(valor) && Math.abs(valor) <= limite;
}

/** Localização salva no navegador, ou null se não houver, estiver corrompida ou o armazenamento falhar. */
export function lerLocalizacao(armazenamento = armazenamentoPadrao()) {
  try {
    const bruto = armazenamento?.getItem(CHAVE_LOCALIZACAO);
    if (!bruto) return null;
    const { origem, cidade, uf, latitude, longitude } = JSON.parse(bruto);
    if (!coordenadaValida(latitude, 90) || !coordenadaValida(longitude, 180)) return null;
    return { origem, cidade: cidade ?? null, uf: uf ?? null, latitude, longitude };
  } catch {
    return null;
  }
}

/** Salva (ou apaga, com null) a localização. Uma falha do armazenamento não quebra a página. */
export function salvarLocalizacao(localizacao, armazenamento = armazenamentoPadrao()) {
  try {
    if (!localizacao) armazenamento?.removeItem(CHAVE_LOCALIZACAO);
    else armazenamento?.setItem(CHAVE_LOCALIZACAO, JSON.stringify(localizacao));
  } catch {
    // Navegação privada ou armazenamento cheio: a escolha vale só até recarregar.
  }
}

/** Texto do botão de localização no cabeçalho. */
export function rotuloLocalizacao({ localizacao, usuario }) {
  if (localizacao?.cidade && localizacao?.uf) return `${localizacao.cidade} - ${localizacao.uf}`;
  if (localizacao) return "Perto de você";
  if (usuario?.cidade && usuario?.uf) return `${usuario.cidade} - ${usuario.uf}`;
  return "Definir localização";
}

/** Mensagem clara para cada falha do navegador ao pegar a localização (GeolocationPositionError). */
export function mensagemErroGeolocalizacao(erro) {
  switch (erro?.code) {
    case 1:
      return "Você não permitiu o acesso à localização. Libere a permissão nas configurações do navegador ou digite seu CEP ou cidade.";
    case 2:
      return "Não conseguimos descobrir sua localização agora. Confira se o GPS está ligado ou digite seu CEP ou cidade.";
    case 3:
      return "A localização demorou demais para responder. Tente de novo ou digite seu CEP ou cidade.";
    default:
      return "Este navegador não oferece localização. Digite seu CEP ou cidade.";
  }
}
