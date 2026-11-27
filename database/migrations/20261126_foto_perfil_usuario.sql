-- Foto de perfil do usuário (URL pública no Cloudflare R2, pasta "usuarios/").
-- Execute uma única vez no banco de dados petcare, depois do backup e ANTES do deploy do backend.
-- Mesmo tamanho da coluna pets.imagem. NULL = sem foto (o site mostra as iniciais do nome).
ALTER TABLE usuarios
    ADD COLUMN foto VARCHAR(255) NULL DEFAULT NULL AFTER telefone;
