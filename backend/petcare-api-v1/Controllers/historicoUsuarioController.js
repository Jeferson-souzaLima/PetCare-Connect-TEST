const historicoModel = require('../Models/historicoUsuarioModel');
const { responderErroInterno } = require('../utils/erroInterno');

exports.getHistoricoUsuario = (req, res) => {
    const usuario = req.usuario;

    if (!usuario) {
        return res.status(401).json({ mensagem: 'Usu�rio n�o autenticado.' });
    }

    const usuario_id = usuario.id;

    // ?? Buscar produtos
    historicoModel.getProdutosPorUsuario(usuario_id, (err, produtos) => {
        if (err) return responderErroInterno(res, err, "historicoUsuarioController.getHistoricoUsuario");

        // Agrupar produtos por pedido
        const pedidosMap = {};

        produtos.forEach(item => {
            if (!pedidosMap[item.pedido_id]) {
                pedidosMap[item.pedido_id] = {
                    pedido_id: item.pedido_id,
                    total: item.total,
                    status_atual: item.status_atual,
                    data_pedido: item.data_pedido,
                    itens: [],
                    historico: []
                };
            }

            pedidosMap[item.pedido_id].itens.push({
                nome: item.nome_item,
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario
            });
        });

        const pedidos = Object.values(pedidosMap);

        // Buscar hist�rico de cada pedido
        let pendentes = pedidos.length;

        if (pendentes === 0) {
            return buscarServicos([]);
        }

        pedidos.forEach(pedido => {
            historicoModel.getHistoricoProduto(pedido.pedido_id, (err, hist) => {
                if (!err) pedido.historico = hist;
                pendentes--;
                if (pendentes === 0) buscarServicos(pedidos);
            });
        });
    });

    // ?? Buscar servi�os
    function buscarServicos(produtos) {
        historicoModel.getServicosPorUsuario(usuario_id, (err, servicos) => {
            if (err) return responderErroInterno(res, err, "historicoUsuarioController.buscarServicos");

            let pendentes = servicos.length;

            if (pendentes === 0) {
                return res.json({ produtos, servicos: [] });
            }

            servicos.forEach(servico => {
                historicoModel.getHistoricoServico(servico.agendamento_id, (err, hist) => {
                    if (!err) servico.historico = hist;
                    pendentes--;
                    if (pendentes === 0) {
                        res.json({ produtos, servicos });
                    }
                });
            });
        });
    }
};
