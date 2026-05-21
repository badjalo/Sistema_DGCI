-- ============================================================
-- SF-DGCI: Sistema de Gestão Sindical
-- Sindicato dos Funcionários da DGCI - Guiné-Bissau
-- Schema PostgreSQL Completo
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE estado_membro AS ENUM ('ativo', 'suspenso', 'reformado', 'inativo');
CREATE TYPE sexo_tipo AS ENUM ('masculino', 'feminino');
CREATE TYPE estado_civil_tipo AS ENUM ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_facto');
CREATE TYPE perfil_utilizador AS ENUM ('administrador', 'presidente', 'tesoureiro', 'secretario', 'operador', 'auditor');
CREATE TYPE estado_pagamento AS ENUM ('pago', 'pendente', 'atrasado', 'cancelado');
CREATE TYPE tipo_transacao AS ENUM ('receita', 'despesa');
CREATE TYPE tipo_documento AS ENUM ('contrato', 'estatuto', 'ata', 'declaracao', 'circular', 'outro');
CREATE TYPE tipo_comunicado AS ENUM ('aviso', 'circular', 'convocatoria', 'informacao', 'urgente');
CREATE TYPE estado_comunicado AS ENUM ('rascunho', 'publicado', 'arquivado');
CREATE TYPE destino_comunicado AS ENUM ('todos', 'ativo', 'suspenso', 'reformado', 'direcao');

-- ============================================================
-- TABELA: departamentos
-- ============================================================
CREATE TABLE departamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    sigla VARCHAR(20) NOT NULL UNIQUE,
    descricao TEXT,
    responsavel_nome VARCHAR(200),
    limite_quadros INTEGER DEFAULT 0,
    estado BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: cargos
-- ============================================================
CREATE TABLE cargos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    nivel INTEGER DEFAULT 1,
    descricao TEXT,
    departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: membros
-- ============================================================
CREATE TABLE membros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_membro VARCHAR(20) UNIQUE NOT NULL,
    nome_completo VARCHAR(300) NOT NULL,
    foto_url TEXT,
    sexo sexo_tipo NOT NULL,
    data_nascimento DATE NOT NULL,
    estado_civil estado_civil_tipo DEFAULT 'solteiro',
    nif VARCHAR(20) UNIQUE,
    bi_passaporte VARCHAR(50) UNIQUE NOT NULL,
    telefone VARCHAR(30),
    email VARCHAR(200) UNIQUE,
    morada TEXT,
    funcao_cargo VARCHAR(200),
    cargo_id UUID REFERENCES cargos(id) ON DELETE SET NULL,
    departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
    data_admissao DATE NOT NULL DEFAULT CURRENT_DATE,
    estado estado_membro DEFAULT 'ativo',
    assinatura_url TEXT,
    qr_code TEXT,
    historico_profissional JSONB DEFAULT '[]'::jsonb,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: utilizadores
-- ============================================================
CREATE TABLE utilizadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    perfil perfil_utilizador DEFAULT 'operador',
    membro_id UUID REFERENCES membros(id) ON DELETE SET NULL,
    ativo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    token_reset VARCHAR(255),
    token_reset_expira TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT,
    preferencias JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: cartoes
-- ============================================================
CREATE TABLE cartoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
    numero_cartao VARCHAR(20) UNIQUE NOT NULL,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_validade DATE,
    estado BOOLEAN DEFAULT true,
    pdf_url TEXT,
    criado_por UUID REFERENCES utilizadores(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    descricao TEXT,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: categorias_financeiras
-- ============================================================
CREATE TABLE categorias_financeiras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    tipo tipo_transacao NOT NULL,
    descricao TEXT,
    cor VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: bancos
-- ============================================================
CREATE TABLE bancos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    numero_conta VARCHAR(50),
    iban VARCHAR(50),
    saldo_inicial DECIMAL(15,2) DEFAULT 0,
    saldo_atual DECIMAL(15,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: quotas (definição mensal)
-- ============================================================
CREATE TABLE quotas_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    valor_mensal DECIMAL(10,2) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN DEFAULT true,
    criado_por UUID REFERENCES utilizadores(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: pagamentos (quotas mensais)
-- ============================================================
CREATE TABLE pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membro_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    estado estado_pagamento DEFAULT 'pendente',
    data_pagamento DATE,
    metodo_pagamento VARCHAR(50),
    referencia VARCHAR(100),
    banco_id UUID REFERENCES bancos(id),
    recibo_url TEXT,
    observacoes TEXT,
    registado_por UUID REFERENCES utilizadores(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(membro_id, mes, ano)
);

-- ============================================================
-- TABELA: receitas
-- ============================================================
CREATE TABLE receitas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao VARCHAR(300) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data_receita DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria_id UUID REFERENCES categorias_financeiras(id),
    banco_id UUID REFERENCES bancos(id),
    membro_id UUID REFERENCES membros(id),
    referencia VARCHAR(100),
    comprovativo_url TEXT,
    observacoes TEXT,
    registado_por UUID REFERENCES utilizadores(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: despesas
-- ============================================================
CREATE TABLE despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao VARCHAR(300) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    data_despesa DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria_id UUID REFERENCES categorias_financeiras(id),
    banco_id UUID REFERENCES bancos(id),
    beneficiario VARCHAR(200),
    referencia VARCHAR(100),
    comprovativo_url TEXT,
    aprovado_por UUID REFERENCES utilizadores(id),
    observacoes TEXT,
    registado_por UUID REFERENCES utilizadores(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: documentos
-- ============================================================
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(300) NOT NULL,
    tipo tipo_documento DEFAULT 'outro',
    descricao TEXT,
    ficheiro_url TEXT NOT NULL,
    ficheiro_nome VARCHAR(300),
    ficheiro_tamanho INTEGER,
    ficheiro_tipo VARCHAR(50),
    membro_id UUID REFERENCES membros(id) ON DELETE SET NULL,
    departamento_id UUID REFERENCES departamentos(id) ON DELETE SET NULL,
    publico BOOLEAN DEFAULT false,
    tags TEXT[],
    carregado_por UUID REFERENCES utilizadores(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: comunicados
-- ============================================================
CREATE TABLE comunicados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(300) NOT NULL,
    tipo tipo_comunicado DEFAULT 'aviso',
    conteudo TEXT NOT NULL,
    estado estado_comunicado DEFAULT 'rascunho',
    destino destino_comunicado DEFAULT 'todos',
    data_publicacao TIMESTAMP WITH TIME ZONE,
    urgente BOOLEAN DEFAULT false,
    autor_id UUID REFERENCES utilizadores(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: notificacoes
-- ============================================================
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilizador_id UUID NOT NULL REFERENCES utilizadores(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info',
    lida BOOLEAN DEFAULT false,
    link TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: mensagens
-- ============================================================
CREATE TABLE mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remetente_id UUID NOT NULL REFERENCES utilizadores(id),
    destinatario_id UUID REFERENCES utilizadores(id),
    assunto VARCHAR(300),
    conteudo TEXT NOT NULL,
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- TABELA: auditoria_logs
-- ============================================================
CREATE TABLE auditoria_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    utilizador_id UUID REFERENCES utilizadores(id),
    utilizador_nome VARCHAR(200),
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100),
    entidade_id UUID,
    dados_antes JSONB,
    dados_depois JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_membros_numero ON membros(numero_membro);
CREATE INDEX idx_membros_estado ON membros(estado);
CREATE INDEX idx_membros_departamento ON membros(departamento_id);
CREATE INDEX idx_membros_nome ON membros USING gin(to_tsvector('portuguese', nome_completo));
CREATE INDEX idx_pagamentos_membro ON pagamentos(membro_id);
CREATE INDEX idx_pagamentos_ano_mes ON pagamentos(ano, mes);
CREATE INDEX idx_pagamentos_estado ON pagamentos(estado);
CREATE INDEX idx_comunicados_estado ON comunicados(estado);
CREATE INDEX idx_notificacoes_utilizador ON notificacoes(utilizador_id, lida);
CREATE INDEX idx_auditoria_utilizador ON auditoria_logs(utilizador_id);
CREATE INDEX idx_auditoria_criado ON auditoria_logs(criado_em DESC);
CREATE INDEX idx_receitas_data ON receitas(data_receita);
CREATE INDEX idx_despesas_data ON despesas(data_despesa);

-- ============================================================
-- VIEWS
-- ============================================================

-- View: resumo de membros por departamento
CREATE VIEW vw_membros_por_departamento AS
SELECT 
    d.id AS departamento_id,
    d.nome AS departamento,
    d.sigla,
    COUNT(m.id) AS total_membros,
    COUNT(CASE WHEN m.estado = 'ativo' THEN 1 END) AS membros_ativos,
    COUNT(CASE WHEN m.estado = 'suspenso' THEN 1 END) AS membros_suspensos,
    COUNT(CASE WHEN m.estado = 'reformado' THEN 1 END) AS membros_reformados
FROM departamentos d
LEFT JOIN membros m ON m.departamento_id = d.id
GROUP BY d.id, d.nome, d.sigla;

-- View: situação de quotas do ano atual
CREATE VIEW vw_situacao_quotas AS
SELECT 
    m.id AS membro_id,
    m.numero_membro,
    m.nome_completo,
    m.estado,
    EXTRACT(YEAR FROM NOW()) AS ano,
    COUNT(p.id) FILTER (WHERE p.estado = 'pago') AS meses_pagos,
    COUNT(p.id) FILTER (WHERE p.estado IN ('pendente', 'atrasado')) AS meses_pendentes,
    COALESCE(SUM(p.valor) FILTER (WHERE p.estado = 'pago'), 0) AS total_pago,
    COALESCE(SUM(p.valor) FILTER (WHERE p.estado IN ('pendente', 'atrasado')), 0) AS total_divida
FROM membros m
LEFT JOIN pagamentos p ON p.membro_id = m.id AND p.ano = EXTRACT(YEAR FROM NOW())
WHERE m.estado = 'ativo'
GROUP BY m.id, m.numero_membro, m.nome_completo, m.estado;

-- View: fluxo financeiro mensal
CREATE VIEW vw_fluxo_mensal AS
SELECT 
    EXTRACT(YEAR FROM data_transacao) AS ano,
    EXTRACT(MONTH FROM data_transacao) AS mes,
    SUM(receitas) AS total_receitas,
    SUM(despesas) AS total_despesas,
    SUM(receitas) - SUM(despesas) AS saldo
FROM (
    SELECT data_receita AS data_transacao, valor AS receitas, 0 AS despesas FROM receitas
    UNION ALL
    SELECT data_despesa AS data_transacao, 0 AS receitas, valor AS despesas FROM despesas
) t
GROUP BY ano, mes
ORDER BY ano, mes;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: atualizar timestamp
CREATE OR REPLACE FUNCTION fn_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_membros_updated
    BEFORE UPDATE ON membros
    FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TRIGGER trg_utilizadores_updated
    BEFORE UPDATE ON utilizadores
    FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

CREATE TRIGGER trg_departamentos_updated
    BEFORE UPDATE ON departamentos
    FOR EACH ROW EXECUTE FUNCTION fn_atualizar_timestamp();

-- Sequence for generating unique member numbers
CREATE SEQUENCE IF NOT EXISTS membros_num_seq START 1;

-- Function and trigger to set numero_membro on insert when not provided
CREATE OR REPLACE FUNCTION fn_set_numero_membro()
RETURNS TRIGGER AS $$
DECLARE
    seq_val bigint;
BEGIN
    IF NEW.numero_membro IS NULL OR NEW.numero_membro = '' THEN
        seq_val := nextval('membros_num_seq');
        NEW.numero_membro := format('SF-DGCI-%s-%s', EXTRACT(YEAR FROM NOW())::int, lpad(seq_val::text,5,'0'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_membros_numero_insert
    BEFORE INSERT ON membros
    FOR EACH ROW EXECUTE FUNCTION fn_set_numero_membro();

-- Trigger: gerar número de membro automático
CREATE OR REPLACE FUNCTION fn_gerar_numero_membro()
RETURNS TRIGGER AS $$
DECLARE
    ultimo_num INTEGER;
    novo_num VARCHAR(20);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_membro FROM 4) AS INTEGER)), 0) 
    INTO ultimo_num
    FROM membros 
    WHERE numero_membro LIKE 'SF-%';
    
    novo_num := 'SF-' || LPAD((ultimo_num + 1)::TEXT, 4, '0');
    NEW.numero_membro := novo_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gerar_numero_membro
    BEFORE INSERT ON membros
    FOR EACH ROW
    WHEN (NEW.numero_membro IS NULL OR NEW.numero_membro = '')
    EXECUTE FUNCTION fn_gerar_numero_membro();

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Configurações do sistema
INSERT INTO configuracoes (chave, valor, descricao) VALUES
('nome_sindicato', 'Sindicato dos Funcionários da DGCI', 'Nome completo do sindicato'),
('sigla', 'SF-DGCI', 'Sigla do sindicato'),
('sede', 'Av. Combatentes da Liberdade da Pátria, Nº 1998, CP 1449, Bissau', 'Sede do sindicato'),
('telefone', '+245 95 123 45 67', 'Telefone de contacto'),
('email', 'sindicatodgci@gmail.com', 'Email do sindicato'),
('website', 'www.sindicatodgci.gw', 'Website do sindicato'),
('quota_mensal', '5000', 'Valor mensal da quota em XOF'),
('moeda', 'XOF', 'Moeda utilizada'),
('dark_mode', 'false', 'Modo escuro ativo'),
('notificacoes_email', 'true', 'Enviar notificações por email'),
('backup_automatico', 'true', 'Backup automático ativo');

-- Departamentos
INSERT INTO departamentos (id, nome, sigla, descricao, responsavel_nome) VALUES
(uuid_generate_v4(), 'Direção de Impostos Diretos', 'DID', 'Gestão e fiscalização dos impostos diretos', 'Dr. Ibraima Embaló'),
(uuid_generate_v4(), 'Direção de Impostos Indiretos', 'DII', 'IVA e outros impostos indiretos', 'Dra. Filomena Nabá'),
(uuid_generate_v4(), 'Direção de Alfândegas', 'DA', 'Controlo alfandegário e impostos de importação', 'Dr. Mamadú Té'),
(uuid_generate_v4(), 'Direção de Recursos Humanos', 'DRH', 'Gestão do pessoal e recursos humanos', 'Dra. Aminata Sow'),
(uuid_generate_v4(), 'Direção Financeira', 'DF', 'Contabilidade e gestão financeira', 'Dr. João Bui'),
(uuid_generate_v4(), 'Direção de Informática', 'DI', 'Sistemas de Informação e Infraestrutura TIC', 'Dr. Mamadú Djaló');

-- Categorias financeiras
INSERT INTO categorias_financeiras (nome, tipo, descricao, cor) VALUES
('Quotas Mensais', 'receita', 'Quotas pagas pelos membros', '#22c55e'),
('Doações', 'receita', 'Doações recebidas', '#3b82f6'),
('Subvenções', 'receita', 'Subvenções governamentais', '#8b5cf6'),
('Outras Receitas', 'receita', 'Outros tipos de receita', '#06b6d4'),
('Salários', 'despesa', 'Pagamentos de salários', '#ef4444'),
('Rendas', 'despesa', 'Aluguer de instalações', '#f97316'),
('Material de Escritório', 'despesa', 'Papelaria e material', '#eab308'),
('Serviços', 'despesa', 'Serviços contratados', '#ec4899'),
('Transportes', 'despesa', 'Despesas de transporte', '#14b8a6'),
('Outras Despesas', 'despesa', 'Outros tipos de despesa', '#6b7280');

-- Banco
INSERT INTO bancos (nome, numero_conta, saldo_atual) VALUES
('Caixa Sindical', 'CAIXA-001', 85000),
('BCEAO - Conta Principal', 'GW29-0001-0000-0001-2345', 50000);

-- Quotas config
INSERT INTO quotas_config (valor_mensal, data_inicio, ativo) VALUES
(5000, '2026-01-01', true);

-- Utilizador Administrador
INSERT INTO utilizadores (nome, email, password_hash, perfil) VALUES
('Mamadú Bá Djaló', 'admin@sf-dgci.gw', crypt('Admin@2026!', gen_salt('bf', 12)), 'administrador');

COMMIT;
