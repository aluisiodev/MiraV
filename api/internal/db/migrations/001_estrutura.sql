-- MiraV · VisaVision
-- Estrutura inicial do banco. Textos traduzíveis ficam em JSONB: {"pt": "...", "en": "...", "es": "..."}.

CREATE TABLE espelhos (
    id          SERIAL PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    formato     TEXT NOT NULL CHECK (formato IN ('retangular', 'oval', 'arco', 'redondo', 'personalizado')),
    nome        JSONB NOT NULL,
    descricao   JSONB NOT NULL,
    indicado    JSONB NOT NULL,
    medidas     TEXT,
    ordem       SMALLINT NOT NULL DEFAULT 0,
    ativo       BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE cortes (
    id                  SERIAL PRIMARY KEY,
    slug                TEXT NOT NULL UNIQUE,
    comprimento         TEXT NOT NULL CHECK (comprimento IN ('curto', 'medio', 'longo')),
    nome                JSONB NOT NULL,
    descricao           JSONB NOT NULL,
    como_pedir          JSONB NOT NULL,
    manutencao_semanas  SMALLINT NOT NULL,
    ativo               BOOLEAN NOT NULL DEFAULT TRUE
);

-- Catálogo de cada modelo de espelho. "destaque" marca os exemplos mostrados na página /espelho.
CREATE TABLE espelho_cortes (
    espelho_id  INT NOT NULL REFERENCES espelhos (id) ON DELETE CASCADE,
    corte_id    INT NOT NULL REFERENCES cortes (id) ON DELETE CASCADE,
    destaque    BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (espelho_id, corte_id)
);

-- Resultado de cada análise. A foto NUNCA é gravada: só o hash SHA-256, usado como cache.
CREATE TABLE analises (
    id            BIGSERIAL PRIMARY KEY,
    foto_sha256   TEXT NOT NULL,
    idioma        TEXT NOT NULL CHECK (idioma IN ('pt', 'en', 'es')),
    espelho_id    INT REFERENCES espelhos (id) ON DELETE SET NULL,
    corte_id      INT REFERENCES cortes (id) ON DELETE SET NULL,
    confianca     REAL,
    resposta      JSONB NOT NULL,
    provedor      TEXT NOT NULL,
    modelo        TEXT NOT NULL,
    demonstracao  BOOLEAN NOT NULL DEFAULT FALSE,
    duracao_ms    INT,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX analises_cache_idx ON analises (foto_sha256, idioma, criado_em DESC);

-- Formulários de Contato e Trabalhe Conosco.
CREATE TABLE leads (
    id              BIGSERIAL PRIMARY KEY,
    tipo            TEXT NOT NULL CHECK (tipo IN ('contato', 'candidatura')),
    nome            TEXT NOT NULL,
    email           TEXT NOT NULL,
    telefone        TEXT,
    empresa         TEXT,
    tipo_negocio    TEXT,
    area            TEXT,
    link            TEXT,
    mensagem        TEXT NOT NULL,
    idioma          TEXT NOT NULL DEFAULT 'pt',
    consentimento   BOOLEAN NOT NULL,
    ip_hash         TEXT,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX leads_tipo_idx ON leads (tipo, criado_em DESC);
