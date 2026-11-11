-- =====================================================================
-- RASCUNHO — NÃO EXECUTAR
-- Categorias de produto (grade de categorias da nova home)
-- =====================================================================
--
-- Status: proposta para uma tarefa separada. Precisa de aprovação dos
-- responsáveis, de backup do banco e de código que use as categorias
-- (filtro em GET /produtos e campo no cadastro de produto do lojista).
--
-- O que faz:
--   1. Cria a tabela categorias_produto.
--   2. Adiciona produtos.categoria_id (NULL), com FK ON DELETE SET NULL.
--   3. Cadastra as 7 categorias do mockup.
-- Não altera nem apaga dados existentes: os produtos atuais ficam sem
-- categoria (NULL) até o lojista escolher uma.
--
-- Ordem de publicação: backup -> esta migração -> backend -> frontend.
-- O código atual continua funcionando com as colunas novas.
--
-- 1) Pré-checagem (deve retornar 0 linhas):
--
--   SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND ((TABLE_NAME = 'categorias_produto')
--       OR (TABLE_NAME = 'produtos' AND COLUMN_NAME = 'categoria_id'));
--
-- 2) Migração:

CREATE TABLE categorias_produto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(60) NOT NULL,
    slug VARCHAR(60) NOT NULL UNIQUE,
    icone VARCHAR(40) NULL,
    ordem SMALLINT NOT NULL DEFAULT 0
);

ALTER TABLE produtos
    ADD COLUMN categoria_id INT NULL,
    ADD CONSTRAINT fk_produtos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias_produto (id)
        ON DELETE SET NULL;

INSERT INTO categorias_produto (nome, slug, icone, ordem) VALUES
    ('Rações', 'racoes', 'shopping-bag', 1),
    ('Petiscos', 'petiscos', 'bone', 2),
    ('Higiene e Beleza', 'higiene-beleza', 'sparkles', 3),
    ('Saúde Veterinária', 'saude-veterinaria', 'stethoscope', 4),
    ('Brinquedos', 'brinquedos', 'puzzle', 5),
    ('Conforto e Bem-estar', 'conforto-bem-estar', 'bed', 6),
    ('Higiene Bucal', 'higiene-bucal', 'smile', 7);

-- 3) Reversão (só se for preciso voltar atrás):
--
--   ALTER TABLE produtos DROP FOREIGN KEY fk_produtos_categoria, DROP COLUMN categoria_id;
--   DROP TABLE categorias_produto;
