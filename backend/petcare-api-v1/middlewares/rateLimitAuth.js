const { isIP } = require('node:net');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/*
 * IP real do cliente.
 *
 * No Render, todo o tráfego passa pela Cloudflare antes dos balanceadores do
 * Render, e o número de proxies no caminho não é documentado. Por isso não
 * usamos 'trust proxy' com contagem de saltos nem o X-Forwarded-For (que o
 * Render repassa com os valores enviados pelo próprio cliente).
 *
 * Usamos o CF-Connecting-IP, que a Cloudflare define com o IP de quem se
 * conectou e não aceita vindo do cliente. Sem esse cabeçalho (ambiente local),
 * usamos o IP do socket (req.ip com 'trust proxy' desligado).
 *
 * Se a hospedagem deixar de passar pela Cloudflare, revisar esta função.
 */
function ipDoCliente(req) {
    const ipCloudflare = req.get('cf-connecting-ip')?.trim();

    if (ipCloudflare && isIP(ipCloudflare)) {
        return ipCloudflare;
    }

    return req.ip;
}

function criarLimitador({ janelaMs, limite, mensagem, ignorarSucessos = false }) {
    return rateLimit({
        windowMs: janelaMs,
        limit: limite,
        skipSuccessfulRequests: ignorarSucessos,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        // ipKeyGenerator agrupa IPv6 por sub-rede (/56), evitando burla trocando o endereço.
        keyGenerator: (req) => ipKeyGenerator(ipDoCliente(req)),
        handler: (_req, res, _next, opcoes) =>
            res.status(opcoes.statusCode).json({ mensagem, message: mensagem })
    });
}

const QUINZE_MINUTOS = 15 * 60 * 1000;
const UMA_HORA = 60 * 60 * 1000;

module.exports = {
    ipDoCliente,

    // Só tentativas que falham contam: quem acerta a senha não é bloqueado.
    limitarLogin: criarLimitador({
        janelaMs: QUINZE_MINUTOS,
        limite: 10,
        ignorarSucessos: true,
        mensagem: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.'
    }),

    limitarCadastro: criarLimitador({
        janelaMs: UMA_HORA,
        limite: 10,
        mensagem: 'Muitas tentativas de cadastro. Aguarde uma hora e tente novamente.'
    }),

    // Cada reenvio dispara um e-mail (custo e risco de spam).
    limitarReenvioConfirmacao: criarLimitador({
        janelaMs: UMA_HORA,
        limite: 5,
        mensagem: 'Muitos reenvios do e-mail de confirmação. Aguarde uma hora e tente novamente.'
    }),

    // /cep é público e consulta o ViaCEP: o limite evita uso da API como proxy gratuito (M6).
    limitarConsultaCep: criarLimitador({
        janelaMs: QUINZE_MINUTOS,
        limite: 60,
        mensagem: 'Muitas consultas de CEP. Aguarde alguns minutos e tente novamente.'
    })
};
