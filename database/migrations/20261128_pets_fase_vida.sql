-- Pets: a idade em anos vira a fase de vida (Filhote, Adulto, Sênior), como no novo cadastro.
-- Execute uma única vez no banco de dados petcare, depois do backup e ANTES do deploy do backend.
-- Conversão da idade já salva: 0 = filhote; 1 a 7 = adulto; 8 ou mais = sênior; sem idade = sem fase.
-- A coluna idade é removida depois da conversão (o site deixa de usá-la).
ALTER TABLE pets
    ADD COLUMN fase_vida ENUM('filhote', 'adulto', 'senior') NULL DEFAULT NULL AFTER raca;

UPDATE pets
SET fase_vida = CASE
    WHEN idade IS NULL THEN NULL
    WHEN idade < 1 THEN 'filhote'
    WHEN idade <= 7 THEN 'adulto'
    ELSE 'senior'
END;

ALTER TABLE pets DROP COLUMN idade;
