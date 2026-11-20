-- Estornos que falharam (ex.: loja sem saldo no Mercado Pago).
-- Execute uma única vez no banco de dados petcare, depois do backup e ANTES do deploy.
--   estorno_pendente_desde: o dinheiro precisa voltar ao cliente (a venda já não existe);
--                           o sistema tenta de novo a cada 30 minutos até conseguir.
--   estorno_ultima_falha_em / estorno_ultimo_erro: última tentativa recusada, para o
--                           painel do admin e para não repetir o mesmo alerta por e-mail.
ALTER TABLE pagamentos
    ADD COLUMN estorno_pendente_desde DATETIME NULL,
    ADD COLUMN estorno_ultima_falha_em DATETIME NULL,
    ADD COLUMN estorno_ultimo_erro VARCHAR(255) NULL,
    ADD KEY idx_pagamentos_estorno_pendente (estorno_pendente_desde);
