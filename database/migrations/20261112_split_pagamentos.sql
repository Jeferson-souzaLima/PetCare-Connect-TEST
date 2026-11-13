-- =====================================================================
-- Split de pagamentos: conta Mercado Pago do lojista e comissão
-- =====================================================================
--
-- Por quê: os pagamentos passam a cair direto na conta Mercado Pago do
-- lojista, e o Mercado Pago desconta a comissão da PetCare na hora.
-- Para isso precisamos:
--   - guardar a autorização (tokens OAuth, criptografados) de cada loja;
--   - registrar em cada pagamento a comissão aplicada e a tarifa cobrada
--     pelo Mercado Pago, para mostrar o valor líquido ao lojista;
--   - um status para pagamentos estornados.
--
-- Os tokens ficam numa tabela própria, e não em "lojas", porque várias
-- consultas fazem SELECT * FROM lojas; assim eles nunca chegam a uma
-- resposta da API por engano.
--
-- As colunas de comissão e tarifa ficam NULL nos pagamentos antigos,
-- que foram feitos antes do split.
--
-- ORDEM DE PUBLICAÇÃO: rodar ANTES de publicar o backend desta versão.
-- Escrito para o banco de produção atual (colunas created_at/updated_at).

-- 1) Conta Mercado Pago de cada loja

CREATE TABLE lojas_mercadopago (
  loja_id INT NOT NULL,
  mp_user_id VARCHAR(40) NOT NULL,
  access_token_cifrado TEXT NOT NULL,
  refresh_token_cifrado TEXT NOT NULL,
  token_expira_em DATETIME NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (loja_id),
  CONSTRAINT fk_lojas_mercadopago_loja
    FOREIGN KEY (loja_id) REFERENCES lojas (id) ON DELETE CASCADE
);

-- 2) Comissão, tarifa e status de estorno nos pagamentos

ALTER TABLE pagamentos
  MODIFY COLUMN status ENUM('pendente', 'aprovado', 'recusado', 'cancelado', 'expirado', 'estornado') NULL DEFAULT 'pendente',
  ADD COLUMN comissao_percentual DECIMAL(5,2) NULL AFTER valor,
  ADD COLUMN valor_comissao DECIMAL(10,2) NULL AFTER comissao_percentual,
  ADD COLUMN tarifa_gateway DECIMAL(10,2) NULL AFTER valor_comissao;

-- 3) Um pagamento do Mercado Pago só pode estar ligado a um registro.
--    Protege o estorno e o webhook contra registros duplicados.
--
--    Antes, conferir se já existe duplicidade (deve retornar 0 linhas):
--
--      SELECT gateway_payment_id, COUNT(*) AS n
--      FROM pagamentos
--      WHERE gateway_payment_id IS NOT NULL
--      GROUP BY gateway_payment_id
--      HAVING n > 1;
--
--    Se retornar linhas, NÃO rode o comando abaixo: me envie o resultado.

--    O índice comum idx_gateway_payment, que já existe nessa coluna, é
--    substituído pelo único (que também serve para as buscas).

ALTER TABLE pagamentos
  DROP INDEX idx_gateway_payment,
  ADD UNIQUE KEY uq_pagamentos_gateway_payment_id (gateway_payment_id);

-- 4) Conferir:
--
--   SHOW COLUMNS FROM lojas_mercadopago;
--   SHOW COLUMNS FROM pagamentos;
