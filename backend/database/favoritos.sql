-- ============================================
-- VoltWay - Tabela de Favoritos
-- Adiciona funcionalidade de estações favoritas
-- ============================================

-- Criar tabela de favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estacao_id INTEGER NOT NULL REFERENCES estacoes(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint para evitar favoritos duplicados
    CONSTRAINT unique_favorito UNIQUE (usuario_id, estacao_id)
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario_id ON favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_estacao_id ON favoritos(estacao_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_criado_em ON favoritos(criado_em);

-- Trigger para atualizar timestamp
CREATE TRIGGER trigger_favoritos_atualizado_em
    BEFORE UPDATE ON favoritos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- View para favoritos com informações completas
CREATE OR REPLACE VIEW vw_favoritos_completos AS
SELECT 
    f.id,
    f.criado_em,
    u.id as usuario_id,
    u.nome as usuario_nome,
    u.email as usuario_email,
    e.id as estacao_id,
    e.nome as estacao_nome,
    e.cidade as estacao_cidade,
    e.estado as estacao_estado,
    e.potencia as estacao_potencia,
    e.preco as estacao_preco,
    e.ativa as estacao_ativa
FROM favoritos f
JOIN usuarios u ON f.usuario_id = u.id
JOIN estacoes e ON f.estacao_id = e.id;

-- Comentários
COMMENT ON TABLE favoritos IS 'Estações favoritas dos usuários';
COMMENT ON COLUMN favoritos.usuario_id IS 'ID do usuário que favoritou';
COMMENT ON COLUMN favoritos.estacao_id IS 'ID da estação favoritada';

-- Inserir alguns favoritos de exemplo
INSERT INTO favoritos (usuario_id, estacao_id) VALUES
(1, 1), -- João favoritou EletroPosto Central
(1, 3), -- João favoritou EcoCharge Centro
(2, 2), -- Maria favoritou VoltStation Shopping
(2, 6), -- Maria favoritou EletroPosto Norte
(3, 4), -- Pedro favoritou PowerUp Mall
(3, 10), -- Pedro favoritou VoltWay Express
(4, 7), -- Ana favoritou GreenCharge Sul
(5, 5); -- Carlos favoritou VoltWay Aeroporto

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela de favoritos criada com sucesso!';
    RAISE NOTICE '📊 Favoritos de exemplo inseridos: 8 registros';
    RAISE NOTICE '🔍 View vw_favoritos_completos criada';
    RAISE NOTICE '🚀 Funcionalidade de favoritos pronta!';
END $$;
