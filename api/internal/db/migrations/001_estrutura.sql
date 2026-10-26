-- MiraV · VisaVision
-- Estrutura do banco: só os formulários do site.
-- (Até 25/10/2026 havia também o catálogo de cortes e as análises de foto por IA. Essa função saiu
--  do site antes da publicação; o código antigo continua no primeiro commit do Git.)

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
