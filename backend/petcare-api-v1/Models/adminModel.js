const { consultar } = require('../utils/transacao');

/*
 * Consultas do painel do administrador. Nunca retornam senha, tokens nem
 * endereço dos usuários: só o necessário para aprovar lojas e dar suporte.
 */

const FILTRO_LOJAS = {
    pendentes: 'WHERE l.ativo = 0',
    ativas: 'WHERE l.ativo = 1',
    todas: ''
};

exports.FILTROS_LOJAS = Object.keys(FILTRO_LOJAS);

exports.listarLojas = (filtro) => consultar(
    `SELECT l.id, l.nome_fantasia, l.razao_social, l.cnpj, l.telefone, l.cidade, l.uf,
            l.ativo, u.nome AS responsavel, u.email, u.email_verificado, u.data_criacao,
            (mp.loja_id IS NOT NULL) AS recebe_online
     FROM lojas l
     INNER JOIN usuarios u ON u.id = l.usuario_id
     LEFT JOIN lojas_mercadopago mp ON mp.loja_id = l.id
     ${FILTRO_LOJAS[filtro]}
     ORDER BY l.ativo ASC, l.id DESC
     LIMIT 200`
);

exports.definirLojaAtiva = async (lojaId, ativo) => {
    const resultado = await consultar('UPDATE lojas SET ativo = ? WHERE id = ?', [ativo ? 1 : 0, lojaId]);
    return resultado.affectedRows > 0;
};

exports.TIPOS_USUARIO = ['cliente', 'lojista', 'admin'];

exports.listarUsuarios = ({ tipo, busca }) => {
    const condicoes = [];
    const valores = [];

    if (tipo) {
        condicoes.push('tipo = ?');
        valores.push(tipo);
    }

    if (busca) {
        condicoes.push('(nome LIKE ? OR email LIKE ?)');
        valores.push(`%${busca}%`, `%${busca}%`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    return consultar(
        `SELECT id, nome, email, tipo, email_verificado, data_criacao
         FROM usuarios
         ${where}
         ORDER BY id DESC
         LIMIT 200`,
        valores
    );
};

exports.listarPedidos = () => consultar(
    `SELECT p.id, p.status, p.total, p.data_pedido,
            l.nome_fantasia AS loja, u.nome AS cliente,
            (SELECT pg.status FROM pagamentos pg
             WHERE pg.tipo_referencia = 'pedido' AND pg.referencia_id = p.id
             ORDER BY pg.id DESC LIMIT 1) AS pagamento_status
     FROM pedidos p
     INNER JOIN lojas l ON l.id = p.loja_id
     INNER JOIN usuarios u ON u.id = p.usuario_id
     ORDER BY p.id DESC
     LIMIT 200`
);
