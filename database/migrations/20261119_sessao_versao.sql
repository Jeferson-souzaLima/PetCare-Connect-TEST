-- "Manter conectado": versão da sessão longa (30 dias) de cada conta.
-- Execute uma única vez no banco de dados petcare, depois do backup e ANTES do deploy.
-- Aumentar a versão invalida todos os logins "manter conectado" da conta
-- (feito ao redefinir a senha e ao excluir a conta).
ALTER TABLE usuarios
    ADD COLUMN sessao_versao INT UNSIGNED NOT NULL DEFAULT 0 AFTER senha_reset_expira_em;
