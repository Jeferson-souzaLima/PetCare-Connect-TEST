const db = require('../db');
const Agendamentos = require('../Models/agendamentosModel');
const Servicos = require('../Models/servicosModel');
const AgendaConfig = require('../Models/agendaConfigModel');
const AgendaDisponibilidade = require('../Models/agendaDisponibilidadeModel');
const AgendaBloqueios = require('../Models/agendaBloqueiosModel');
const { responderErroInterno } = require('../utils/erroInterno');
const { podeAcessar, podeAcessarReferencia } = require('../utils/acessoRegistro');

exports.criarAgendamento = (req, res) => {

    const { servico_id, data_inicio,observacoes, pet_nome } = req.body;
    const usuario = req.usuario;

    if (!servico_id) {
        return res.status(400).json({
            message: 'Serviço é obrigatório.'
        });
    }

    if (!pet_nome) {
        return res.status(400).json({
            message: 'Selecione um pet.'
        });
    }

    if (!data_inicio) {
        return res.status(400).json({
            message: 'Selecione uma data e horário.'
        });
    }

    const inicio = new Date(data_inicio);

    if (isNaN(inicio.getTime())) {
        return res.status(400).json({ message: 'Data inválida.' });
    }

    // ?? Não permitir passado
    if (inicio < new Date()) {
        return res.status(400).json({ message: 'Não é possível agendar no passado.' });
    }

    // 1?? Buscar serviço
    Servicos.getById(servico_id, (err, servico) => {

        if (err) return responderErroInterno(res, err, "agendamentosController.criarAgendamento");
        if (!servico || servico.ativo !== 1) {
            return res.status(404).json({ message: 'Serviço inválido ou inativo.' });
        }

        const loja_id = servico.loja_id;
        const duracao = servico.duracao_min;
        const fim = new Date(inicio.getTime() + duracao * 60000);

        // 2?? Buscar configuração da agenda
        AgendaConfig.getByLojaId(loja_id, (err, config) => {

            if (err) return responderErroInterno(res, err, "agendamentosController.criarAgendamento");
            if (!config) {
                return res.status(400).json({ message: 'Agenda não configurada para esta loja.' });
            }

            // ?? Regra dias_limite_agendamento
            const limite = new Date();
            limite.setDate(limite.getDate() + config.dias_limite_agendamento);

            if (inicio > limite) {
                return res.status(400).json({
                    message: `Agendamentos permitidos apenas para os próximos ${config.dias_limite_agendamento} dias.`
                });
            }

            // ? Validar intervalo_minutos
            const minutos = inicio.getMinutes();
            if (minutos % config.intervalo_minutos !== 0) {
                return res.status(400).json({
                    message: `Horários permitidos de ${config.intervalo_minutos} em ${config.intervalo_minutos} minutos.`
                });
            }

            // 3?? Validar disponibilidade (se não for 24h)
            const validarDisponibilidade = (callback) => {

                if (config.trabalha_24h === 1) {
                    return callback();
                }

                const diaSemana = inicio.getDay(); // 0 = domingo

                AgendaDisponibilidade.getByLojaEDia(loja_id, diaSemana, (err, horarios) => {

                    if (err) return responderErroInterno(res, err, "agendamentosController.criarAgendamento");
                    if (!horarios || horarios.length === 0) {
                        return res.status(400).json({ message: 'Loja não atende neste dia.' });
                    }

                    const horaInicio = inicio.toTimeString().slice(0, 5);
                    const horaFim = fim.toTimeString().slice(0, 5);

                    const dentroDoHorario = horarios.some(h => {
                        return horaInicio >= h.hora_inicio && horaFim <= h.hora_fim;
                    });

                    if (!dentroDoHorario) {
                        return res.status(400).json({ message: 'Horário fora do expediente.' });
                    }

                    callback();
                });
            };

            validarDisponibilidade(() => {

                // 4?? Validar bloqueios
                AgendaBloqueios.existeBloqueio(loja_id, inicio, fim, (err, bloqueado) => {

                    if (err) return responderErroInterno(res, err, "agendamentosController.criarAgendamento");

                    if (bloqueado) {
                        return res.status(400).json({ message: 'Horário bloqueado pela loja.' });
                    }

                    // 5?? Validar capacidade
                    Agendamentos.contarNoIntervalo(loja_id, inicio, fim, (err, resultado) => {

                        if (err) return responderErroInterno(res, err, "agendamentosController.criarAgendamento");

                        const total = resultado[0].total;

                        if (total >= config.capacidade_por_horario) {
                            return res.status(400).json({
                                message: 'Horário não disponível.'
                            });
                        }

                        // 6?? Criar agendamento
                        const { cliente_nome_externo, cliente_telefone_externo } = req.body;

                        let novoAgendamento = {
                            loja_id,
                            servico_id,
                            data_inicio: inicio,
                            data_fim: fim,
                            observacoes,
                            pet_nome
                        };

                        // Se for cliente logado
                        if (usuario.tipo === 'cliente') {
                            novoAgendamento.cliente_id = usuario.id;
                            novoAgendamento.status = 'aguardando_pagamento';
                            novoAgendamento.criado_por = 'cliente';
                        }

                        // Se for lojista criando manualmente
                        if (usuario.tipo === 'lojista') {

                            if (!cliente_nome_externo) {
                                return res.status(400).json({
                                    message: 'Nome do cliente é obrigatório para agendamento manual.'
                                });
                            }

                            novoAgendamento.cliente_id = null;
                            novoAgendamento.cliente_nome_externo = cliente_nome_externo;
                            novoAgendamento.cliente_telefone_externo = cliente_telefone_externo || null;
                            novoAgendamento.status = 'confirmado';
                            novoAgendamento.criado_por = 'lojista';
                        }

                        Agendamentos.create(novoAgendamento, (err, result) => {
                            if (err) return responderErroInterno(res, err, "agendamentosController.criarAgendamento");

                            res.status(201).json({
                                message: 'Agendamento criado. Aguardando pagamento.',
                                id: result.insertId
                            });
                        });

                    });

                });

            });

        });

    });

};

exports.getAgendamentosDoLojista = (req, res) => {
    const usuario = req.usuario;
    const { data } = req.query;

    if (usuario.tipo !== 'lojista') {
        return res.status(403).json({ message: 'Acesso permitido apenas para lojistas.' });
    }

    if (!data) {
        return res.status(400).json({ message: 'Data é obrigatória.' });
    }

    // 1?? Buscar loja do lojista
    db.query(
        'SELECT id FROM lojas WHERE usuario_id = ?',
        [usuario.id],
        (err, lojas) => {

            if (err) return responderErroInterno(res, err, "agendamentosController.getAgendamentosDoLojista");

            if (!lojas.length) {
                return res.status(404).json({
                    message: 'Loja não encontrada.'
                });
            }

            const loja_id = lojas[0].id;

            // 2?? Buscar agendamentos da loja naquela data
            db.query(
                `
            SELECT
                a.*,
                s.nome AS servico_nome,
                COALESCE(u.nome, a.cliente_nome_externo) AS cliente_nome
            FROM agendamentos a
            JOIN servicos s ON a.servico_id = s.id
            LEFT JOIN usuarios u ON a.cliente_id = u.id
            WHERE a.loja_id = ?
            AND DATE(a.data_inicio) = ?
            ORDER BY a.data_inicio ASC
            `,
                [loja_id, data],
                (err, agendamentos) => {

                    if (err) return responderErroInterno(res, err, "agendamentosController.getAgendamentosDoLojista");

                    res.json(agendamentos);

                }
            );

        }
    );
};

exports.getAgendamentoPorId = (req, res) => {
    const { id } = req.params;

    db.query(
        `SELECT a.*, 
                s.nome AS servico_nome,
                u.nome AS cliente_nome
         FROM agendamentos a
         JOIN servicos s ON a.servico_id = s.id
         JOIN usuarios u ON a.cliente_id = u.id
         WHERE a.id = ?`,
        [id],
        (err, results) => {
            if (err) return responderErroInterno(res, err, "agendamentosController.getAgendamentoPorId");
            const naoEncontrado = () => res.status(404).json({ message: 'Agendamento não encontrado.' });
            if (!results.length) return naoEncontrado();

            const agendamento = results[0];
            podeAcessar(req.usuario, { donoId: agendamento.cliente_id, lojaId: agendamento.loja_id }, (erroAcesso, pode) => {
                if (erroAcesso) return responderErroInterno(res, erroAcesso, 'agendamentosController.getAgendamentoPorId');
                if (!pode) return naoEncontrado();
                res.json(agendamento);
            });
        }
    );
};

exports.atualizarStatus = (req, res) => {

    const usuario = req.usuario;
    const { id } = req.params;
    const { status } = req.body;

    const statusPermitidos = [
        'aguardando_pagamento',
        'confirmado',
        'em_atendimento',
        'cancelado_cliente',
        'cancelado_loja',
        'concluido'
    ];

    if (!status) {
        return res.status(400).json({
            message: 'Status é obrigatório.'
        });
    }

    if (!statusPermitidos.includes(status)) {
        return res.status(400).json({
            message: 'Status inválido.'
        });
    }

    // Apenas lojistas podem alterar status
    if (usuario.tipo !== 'lojista') {
        return res.status(403).json({
            message: 'Apenas lojistas podem alterar este status.'
        });
    }

    // Buscar loja do lojista
    db.query(
        'SELECT id FROM lojas WHERE usuario_id = ?',
        [usuario.id],
        (err, lojas) => {

            if (err) return responderErroInterno(res, err, "agendamentosController.atualizarStatus");

            if (!lojas.length) {
                return res.status(404).json({
                    message: 'Loja não encontrada.'
                });
            }

            const loja_id = lojas[0].id;

            // Buscar agendamento da loja + status atual
            db.query(
                'SELECT id, status FROM agendamentos WHERE id = ? AND loja_id = ?',
                [id, loja_id],
                (err, agendamentos) => {

                    if (err) return responderErroInterno(res, err, "agendamentosController.atualizarStatus");

                    if (!agendamentos.length) {
                        return res.status(404).json({
                            message: 'Agendamento não encontrado.'
                        });
                    }

                    const statusAtual = agendamentos[0].status;

                    const transicoesPermitidas = {

                        aguardando_pagamento: [],

                        confirmado: [
                            'em_atendimento',
                            'cancelado_loja'
                        ],

                        em_atendimento: [
                            'concluido'
                        ],

                        concluido: [],

                        cancelado_cliente: [],

                        cancelado_loja: []

                    };

                    const transicoes = transicoesPermitidas[statusAtual] || [];

                    if (!transicoes.includes(status)) {
                        return res.status(400).json({
                            message: `Não é possível alterar um agendamento de '${statusAtual}' para '${status}'.`
                        });
                    }

                    db.query(
                        'UPDATE agendamentos SET status = ? WHERE id = ?',
                        [status, id],
                        (err) => {

                            if (err) {
                                return responderErroInterno(res, err, "agendamentosController.atualizarStatus");
                            }

                            res.json({
                                message: 'Status atualizado com sucesso.'
                            });

                        }
                    );

                }
            );

        }
    );

};

exports.deletarAgendamento = (req, res) => {

    const usuario = req.usuario;
    const { id } = req.params;

    if (usuario.tipo !== 'lojista') {
        return res.status(403).json({
            message: 'Apenas lojistas podem deletar agendamentos.'
        });
    }

    // Buscar loja do lojista
    db.query(
        'SELECT id FROM lojas WHERE usuario_id = ?',
        [usuario.id],
        (err, lojas) => {

            if (err) return responderErroInterno(res, err, "agendamentosController.deletarAgendamento");
            if (!lojas || lojas.length === 0) {
                return res.status(404).json({ message: 'Loja não encontrada.' });
            }

            const loja_id = lojas[0].id;

            // Verificar se agendamento pertence à loja
            db.query(
                'SELECT * FROM agendamentos WHERE id = ? AND loja_id = ?',
                [id, loja_id],
                (err, agendamentos) => {

                    if (err) return responderErroInterno(res, err, "agendamentosController.deletarAgendamento");

                    if (!agendamentos || agendamentos.length === 0) {
                        return res.status(404).json({
                            message: 'Agendamento não encontrado.'
                        });
                    }

                    // Deletar
                    db.query(
                        'DELETE FROM agendamentos WHERE id = ?',
                        [id],
                        (err) => {

                            if (err) return responderErroInterno(res, err, "agendamentosController.deletarAgendamento");

                            res.json({
                                message: 'Agendamento deletado com sucesso.'
                            });

                        }
                    );
                }
            );
        }
    );
};

exports.getAgendamentosPorPedido = (req, res) => {
    const { pedido_id } = req.params;

    podeAcessarReferencia(req.usuario, 'pedido', pedido_id, (erroAcesso, pode) => {
        if (erroAcesso) return responderErroInterno(res, erroAcesso, 'agendamentosController.getAgendamentosPorPedido');
        if (!pode) return res.status(404).json({ message: 'Pedido não encontrado.' });

        listarAgendamentosDoPedido(pedido_id, res);
    });
};

function listarAgendamentosDoPedido(pedido_id, res) {
    db.query(
        'SELECT * FROM agendamentos WHERE pedido_id = ?',
        [pedido_id],
        (err, results) => {
            if (err) return responderErroInterno(res, err, "agendamentosController.getAgendamentosPorPedido");

            res.json(results);
        }
    );
}

exports.criarAgendamentoManual = (req, res) => {
    const usuario = req.usuario;

    if (usuario.tipo !== 'lojista') {
        return res.status(403).json({ message: 'Apenas lojistas podem criar agendamentos manuais.' });
    }

    const { servico_id, data_inicio, cliente_nome_externo, cliente_telefone_externo, pet_nome, observacoes } = req.body;

    if (!servico_id || !data_inicio || !cliente_nome_externo) {
        return res.status(400).json({
            message: 'Serviço, data e nome do cliente são obrigatórios.'
        });
    }

    const inicio = new Date(data_inicio);

    if (isNaN(inicio.getTime())) {
        return res.status(400).json({ message: 'Data inválida.' });
    }

    // Loja do lojista
    const loja_id = usuario.loja_id;

    if (!loja_id) {
        return res.status(403).json({ message: 'Loja não identificada.' });
    }

    // Buscar serviço
    db.query(
        'SELECT * FROM servicos WHERE id = ? AND loja_id = ?',
        [servico_id, loja_id],
        (err, servicos) => {

            if (err) return responderErroInterno(res, err, "agendamentosController.criarAgendamentoManual");
            if (!servicos || servicos.length === 0) {
                return res.status(404).json({ message: 'Serviço não encontrado para esta loja.' });
            }

            const servico = servicos[0];
            const duracao = servico.duracao_min;
            const fim = new Date(inicio.getTime() + duracao * 60000);

            const novoAgendamento = {
                loja_id,
                servico_id,
                cliente_id: null,
                cliente_nome_externo,
                cliente_telefone_externo,
                pet_nome,
                data_inicio: inicio,
                data_fim: fim,
                status: 'confirmado',
                criado_por: 'lojista',
                observacoes
            };

            db.query(
                'INSERT INTO agendamentos SET ?',
                novoAgendamento,
                (err, result) => {

                    if (err) return responderErroInterno(res, err, "agendamentosController.criarAgendamentoManual");

                    res.status(201).json({
                        message: 'Agendamento criado manualmente com sucesso.',
                        id: result.insertId
                    });
                }
            );
        }
    );
};

exports.editarAgendamentoManual = (req, res) => {
    const usuario = req.usuario;
    const { id } = req.params;
    const { data_inicio, cliente_nome_externo, cliente_telefone_externo, observacoes } = req.body;

    if (usuario.tipo !== 'lojista') {
        return res.status(403).json({ message: 'Apenas lojistas podem editar agendamentos manuais.' });
    }

    // Buscar loja do lojista
    db.query(
        'SELECT id FROM lojas WHERE usuario_id = ?',
        [usuario.id],
        (err, lojas) => {

            if (err) return responderErroInterno(res, err, "agendamentosController.editarAgendamentoManual");
            if (!lojas || lojas.length === 0) {
                return res.status(404).json({ message: 'Loja não encontrada.' });
            }

            const loja_id = lojas[0].id;

            // Buscar agendamento
            db.query(
                'SELECT * FROM agendamentos WHERE id = ? AND loja_id = ?',
                [id, loja_id],
                (err, agendamentos) => {

                    if (err) return responderErroInterno(res, err, "agendamentosController.editarAgendamentoManual");
                    if (!agendamentos || agendamentos.length === 0) {
                        return res.status(404).json({ message: 'Agendamento não encontrado.' });
                    }

                    const agendamento = agendamentos[0];

                    // Só permitir editar agendamento criado pelo lojista
                    if (agendamento.criado_por !== 'lojista') {
                        return res.status(400).json({
                            message: 'Só é possível editar agendamentos criados manualmente.'
                        });
                    }

                    let novoInicio = agendamento.data_inicio;
                    let novoFim = agendamento.data_fim;

                    if (data_inicio) {
                        novoInicio = new Date(data_inicio);
                        if (isNaN(novoInicio.getTime())) {
                            return res.status(400).json({ message: 'Data inválida.' });
                        }

                        const duracaoMin = (agendamento.data_fim - agendamento.data_inicio) / 60000;
                        novoFim = new Date(novoInicio.getTime() + duracaoMin * 60000);
                    }

                    const dadosAtualizados = {
                        data_inicio: novoInicio,
                        data_fim: novoFim,
                        cliente_nome_externo: cliente_nome_externo || agendamento.cliente_nome_externo,
                        cliente_telefone_externo: cliente_telefone_externo || agendamento.cliente_telefone_externo,
                        observacoes: observacoes || agendamento.observacoes
                    };

                    db.query(
                        'UPDATE agendamentos SET ? WHERE id = ?',
                        [dadosAtualizados, id],
                        (err) => {

                            if (err) return responderErroInterno(res, err, "agendamentosController.editarAgendamentoManual");

                            res.json({ message: 'Agendamento atualizado com sucesso.' });
                        }
                    );
                }
            );
        }
    );
};

// ======================
// Para Clientes
// =====================
exports.getMeusAgendamentos = (req, res) => {

    const usuario = req.usuario;

    if (usuario.tipo !== 'cliente') {
        return res.status(403).json({
            message: 'Apenas clientes podem acessar seus agendamentos.'
        });
    }

    const query = `
        SELECT
            a.id,
            a.pet_nome,
            a.data_inicio,
            a.data_fim,
            a.status,
            a.observacoes,

            s.id AS servico_id,
            s.nome AS servico_nome,
            s.preco,
            s.duracao_min,

            l.id AS loja_id,
            l.nome_fantasia,
            l.imagem AS loja_imagem

        FROM agendamentos a

        INNER JOIN servicos s
            ON a.servico_id = s.id

        INNER JOIN lojas l
            ON a.loja_id = l.id

        WHERE a.cliente_id = ?

        ORDER BY a.data_inicio DESC
    `;

    db.query(query, [usuario.id], (err, resultados) => {

        if (err) {
            return responderErroInterno(res, err, "agendamentosController.getMeusAgendamentos");
        }

        res.json(resultados);

    });

};

exports.cancelarAgendamentoCliente = (req, res) => {

    const usuario = req.usuario;
    const { id } = req.params;

    const queryBuscar = `
        SELECT
            id,
            cliente_id,
            status,
            data_inicio
        FROM agendamentos
        WHERE id = ?
    `;

    db.query(queryBuscar, [id], (err, resultados) => {

        if (err) {
            return responderErroInterno(res, err, "agendamentosController.cancelarAgendamentoCliente");
        }

        if (!resultados.length) {
            return res.status(404).json({
                message: "Agendamento não encontrado."
            });
        }

        const agendamento = resultados[0];

        // Verifica se pertence ao cliente
        if (agendamento.cliente_id !== usuario.id) {
            return res.status(403).json({
                message: "Você não pode cancelar este agendamento."
            });
        }

        // Verifica status
        if (!['aguardando_pagamento', 'confirmado'].includes(agendamento.status)) {
            return res.status(400).json({
                message: "Este agendamento não pode mais ser cancelado."
            });
        }

        // Verifica se o horário já começou
        if (new Date(agendamento.data_inicio) <= new Date()) {
            return res.status(400).json({
                message: "O horário do atendimento já começou."
            });
        }

        db.query(
            `UPDATE agendamentos
             SET status = 'cancelado_cliente'
             WHERE id = ?`,
            [id],
            (err) => {

                if (err) {
                    return responderErroInterno(res, err, "agendamentosController.cancelarAgendamentoCliente");
                }

                res.json({
                    message: "Agendamento cancelado com sucesso."
                });

            }
        );

    });

};