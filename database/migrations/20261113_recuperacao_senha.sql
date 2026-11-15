-- Recuperação de senha ("Esqueci minha senha").
-- Execute uma única vez no banco de dados petcare, depois do backup.
-- Guarda só o hash do token; o token em si existe apenas no link do e-mail.
ALTER TABLE usuarios
    ADD COLUMN senha_reset_token_hash CHAR(64) NULL AFTER email_verificacao_expira_em,
    ADD COLUMN senha_reset_expira_em DATETIME NULL AFTER senha_reset_token_hash,
    ADD UNIQUE KEY uq_usuarios_senha_reset_token (senha_reset_token_hash);
