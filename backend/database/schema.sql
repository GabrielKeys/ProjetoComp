-- ============================================
-- VoltWay Database Schema
-- Sistema de Carregamento para Veículos Elétricos
-- ============================================

-- Remover tabelas existentes (se houver) na ordem correta devido às FKs
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS veiculos CASCADE;
DROP TABLE IF EXISTS estacoes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Remover tipos ENUM existentes
DROP TYPE IF EXISTS tipo_usuario CASCADE;
DROP TYPE IF EXISTS status_reserva CASCADE;

-- ============================================
-- CRIAÇÃO DOS TIPOS ENUM
-- ============================================

-- Tipo de usuário: diferencia usuário comum de estação de carregamento
CREATE TYPE tipo_usuario AS ENUM ('usuario', 'estacao');

-- Status das reservas
CREATE TYPE status_reserva AS ENUM ('pendente', 'confirmada', 'cancelada', 'concluida');

-- ============================================
-- TABELA: usuarios
-- Armazena usuários do sistema e estações de carregamento
-- ============================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    tipo tipo_usuario NOT NULL DEFAULT 'usuario',
    senha VARCHAR(255), -- Hash da senha (bcrypt recomendado)
    cidade VARCHAR(100),
    estado VARCHAR(50),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar consultas
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_cidade_estado ON usuarios(cidade, estado);

-- ============================================
-- TABELA: veiculos
-- Armazena informações dos veículos dos usuários
-- ============================================
CREATE TABLE veiculos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    modelo VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
    placa VARCHAR(20) NOT NULL UNIQUE,
    bateria VARCHAR(50), -- Ex: "75 kWh", "100 kWh"
    carga VARCHAR(50), -- Ex: "Tipo 2", "CCS", "CHAdeMO"
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar consultas
CREATE INDEX idx_veiculos_usuario_id ON veiculos(usuario_id);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);

-- ============================================
-- TABELA: estacoes
-- Armazena informações das estações de carregamento
-- ============================================
CREATE TABLE estacoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rua VARCHAR(255) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    potencia INTEGER NOT NULL CHECK (potencia > 0), -- kW
    abertura TIME NOT NULL,
    fechamento TIME NOT NULL,
    tempo_espera INTEGER DEFAULT 0 CHECK (tempo_espera >= 0), -- minutos
    preco DECIMAL(10,4) NOT NULL CHECK (preco >= 0), -- R$/kWh
    ativa BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar consultas
CREATE INDEX idx_estacoes_cidade_estado ON estacoes(cidade, estado);
CREATE INDEX idx_estacoes_ativa ON estacoes(ativa);
CREATE INDEX idx_estacoes_preco ON estacoes(preco);

-- ============================================
-- TABELA: reservas
-- Armazena as reservas de carregamento
-- ============================================
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estacao_id INTEGER NOT NULL REFERENCES estacoes(id) ON DELETE CASCADE,
    veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    status status_reserva DEFAULT 'pendente',
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimizar consultas
CREATE INDEX idx_reservas_usuario_id ON reservas(usuario_id);
CREATE INDEX idx_reservas_estacao_id ON reservas(estacao_id);
CREATE INDEX idx_reservas_data_hora ON reservas(data, hora);
CREATE INDEX idx_reservas_status ON reservas(status);

-- Constraint para evitar reservas duplicadas no mesmo horário
CREATE UNIQUE INDEX idx_reservas_unicas 
ON reservas(estacao_id, data, hora) 
WHERE status IN ('pendente', 'confirmada');

-- ============================================
-- TRIGGERS PARA ATUALIZAR timestamp
-- ============================================

-- Função para atualizar o campo atualizado_em
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para cada tabela
CREATE TRIGGER trigger_usuarios_atualizado_em
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_veiculos_atualizado_em
    BEFORE UPDATE ON veiculos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_estacoes_atualizado_em
    BEFORE UPDATE ON estacoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_reservas_atualizado_em
    BEFORE UPDATE ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View com informações completas das reservas
CREATE VIEW vw_reservas_completas AS
SELECT 
    r.id,
    r.data,
    r.hora,
    r.status,
    r.observacoes,
    r.criado_em,
    u.nome as usuario_nome,
    u.email as usuario_email,
    v.modelo as veiculo_modelo,
    v.placa as veiculo_placa,
    e.nome as estacao_nome,
    e.cidade as estacao_cidade,
    e.estado as estacao_estado,
    e.preco as estacao_preco
FROM reservas r
JOIN usuarios u ON r.usuario_id = u.id
JOIN veiculos v ON r.veiculo_id = v.id
JOIN estacoes e ON r.estacao_id = e.id;

-- View com estatísticas das estações
CREATE VIEW vw_estatisticas_estacoes AS
SELECT 
    e.id,
    e.nome,
    e.cidade,
    e.estado,
    e.potencia,
    e.preco,
    COUNT(r.id) as total_reservas,
    COUNT(CASE WHEN r.status = 'confirmada' THEN 1 END) as reservas_confirmadas,
    COUNT(CASE WHEN r.status = 'cancelada' THEN 1 END) as reservas_canceladas,
    AVG(e.tempo_espera) as tempo_espera_medio
FROM estacoes e
LEFT JOIN reservas r ON e.id = r.estacao_id
GROUP BY e.id, e.nome, e.cidade, e.estado, e.potencia, e.preco;

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE usuarios IS 'Usuários do sistema (pessoas físicas e estações de carregamento)';
COMMENT ON TABLE veiculos IS 'Veículos elétricos cadastrados pelos usuários';
COMMENT ON TABLE estacoes IS 'Estações de carregamento disponíveis';
COMMENT ON TABLE reservas IS 'Reservas de carregamento realizadas pelos usuários';

COMMENT ON COLUMN usuarios.tipo IS 'Diferencia usuário comum (usuario) de estação de carregamento (estacao)';
COMMENT ON COLUMN veiculos.bateria IS 'Capacidade da bateria (ex: 75 kWh)';
COMMENT ON COLUMN veiculos.carga IS 'Tipo de carregamento suportado (ex: Tipo 2, CCS, CHAdeMO)';
COMMENT ON COLUMN estacoes.potencia IS 'Potência da estação em kW';
COMMENT ON COLUMN estacoes.tempo_espera IS 'Tempo médio de espera em minutos';
COMMENT ON COLUMN estacoes.preco IS 'Preço por kWh em reais';

-- ============================================
-- MENSAGEM DE SUCESSO
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Schema VoltWay criado com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: usuarios, veiculos, estacoes, reservas';
    RAISE NOTICE '🔍 Views criadas: vw_reservas_completas, vw_estatisticas_estacoes';
    RAISE NOTICE '⚡ Triggers de timestamp configurados';
    RAISE NOTICE '🚀 Banco de dados pronto para uso!';
END $$;