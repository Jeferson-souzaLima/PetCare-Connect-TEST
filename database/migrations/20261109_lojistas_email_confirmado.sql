-- =====================================================================
-- Confirmação de e-mail passa a valer também para lojistas (achado A4)
-- =====================================================================
--
-- Por quê: a partir desta versão, o login de lojista exige e-mail
-- confirmado, como já acontece com clientes. Lojistas cadastrados depois
-- da migração 20260720_confirmacao_email.sql ficaram com
-- email_verificado = 0 sem nunca terem recebido um link. Sem esta
-- migração, eles não conseguiriam entrar (teriam de pedir um novo link).
--
-- O que faz: marca como confirmados apenas os lojistas que não têm um
-- link de confirmação pendente (email_verificacao_token_hash nulo), ou
-- seja, os cadastrados pelo fluxo antigo. Não altera clientes nem
-- lojistas que se cadastrarem pelo fluxo novo.
--
-- ORDEM DE PUBLICAÇÃO: rodar ANTES de publicar o backend desta versão.
--
-- 1) Conferir quantos lojistas serão afetados:
--
--   SELECT id, email FROM usuarios
--   WHERE tipo = 'lojista'
--     AND email_verificado = 0
--     AND email_verificacao_token_hash IS NULL;
--
-- 2) Migração:

UPDATE usuarios
SET email_verificado = 1
WHERE tipo = 'lojista'
  AND email_verificado = 0
  AND email_verificacao_token_hash IS NULL;
