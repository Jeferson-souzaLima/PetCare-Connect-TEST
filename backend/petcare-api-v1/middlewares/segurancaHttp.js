const cors = require('cors');
const helmet = require('helmet');

/*
 * Origens que podem chamar a API pelo navegador: CORS_ORIGIN (separadas por
 * vírgula) mais o domínio atual do site na Vercel.
 */
function origensPermitidas() {
    return [...new Set([
        ...(process.env.CORS_ORIGIN || 'http://localhost:5173')
            .split(',')
            .map((origem) => origem.trim())
            .filter(Boolean),
        'https://mvp-beige-sigma.vercel.app'
    ])];
}

/** Cabeçalhos de segurança (M3) e CORS (B4) aplicados a todas as rotas. */
function aplicarSegurancaHttp(app) {
    // Não anunciar o framework usado.
    app.disable('x-powered-by');

    app.use(helmet({
        // As imagens em /uploads são exibidas pelo site, que está em outro domínio.
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));

    // O site envia o token no cabeçalho Authorization, não em cookies:
    // não há motivo para liberar credenciais entre origens.
    app.use(cors({ origin: origensPermitidas() }));
}

module.exports = { aplicarSegurancaHttp, origensPermitidas };
