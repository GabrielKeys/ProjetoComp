-- ============================================
-- VoltWay Database Seed Data
-- Dados iniciais para desenvolvimento e testes
-- ============================================

-- Limpar dados existentes (cuidado em produção!)
TRUNCATE TABLE reservas CASCADE;
TRUNCATE TABLE veiculos CASCADE;
TRUNCATE TABLE estacoes CASCADE;
TRUNCATE TABLE usuarios CASCADE;

-- Resetar sequências
ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;
ALTER SEQUENCE veiculos_id_seq RESTART WITH 1;
ALTER SEQUENCE estacoes_id_seq RESTART WITH 1;
ALTER SEQUENCE reservas_id_seq RESTART WITH 1;

-- ============================================
-- INSERIR USUÁRIOS
-- ============================================

INSERT INTO usuarios (nome, email, tipo, senha, cidade, estado) VALUES
-- Usuários comuns
('João Silva', 'joao.silva@email.com', 'usuario', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6u', 'São Paulo', 'SP'),
('Maria Santos', 'maria.santos@email.com', 'usuario', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6u', 'Rio de Janeiro', 'RJ'),
('Pedro Oliveira', 'pedro.oliveira@email.com', 'usuario', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6u', 'Belo Horizonte', 'MG'),
('Ana Costa', 'ana.costa@email.com', 'usuario', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6u', 'Brasília', 'DF'),
('Carlos Ferreira', 'carlos.ferreira@email.com', 'usuario', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6u', 'Salvador', 'BA'),
('Lucia Rodrigues', 'lucia.rodrigues@email.com', 'usuario', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6u', 'Fortaleza', 'CE'),

-- Estações de carregamento
('EletroPosto Central', 'contato@eletropostocentral.com', 'estacao', NULL, 'São Paulo', 'SP'),
('VoltStation Shopping', 'admin@voltstationshopping.com', 'estacao', NULL, 'Rio de Janeiro', 'RJ');

-- ============================================
-- INSERIR VEÍCULOS
-- ============================================

INSERT INTO veiculos (usuario_id, modelo, ano, placa, bateria, carga) VALUES
(1, 'Tesla Model 3', 2023, 'ABC-1234', '75 kWh', 'Tipo 2'),
(1, 'BMW i3', 2022, 'DEF-5678', '42 kWh', 'CCS'),
(2, 'Nissan Leaf', 2023, 'GHI-9012', '40 kWh', 'CHAdeMO'),
(2, 'Volkswagen ID.4', 2023, 'JKL-3456', '82 kWh', 'CCS'),
(3, 'Chevrolet Bolt', 2022, 'MNO-7890', '65 kWh', 'CCS'),
(4, 'Hyundai Kona Electric', 2023, 'PQR-1234', '64 kWh', 'CCS'),
(5, 'Audi e-tron', 2023, 'STU-5678', '95 kWh', 'CCS');

-- ============================================
-- INSERIR ESTAÇÕES
-- ============================================

INSERT INTO estacoes (nome, email, rua, numero, cidade, estado, potencia, abertura, fechamento, tempo_espera, preco, ativa) VALUES
('EletroPosto Central', 'contato@eletropostocentral.com', 'Av. Paulista', '1000', 'São Paulo', 'SP', 50, '06:00', '22:00', 15, 0.85, true),
('VoltStation Shopping', 'admin@voltstationshopping.com', 'Av. Copacabana', '500', 'Rio de Janeiro', 'RJ', 22, '08:00', '20:00', 10, 0.75, true),
('EcoCharge Centro', 'contato@ecocharge.com', 'Rua da Liberdade', '200', 'São Paulo', 'SP', 11, '24:00', '24:00', 5, 0.90, true),
('PowerUp Mall', 'info@powerupmall.com', 'Av. Afonso Pena', '3000', 'Belo Horizonte', 'MG', 22, '10:00', '22:00', 20, 0.80, true),
('VoltWay Aeroporto', 'aeroporto@voltway.com', 'Rod. dos Bandeirantes', 'Km 15', 'São Paulo', 'SP', 150, '24:00', '24:00', 0, 1.20, true),
('EletroPosto Norte', 'norte@eletroposto.com', 'Av. Brasil', '1500', 'Rio de Janeiro', 'RJ', 50, '06:00', '23:00', 12, 0.85, true),
('GreenCharge Sul', 'sul@greencharge.com', 'Rua das Flores', '800', 'Brasília', 'DF', 22, '07:00', '19:00', 8, 0.70, true),
('VoltStation Praia', 'praia@voltstation.com', 'Av. Beira Mar', '100', 'Fortaleza', 'CE', 11, '08:00', '18:00', 15, 0.95, true),
('EcoPower Shopping', 'shopping@ecopower.com', 'Av. Paulista', '2000', 'São Paulo', 'SP', 75, '10:00', '22:00', 10, 0.88, true),
('VoltWay Express', 'express@voltway.com', 'Rod. BR-040', 'Km 50', 'Belo Horizonte', 'MG', 100, '24:00', '24:00', 0, 1.10, true),
('EletroPosto Sul', 'sul@eletroposto.com', 'Av. Ipiranga', '500', 'São Paulo', 'SP', 22, '06:00', '22:00', 18, 0.82, true);

-- ============================================
-- INSERIR RESERVAS
-- ============================================

INSERT INTO reservas (usuario_id, estacao_id, veiculo_id, data, hora, status, observacoes) VALUES
(1, 1, 1, '2024-01-15', '14:00', 'confirmada', 'Primeira carga do dia'),
(2, 2, 3, '2024-01-15', '16:30', 'pendente', 'Carga rápida antes do trabalho'),
(3, 4, 5, '2024-01-16', '09:00', 'confirmada', 'Carga completa para viagem'),
(4, 7, 6, '2024-01-16', '11:15', 'concluida', 'Carga realizada com sucesso'),
(5, 5, 7, '2024-01-17', '08:00', 'confirmada', 'Carga no aeroporto'),
(1, 3, 1, '2024-01-17', '19:30', 'pendente', 'Carga noturna'),
(2, 6, 3, '2024-01-18', '13:00', 'confirmada', 'Carga durante almoço'),
(3, 9, 5, '2024-01-18', '15:45', 'cancelada', 'Cancelada por imprevisto'),
(4, 8, 6, '2024-01-19', '10:00', 'pendente', 'Carga na praia'),
(5, 10, 7, '2024-01-19', '12:30', 'confirmada', 'Carga expressa'),
(1, 11, 2, '2024-01-20', '17:00', 'pendente', 'Carga após trabalho'),
(6, 1, 1, '2024-01-20', '20:00', 'confirmada', 'Carga noturna');

-- ============================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================

-- Mostrar estatísticas
SELECT 'usuarios' as tabela, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'veiculos' as tabela, COUNT(*) as registros FROM veiculos
UNION ALL
SELECT 'estacoes' as tabela, COUNT(*) as registros FROM estacoes
UNION ALL
SELECT 'reservas' as tabela, COUNT(*) as registros FROM reservas
ORDER BY tabela;

-- Mostrar alguns dados de exemplo
SELECT '=== USUÁRIOS ===' as info;
SELECT id, nome, email, tipo, cidade FROM usuarios LIMIT 5;

SELECT '=== VEÍCULOS ===' as info;
SELECT v.id, v.modelo, v.placa, u.nome as dono FROM veiculos v JOIN usuarios u ON v.usuario_id = u.id LIMIT 5;

SELECT '=== ESTAÇÕES ===' as info;
SELECT id, nome, cidade, potencia, preco FROM estacoes LIMIT 5;

SELECT '=== RESERVAS ===' as info;
SELECT r.id, u.nome as usuario, e.nome as estacao, r.data, r.hora, r.status 
FROM reservas r 
JOIN usuarios u ON r.usuario_id = u.id 
JOIN estacoes e ON r.estacao_id = e.id 
LIMIT 5;

-- ============================================
-- MENSAGEM DE SUCESSO
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Dados iniciais inseridos com sucesso!';
    RAISE NOTICE '👥 Usuários: 8 registros (6 usuários + 2 estações)';
    RAISE NOTICE '🚗 Veículos: 7 registros';
    RAISE NOTICE '⚡ Estações: 11 registros';
    RAISE NOTICE '📅 Reservas: 12 registros';
    RAISE NOTICE '🎉 Banco de dados pronto para uso!';
END $$;
