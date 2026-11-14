-- Registro das buscas feitas na página de resultados, para o ranking do admin.
-- Execute uma única vez no banco de dados petcare, depois do backup.
-- Não guarda usuário nem IP: só o termo normalizado, a quantidade de resultados e a data.
CREATE TABLE buscas_realizadas (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    termo VARCHAR(100) NOT NULL,
    total_resultados INT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_buscas_realizadas_created_at (created_at)
);
