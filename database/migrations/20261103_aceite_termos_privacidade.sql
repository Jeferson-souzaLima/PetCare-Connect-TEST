-- =====================================================================
-- Aceite dos Termos de Uso e ciência da Política de Privacidade (LGPD)
-- =====================================================================
--
-- NÃO EXECUTADA. Precisa de autorização do responsável pelo projeto.
--
-- O que faz: adiciona três colunas em `usuarios` para guardar quando e
-- qual versão dos documentos cada pessoa aceitou no cadastro.
-- Não altera nem apaga dados existentes.
--
-- Usuários já cadastrados ficam com NULL (não aceitaram estas versões).
-- Pedir o aceite deles é uma decisão à parte (ex.: tela de aceite no login).
--
-- ORDEM DE PUBLICAÇÃO (importante):
--   1. Fazer backup do banco (Aiven) e rodar esta migração.
--   2. Publicar o frontend (Vercel), que passa a enviar `aceiteTermos`.
--   3. Publicar o backend (Render), que passa a exigir o aceite e gravar
--      estas colunas.
--   Se o backend subir antes da migração, os cadastros falham (coluna
--   inexistente). Se subir antes do frontend, a tela antiga não envia o
--   aceite e o cadastro é recusado.
--
-- 1) Conferir antes se as colunas já existem (deve retornar 0 linhas):
--
--   SELECT COLUMN_NAME
--   FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND TABLE_NAME = 'usuarios'
--     AND COLUMN_NAME IN ('termos_aceitos_em', 'termos_versao', 'privacidade_versao');
--
-- 2) Migração:

ALTER TABLE usuarios
    ADD COLUMN termos_aceitos_em DATETIME NULL,
    ADD COLUMN termos_versao VARCHAR(40) NULL,
    ADD COLUMN privacidade_versao VARCHAR(40) NULL;

-- 3) Reversão (só se for preciso voltar atrás; apaga o registro dos aceites):
--
--   ALTER TABLE usuarios
--       DROP COLUMN termos_aceitos_em,
--       DROP COLUMN termos_versao,
--       DROP COLUMN privacidade_versao;
