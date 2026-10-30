-- ============================================================
-- Portal Anjos da Madrugada
-- Schema PostgreSQL 15+
-- Arquitetura: Visitante / Voluntario / Admin
-- Versao atualizada com uploads de voluntarios para aprovacao admin
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- LIMPEZA OPCIONAL
-- Use apenas em ambiente de desenvolvimento.
-- Descomente se quiser recriar tudo do zero.
-- ============================================================

-- DROP TABLE IF EXISTS logs_admin CASCADE;
-- DROP TABLE IF EXISTS notificacoes_email CASCADE;
-- DROP TABLE IF EXISTS uploads_voluntarios CASCADE;
-- DROP TABLE IF EXISTS equipe CASCADE;
-- DROP TABLE IF EXISTS conteudo CASCADE;
-- DROP TABLE IF EXISTS faq CASCADE;
-- DROP TABLE IF EXISTS galeria CASCADE;
-- DROP TABLE IF EXISTS locais_doacao CASCADE;
-- DROP TABLE IF EXISTS doacoes CASCADE;
-- DROP TABLE IF EXISTS historico_acoes CASCADE;
-- DROP TABLE IF EXISTS materiais CASCADE;
-- DROP TABLE IF EXISTS comunicado_leituras CASCADE;
-- DROP TABLE IF EXISTS comunicados CASCADE;
-- DROP TABLE IF EXISTS evento_presencas CASCADE;
-- DROP TABLE IF EXISTS eventos CASCADE;
-- DROP TABLE IF EXISTS voluntario_areas CASCADE;
-- DROP TABLE IF EXISTS areas_interesse CASCADE;
-- DROP TABLE IF EXISTS voluntarios CASCADE;
-- DROP TABLE IF EXISTS admins CASCADE;

-- DROP TYPE IF EXISTS status_upload_voluntario CASCADE;
-- DROP TYPE IF EXISTS tipo_upload_voluntario CASCADE;
-- DROP TYPE IF EXISTS tipo_conteudo CASCADE;
-- DROP TYPE IF EXISTS tipo_material CASCADE;
-- DROP TYPE IF EXISTS status_notificacao CASCADE;
-- DROP TYPE IF EXISTS categoria_faq CASCADE;
-- DROP TYPE IF EXISTS status_imagem CASCADE;
-- DROP TYPE IF EXISTS tipo_doacao CASCADE;
-- DROP TYPE IF EXISTS status_presenca CASCADE;
-- DROP TYPE IF EXISTS tipo_evento CASCADE;
-- DROP TYPE IF EXISTS status_voluntario CASCADE;

-- ============================================================
-- ENUMS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_voluntario') THEN
    CREATE TYPE status_voluntario AS ENUM (
      'pendente',
      'aprovado',
      'inativo',
      'suspenso',
      'rejeitado'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_evento') THEN
    CREATE TYPE tipo_evento AS ENUM (
      'fixo_semanal',
      'especial',
      'avulso'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_presenca') THEN
    CREATE TYPE status_presenca AS ENUM (
      'confirmado',
      'presente',
      'ausente',
      'cancelado'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_doacao') THEN
    CREATE TYPE tipo_doacao AS ENUM (
      'alimento',
      'roupa',
      'dinheiro',
      'outros'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_imagem') THEN
    CREATE TYPE status_imagem AS ENUM (
      'pendente',
      'aprovada',
      'rejeitada'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_faq') THEN
    CREATE TYPE categoria_faq AS ENUM (
      'voluntariado',
      'doacoes',
      'sobre_projeto'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_notificacao') THEN
    CREATE TYPE status_notificacao AS ENUM (
      'pendente',
      'enviado',
      'erro'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_material') THEN
    CREATE TYPE tipo_material AS ENUM (
      'documento',
      'imagem',
      'video',
      'link',
      'outro'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_conteudo') THEN
    CREATE TYPE tipo_conteudo AS ENUM (
      'texto',
      'html',
      'imagem',
      'url',
      'json'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_upload_voluntario') THEN
    CREATE TYPE status_upload_voluntario AS ENUM (
      'pendente',
      'aprovado',
      'rejeitado',
      'excluido'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_upload_voluntario') THEN
    CREATE TYPE tipo_upload_voluntario AS ENUM (
      'documento',
      'imagem',
      'comprovante',
      'termo',
      'outro'
    );
  END IF;
END $$;

-- ============================================================
-- FUNCAO PARA updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ADMINS
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              VARCHAR(120) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  senha_hash        TEXT NOT NULL,
  foto_url          TEXT,
  ativo             BOOLEAN NOT NULL DEFAULT TRUE,

  tentativas_login  SMALLINT NOT NULL DEFAULT 0,
  bloqueado_ate     TIMESTAMPTZ,

  reset_token       TEXT,
  reset_token_exp   TIMESTAMPTZ,

  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- VOLUNTARIOS
-- Cadastro publico + conta do portal interno
-- ============================================================

CREATE TABLE IF NOT EXISTS voluntarios (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome               VARCHAR(120) NOT NULL,
  email              VARCHAR(255) NOT NULL UNIQUE,
  telefone           VARCHAR(30),
  foto_url           TEXT,
  mensagem           TEXT CHECK (char_length(mensagem) <= 500),

  senha_hash         TEXT,
  status             status_voluntario NOT NULL DEFAULT 'pendente',

  convite_token      TEXT,
  convite_token_exp  TIMESTAMPTZ,

  reset_token        TEXT,
  reset_token_exp    TIMESTAMPTZ,

  tentativas_login   SMALLINT NOT NULL DEFAULT 0,
  bloqueado_ate      TIMESTAMPTZ,
  ultimo_login       TIMESTAMPTZ,

  aprovado_por       UUID REFERENCES admins(id) ON DELETE SET NULL,
  aprovado_em        TIMESTAMPTZ,

  rejeitado_por      UUID REFERENCES admins(id) ON DELETE SET NULL,
  rejeitado_em       TIMESTAMPTZ,
  motivo_rejeicao    TEXT,

  criado_em          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_voluntarios_updated_at ON voluntarios;
CREATE TRIGGER trg_voluntarios_updated_at
BEFORE UPDATE ON voluntarios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- AREAS DE INTERESSE
-- ============================================================

CREATE TABLE IF NOT EXISTS areas_interesse (
  id          SMALLSERIAL PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL UNIQUE,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voluntario_areas (
  voluntario_id UUID NOT NULL REFERENCES voluntarios(id) ON DELETE CASCADE,
  area_id       SMALLINT NOT NULL REFERENCES areas_interesse(id) ON DELETE CASCADE,
  PRIMARY KEY (voluntario_id, area_id)
);

-- ============================================================
-- EVENTOS
-- Publicos e internos
-- ============================================================

CREATE TABLE IF NOT EXISTS eventos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  titulo         VARCHAR(200) NOT NULL,
  descricao      TEXT,
  tipo           tipo_evento NOT NULL DEFAULT 'avulso',

  data_inicio    TIMESTAMPTZ NOT NULL,
  data_fim       TIMESTAMPTZ,

  local          VARCHAR(255),
  imagem_url     TEXT,

  recorrente     BOOLEAN NOT NULL DEFAULT FALSE,
  dia_semana     SMALLINT CHECK (dia_semana BETWEEN 0 AND 6),

  publico        BOOLEAN NOT NULL DEFAULT TRUE,
  publicado      BOOLEAN NOT NULL DEFAULT FALSE,

  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_evento_data_fim
    CHECK (data_fim IS NULL OR data_fim >= data_inicio),

  CONSTRAINT chk_evento_recorrencia
    CHECK (
      (recorrente = FALSE AND dia_semana IS NULL)
      OR
      (recorrente = TRUE AND dia_semana IS NOT NULL)
    )
);

DROP TRIGGER IF EXISTS trg_eventos_updated_at ON eventos;
CREATE TRIGGER trg_eventos_updated_at
BEFORE UPDATE ON eventos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PRESENCAS EM EVENTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS evento_presencas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  evento_id      UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  voluntario_id  UUID NOT NULL REFERENCES voluntarios(id) ON DELETE CASCADE,

  status         status_presenca NOT NULL DEFAULT 'confirmado',
  observacao     TEXT,

  marcado_por    UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_evento_voluntario UNIQUE (evento_id, voluntario_id)
);

DROP TRIGGER IF EXISTS trg_evento_presencas_updated_at ON evento_presencas;
CREATE TRIGGER trg_evento_presencas_updated_at
BEFORE UPDATE ON evento_presencas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- COMUNICADOS INTERNOS
-- ============================================================

CREATE TABLE IF NOT EXISTS comunicados (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  titulo         VARCHAR(200) NOT NULL,
  corpo          TEXT NOT NULL,

  fixado         BOOLEAN NOT NULL DEFAULT FALSE,
  publicado      BOOLEAN NOT NULL DEFAULT TRUE,

  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_comunicados_updated_at ON comunicados;
CREATE TRIGGER trg_comunicados_updated_at
BEFORE UPDATE ON comunicados
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS comunicado_leituras (
  comunicado_id  UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  voluntario_id  UUID NOT NULL REFERENCES voluntarios(id) ON DELETE CASCADE,
  lido_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (comunicado_id, voluntario_id)
);

-- ============================================================
-- MATERIAIS INTERNOS
-- Arquivos/links publicados pelo admin para os voluntarios
-- ============================================================

CREATE TABLE IF NOT EXISTS materiais (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  titulo         VARCHAR(200) NOT NULL,
  descricao      TEXT,
  tipo           tipo_material NOT NULL DEFAULT 'documento',

  arquivo_url    TEXT,
  link_externo   TEXT,
  tamanho_bytes  BIGINT,

  publicado      BOOLEAN NOT NULL DEFAULT TRUE,

  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_material_origem
    CHECK (arquivo_url IS NOT NULL OR link_externo IS NOT NULL)
);

DROP TRIGGER IF EXISTS trg_materiais_updated_at ON materiais;
CREATE TRIGGER trg_materiais_updated_at
BEFORE UPDATE ON materiais
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- UPLOADS DOS VOLUNTARIOS
-- Arquivos enviados pelo voluntario para analise do admin
-- ============================================================

CREATE TABLE IF NOT EXISTS uploads_voluntarios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  voluntario_id     UUID NOT NULL REFERENCES voluntarios(id) ON DELETE CASCADE,

  titulo            VARCHAR(200) NOT NULL,
  descricao         TEXT,
  tipo              tipo_upload_voluntario NOT NULL DEFAULT 'documento',

  arquivo_url       TEXT NOT NULL,
  arquivo_nome      VARCHAR(255),
  mime_type         VARCHAR(120),
  tamanho_bytes     BIGINT,

  status            status_upload_voluntario NOT NULL DEFAULT 'pendente',

  aprovado_por      UUID REFERENCES admins(id) ON DELETE SET NULL,
  aprovado_em       TIMESTAMPTZ,

  rejeitado_por     UUID REFERENCES admins(id) ON DELETE SET NULL,
  rejeitado_em      TIMESTAMPTZ,
  motivo_rejeicao   TEXT,

  excluido_por      UUID REFERENCES admins(id) ON DELETE SET NULL,
  excluido_em       TIMESTAMPTZ,
  motivo_exclusao   TEXT,

  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_upload_tamanho
    CHECK (tamanho_bytes IS NULL OR tamanho_bytes > 0),

  CONSTRAINT chk_upload_aprovacao
    CHECK (
      (status <> 'aprovado')
      OR
      (aprovado_por IS NOT NULL AND aprovado_em IS NOT NULL)
    ),

  CONSTRAINT chk_upload_rejeicao
    CHECK (
      (status <> 'rejeitado')
      OR
      (rejeitado_por IS NOT NULL AND rejeitado_em IS NOT NULL)
    ),

  CONSTRAINT chk_upload_exclusao
    CHECK (
      (status <> 'excluido')
      OR
      (excluido_por IS NOT NULL AND excluido_em IS NOT NULL)
    )
);

DROP TRIGGER IF EXISTS trg_uploads_voluntarios_updated_at ON uploads_voluntarios;
CREATE TRIGGER trg_uploads_voluntarios_updated_at
BEFORE UPDATE ON uploads_voluntarios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- HISTORICO DE ACOES DO VOLUNTARIO
-- ============================================================

CREATE TABLE IF NOT EXISTS historico_acoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  voluntario_id   UUID NOT NULL REFERENCES voluntarios(id) ON DELETE CASCADE,
  evento_id       UUID REFERENCES eventos(id) ON DELETE SET NULL,

  descricao       VARCHAR(200) NOT NULL,
  data_acao       DATE NOT NULL,
  observacao      TEXT,

  registrado_por  UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOACOES
-- ============================================================

CREATE TABLE IF NOT EXISTS doacoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tipo           tipo_doacao NOT NULL,
  descricao      VARCHAR(300),
  quantidade     NUMERIC(10,2),
  unidade        VARCHAR(30),

  -- Uso interno. Nao exibir no historico publico.
  doador_nome    VARCHAR(120),

  data_recebido  DATE NOT NULL DEFAULT CURRENT_DATE,

  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locais_doacao (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome           VARCHAR(200) NOT NULL,
  endereco       TEXT NOT NULL,
  horario        VARCHAR(200),
  tipo           tipo_doacao NOT NULL,

  ativo          BOOLEAN NOT NULL DEFAULT TRUE,

  -- Controla quais locais aparecem em destaque na home publica.
  exibir_home    BOOLEAN NOT NULL DEFAULT FALSE,
  ordem_home     INTEGER NOT NULL DEFAULT 0,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_locais_doacao_updated_at ON locais_doacao;
CREATE TRIGGER trg_locais_doacao_updated_at
BEFORE UPDATE ON locais_doacao
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- GALERIA PUBLICA
-- ============================================================

CREATE TABLE IF NOT EXISTS galeria (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  titulo          VARCHAR(200) NOT NULL,
  descricao       TEXT,

  imagem_url      TEXT NOT NULL,
  imagem_thumb    TEXT,

  data_acao       DATE,

  status          status_imagem NOT NULL DEFAULT 'pendente',
  privacidade_ok  BOOLEAN NOT NULL DEFAULT FALSE,

  admin_id        UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_galeria_privacidade_publicacao
    CHECK (
      status <> 'aprovada'
      OR privacidade_ok = TRUE
    )
);

DROP TRIGGER IF EXISTS trg_galeria_updated_at ON galeria;
CREATE TRIGGER trg_galeria_updated_at
BEFORE UPDATE ON galeria
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FAQ
-- ============================================================

CREATE TABLE IF NOT EXISTS faq (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  pergunta       TEXT NOT NULL,
  resposta       TEXT NOT NULL,
  categoria      categoria_faq NOT NULL DEFAULT 'sobre_projeto',

  ordem          SMALLINT NOT NULL DEFAULT 0,
  publicado      BOOLEAN NOT NULL DEFAULT TRUE,

  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_faq_updated_at ON faq;
CREATE TRIGGER trg_faq_updated_at
BEFORE UPDATE ON faq
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- CMS / CONTEUDO EDITAVEL
-- Home, Sobre, PIX, redes sociais, textos do portal etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS conteudo (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  chave          VARCHAR(100) NOT NULL UNIQUE,
  valor          TEXT NOT NULL,
  tipo           tipo_conteudo NOT NULL DEFAULT 'texto',
  descricao      VARCHAR(300),

  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_conteudo_updated_at ON conteudo;
CREATE TRIGGER trg_conteudo_updated_at
BEFORE UPDATE ON conteudo
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- EQUIPE
-- Para a tela Sobre: fotos, nomes e cargos dos responsaveis
-- ============================================================

CREATE TABLE IF NOT EXISTS equipe (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome           VARCHAR(120) NOT NULL,
  cargo          VARCHAR(120),
  bio            TEXT,
  foto_url       TEXT,
  ordem          SMALLINT NOT NULL DEFAULT 0,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  exibir_portal  BOOLEAN NOT NULL DEFAULT FALSE,

  admin_id       UUID REFERENCES admins(id) ON DELETE SET NULL,

  criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_equipe_updated_at ON equipe;
CREATE TRIGGER trg_equipe_updated_at
BEFORE UPDATE ON equipe
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- NOTIFICACOES POR E-MAIL
-- Fila para convite, eventos, comunicados e recuperacao de senha
-- ============================================================

CREATE TABLE IF NOT EXISTS notificacoes_email (
  id              BIGSERIAL PRIMARY KEY,

  voluntario_id   UUID REFERENCES voluntarios(id) ON DELETE CASCADE,
  evento_id       UUID REFERENCES eventos(id) ON DELETE CASCADE,
  comunicado_id   UUID REFERENCES comunicados(id) ON DELETE CASCADE,
  upload_id       UUID REFERENCES uploads_voluntarios(id) ON DELETE CASCADE,

  destinatario    VARCHAR(255) NOT NULL,
  assunto         VARCHAR(300) NOT NULL,
  corpo           TEXT NOT NULL,

  status          status_notificacao NOT NULL DEFAULT 'pendente',
  tentativas      SMALLINT NOT NULL DEFAULT 0,

  enviado_em      TIMESTAMPTZ,
  erro_msg        TEXT,

  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LOGS DE AUDITORIA ADMIN
-- ============================================================

CREATE TABLE IF NOT EXISTS logs_admin (
  id            BIGSERIAL PRIMARY KEY,

  admin_id      UUID REFERENCES admins(id) ON DELETE SET NULL,

  acao          VARCHAR(100) NOT NULL,
  entidade      VARCHAR(80),
  entidade_id   UUID,

  detalhe       JSONB,
  ip            INET,
  user_agent    TEXT,

  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_admins_email
  ON admins(email);

CREATE INDEX IF NOT EXISTS idx_voluntarios_email
  ON voluntarios(email);

CREATE INDEX IF NOT EXISTS idx_voluntarios_status
  ON voluntarios(status);

CREATE INDEX IF NOT EXISTS idx_voluntarios_aprovado
  ON voluntarios(status)
  WHERE status = 'aprovado';

CREATE INDEX IF NOT EXISTS idx_eventos_data_inicio
  ON eventos(data_inicio);

CREATE INDEX IF NOT EXISTS idx_eventos_publico_publicado
  ON eventos(publico, publicado);

CREATE INDEX IF NOT EXISTS idx_eventos_recorrente
  ON eventos(recorrente)
  WHERE recorrente = TRUE;

CREATE INDEX IF NOT EXISTS idx_evento_presencas_voluntario
  ON evento_presencas(voluntario_id);

CREATE INDEX IF NOT EXISTS idx_evento_presencas_evento
  ON evento_presencas(evento_id);

CREATE INDEX IF NOT EXISTS idx_comunicados_publicado_fixado
  ON comunicados(publicado, fixado, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_comunicado_leituras_voluntario
  ON comunicado_leituras(voluntario_id);

CREATE INDEX IF NOT EXISTS idx_materiais_publicado_tipo
  ON materiais(publicado, tipo);

CREATE INDEX IF NOT EXISTS idx_uploads_voluntarios_voluntario
  ON uploads_voluntarios(voluntario_id);

CREATE INDEX IF NOT EXISTS idx_uploads_voluntarios_status
  ON uploads_voluntarios(status);

CREATE INDEX IF NOT EXISTS idx_uploads_voluntarios_criado_em
  ON uploads_voluntarios(criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_historico_voluntario_data
  ON historico_acoes(voluntario_id, data_acao DESC);

CREATE INDEX IF NOT EXISTS idx_doacoes_data
  ON doacoes(data_recebido DESC);

CREATE INDEX IF NOT EXISTS idx_locais_doacao_ativo_tipo
  ON locais_doacao(ativo, tipo);

CREATE INDEX IF NOT EXISTS idx_locais_doacao_home
  ON locais_doacao(exibir_home, ativo, ordem_home);

CREATE INDEX IF NOT EXISTS idx_galeria_status_data
  ON galeria(status, data_acao DESC);

CREATE INDEX IF NOT EXISTS idx_faq_categoria_publicado_ordem
  ON faq(categoria, publicado, ordem);

CREATE INDEX IF NOT EXISTS idx_conteudo_chave
  ON conteudo(chave);

CREATE INDEX IF NOT EXISTS idx_equipe_ativo_ordem
  ON equipe(ativo, ordem);

CREATE INDEX IF NOT EXISTS idx_notificacoes_pendentes
  ON notificacoes_email(status, criado_em)
  WHERE status = 'pendente';

CREATE INDEX IF NOT EXISTS idx_logs_admin_data
  ON logs_admin(admin_id, criado_em DESC);

-- ============================================================
-- SEEDS INICIAIS
-- ============================================================

INSERT INTO areas_interesse (nome) VALUES
  ('Distribuicao de alimentos'),
  ('Doacao de roupas'),
  ('Apoio logistico'),
  ('Comunicacao'),
  ('Eventos'),
  ('Outros')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO conteudo (chave, valor, tipo, descricao) VALUES
  ('home_titulo', 'Transformando vidas nas madrugadas', 'texto', 'Titulo principal da Home'),
  ('home_subtitulo', 'Solidariedade nas ruas de Sao Leopoldo', 'texto', 'Subtitulo da Home'),
  ('home_cta_voluntario', 'Seja voluntario', 'texto', 'Texto do botao principal de voluntariado'),
  ('home_cta_doacao', 'Quero doar', 'texto', 'Texto do botao principal de doacao'),

  ('sobre_historia', 'Insira aqui a historia do projeto.', 'html', 'Texto da secao Nossa Historia'),
  ('sobre_missao', 'Promover acolhimento e apoio a pessoas em situacao de vulnerabilidade.', 'texto', 'Missao'),
  ('sobre_visao', 'Ser referencia em solidariedade e cuidado social.', 'texto', 'Visao'),
  ('sobre_valores', 'Solidariedade, respeito, empatia e responsabilidade.', 'texto', 'Valores'),

  ('pix_chave', '', 'texto', 'Chave PIX para doacoes'),
  ('pix_nome_recebedor', 'Anjos da Madrugada', 'texto', 'Nome exibido na area de PIX'),

  ('instagram_url', 'https://instagram.com/', 'url', 'URL do Instagram'),
  ('facebook_url', 'https://facebook.com/', 'url', 'URL do Facebook'),
  ('whatsapp_numero', '5551900000000', 'texto', 'Numero do WhatsApp com DDI e DDD'),

  ('portal_boas_vindas', 'Bem-vindo ao portal dos voluntarios!', 'html', 'Mensagem do dashboard do voluntario')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
