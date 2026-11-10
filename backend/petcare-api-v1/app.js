require('dotenv').config();

const express = require('express');
const path = require('path');
const db = require('./db');

// Rotas
const usuariosRoutes = require('./Routes/usuarios');
const lojasRoutes = require('./Routes/lojas');
const produtosRoutes = require('./Routes/produtos');
const servicosRoutes = require('./Routes/servicos');
const pedidosRoutes = require('./Routes/pedidos');
const authRoutes = require('./Routes/auth');
const petsRoutes = require('./Routes/pets');
const agendaLojistaRoutes = require('./Routes/agendaLojista');
const agendamentosRoutes = require('./Routes/agendamentos');
const buscaRoutes = require('./Routes/busca');
const favoritosRoutes = require('./Routes/favoritos');
const geolocalizacaoRoutes = require("./Routes/geolocalizacao");
const pagamentosRoutes = require('./Routes/pagamentos');
const relatoriosRoutes = require('./Routes/relatorios');
const pedidosModel = require('./Models/pedidosModel');
const cepRoutes = require('./Routes/cep');
const { registrarErroInterno } = require('./utils/erroInterno');
const { aplicarSegurancaHttp } = require('./middlewares/segurancaHttp');
const tratarErros = require('./middlewares/tratarErros');

const app = express();

// Não confiar em X-Forwarded-For: o Render repassa valores enviados pelo cliente
// e não documenta quantos proxies existem. O IP real para o rate limit vem do
// CF-Connecting-IP (ver middlewares/rateLimitAuth.js).
app.set('trust proxy', false);

// Cabeçalhos de segurança e CORS
aplicarSegurancaHttp(app);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check usado pelo Render.
app.get('/health', (_req, res) => {
    db.ping((error) => {
        if (error) {
            console.error('Health check do banco falhou:', error.code || 'DB_CONNECTION_ERROR');
            return res.status(503).json({ status: 'unavailable', database: 'disconnected' });
        }
        return res.status(200).json({ status: 'ok', database: 'connected' });
    });
});

// Rotas
app.use('/usuarios', usuariosRoutes);
app.use('/lojas', lojasRoutes);
app.use('/produtos', produtosRoutes);
app.use('/servicos', servicosRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/auth', authRoutes);
app.use('/pets', petsRoutes);
app.use('/historico', require('./Routes/historicoUsuario'));
app.use('/agenda-lojista', agendaLojistaRoutes);
app.use('/agendamentos', agendamentosRoutes);
app.use('/busca', buscaRoutes);
app.use('/favoritos', favoritosRoutes);
app.use('/geolocalizacao', geolocalizacaoRoutes);
app.use('/pagamentos', pagamentosRoutes);
app.use('/relatorios', relatoriosRoutes);
app.use('/cep', cepRoutes);

// Erros que escapam das rotas (upload recusado, JSON malformado, etc.)
app.use(tratarErros);

// Libera reservas de estoque expiradas. O pagamento aprovado fora da janela não confirma o pedido.
setInterval(() => pedidosModel.cancelarReservasExpiradas((err) => {
    if (err) registrarErroInterno('app: liberar reservas expiradas', err);
}), 60 * 1000).unref();

// Inicia o servidor
const PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error('PORT deve ser um número de porta válido.');
}
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${ PORT }`);
});
