-- Seed básico de estações para testes
-- Execute com:
-- psql -U voltway_user -d voltway -h localhost -f ProjetoComp/backend/database/seed_estacoes.sql

INSERT INTO estacoes (nome, email, rua, numero, bairro, cidade, estado, cep, potencia, abertura, fechamento, preco, tempo_espera, ativa)
VALUES
  ('Estação Centro', 'centro@voltway.com', 'Av. Central', '100', 'Centro', 'São Paulo', 'SP', '01000-000', 50, '08:00', '22:00', 2.49, 10, true),
  ('Estação Zona Sul', 'zsul@voltway.com', 'Rua das Flores', '250', 'Jardins', 'São Paulo', 'SP', '01400-000', 22, '07:00', '23:00', 2.10, 5, true),
  ('Estação Campinas', 'campinas@voltway.com', 'Av. Brasil', '500', 'Cambuí', 'Campinas', 'SP', '13024-115', 60, '06:00', '20:00', 2.80, 15, true)
ON CONFLICT DO NOTHING;


