// Package db guarda o acesso ao PostgreSQL: migrações, catálogo, análises e formulários.
package db

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"sort"
	"strings"
	"time"

	"github.com/lib/pq"
)

//go:embed migrations/*.sql
var migracoes embed.FS

// Texto é um texto traduzido: {"pt": "...", "en": "...", "es": "..."}.
type Texto map[string]string

// Em devolve o texto no idioma pedido, com português como reserva.
func (t Texto) Em(idioma string) string {
	if v, ok := t[idioma]; ok && v != "" {
		return v
	}
	return t["pt"]
}

type Espelho struct {
	ID        int
	Slug      string
	Formato   string
	Nome      Texto
	Descricao Texto
	Indicado  Texto
	Medidas   string
	Destaques []string
}

type Corte struct {
	ID                int
	Slug              string
	Comprimento       string
	Nome              Texto
	Descricao         Texto
	ComoPedir         Texto
	ManutencaoSemanas int
}

type Analise struct {
	ID           int64
	FotoSHA256   string
	Idioma       string
	EspelhoID    *int
	CorteID      *int
	Confianca    float64
	Resposta     json.RawMessage
	Provedor     string
	Modelo       string
	Demonstracao bool
	DuracaoMS    int
	CriadoEm     time.Time
}

type Lead struct {
	Tipo          string
	Nome          string
	Email         string
	Telefone      string
	Empresa       string
	TipoNegocio   string
	Area          string
	Link          string
	Mensagem      string
	Idioma        string
	Consentimento bool
	IPHash        string
}

// ErrNaoEncontrado indica que não há registro para a busca.
var ErrNaoEncontrado = errors.New("não encontrado")

type Store struct{ db *sql.DB }

// Abrir conecta ao banco e confere a conexão.
func Abrir(ctx context.Context, url string) (*Store, error) {
	conn, err := sql.Open("postgres", url)
	if err != nil {
		return nil, err
	}
	// Planos gratuitos têm poucas conexões: mantemos o pool pequeno.
	conn.SetMaxOpenConns(5)
	conn.SetMaxIdleConns(2)
	conn.SetConnMaxIdleTime(2 * time.Minute)
	ctx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	if err := conn.PingContext(ctx); err != nil {
		conn.Close()
		return nil, fmt.Errorf("sem conexão com o banco: %w", err)
	}
	return &Store{db: conn}, nil
}

func (s *Store) Fechar() error { return s.db.Close() }

func (s *Store) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

// Migrar aplica, em ordem, as migrações que ainda não rodaram.
func (s *Store) Migrar(ctx context.Context) ([]string, error) {
	if _, err := s.db.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		versao TEXT PRIMARY KEY, aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now())`); err != nil {
		return nil, err
	}
	nomes, err := fs.Glob(migracoes, "migrations/*.sql")
	if err != nil {
		return nil, err
	}
	sort.Strings(nomes)
	var aplicadas []string
	for _, nome := range nomes {
		versao := strings.TrimSuffix(strings.TrimPrefix(nome, "migrations/"), ".sql")
		var existe bool
		if err := s.db.QueryRowContext(ctx,
			`SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE versao = $1)`, versao).Scan(&existe); err != nil {
			return aplicadas, err
		}
		if existe {
			continue
		}
		conteudo, err := migracoes.ReadFile(nome)
		if err != nil {
			return aplicadas, err
		}
		tx, err := s.db.BeginTx(ctx, nil)
		if err != nil {
			return aplicadas, err
		}
		if _, err := tx.ExecContext(ctx, string(conteudo)); err != nil {
			tx.Rollback()
			return aplicadas, fmt.Errorf("migração %s: %w", versao, err)
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO schema_migrations (versao) VALUES ($1)`, versao); err != nil {
			tx.Rollback()
			return aplicadas, err
		}
		if err := tx.Commit(); err != nil {
			return aplicadas, err
		}
		aplicadas = append(aplicadas, versao)
	}
	return aplicadas, nil
}

func lerTexto(b []byte) (Texto, error) {
	var t Texto
	if err := json.Unmarshal(b, &t); err != nil {
		return nil, err
	}
	return t, nil
}

// Espelhos lista os modelos ativos, com os cortes de destaque de cada um.
func (s *Store) Espelhos(ctx context.Context) ([]Espelho, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT e.id, e.slug, e.formato, e.nome, e.descricao, e.indicado, COALESCE(e.medidas, ''),
		       COALESCE(array_agg(c.slug ORDER BY c.id) FILTER (WHERE ec.destaque), '{}')
		FROM espelhos e
		LEFT JOIN espelho_cortes ec ON ec.espelho_id = e.id
		LEFT JOIN cortes c ON c.id = ec.corte_id AND c.ativo
		WHERE e.ativo
		GROUP BY e.id
		ORDER BY e.ordem, e.id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var lista []Espelho
	for rows.Next() {
		var e Espelho
		var nome, desc, ind []byte
		var destaques pq.StringArray
		if err := rows.Scan(&e.ID, &e.Slug, &e.Formato, &nome, &desc, &ind, &e.Medidas, &destaques); err != nil {
			return nil, err
		}
		if e.Nome, err = lerTexto(nome); err != nil {
			return nil, err
		}
		if e.Descricao, err = lerTexto(desc); err != nil {
			return nil, err
		}
		if e.Indicado, err = lerTexto(ind); err != nil {
			return nil, err
		}
		e.Destaques = []string(destaques)
		lista = append(lista, e)
	}
	return lista, rows.Err()
}

// Cortes devolve o catálogo de cortes que o modelo de espelho reconhece.
// Com espelhoSlug vazio, devolve todos os cortes ativos.
func (s *Store) Cortes(ctx context.Context, espelhoSlug string) ([]Corte, error) {
	q := `SELECT c.id, c.slug, c.comprimento, c.nome, c.descricao, c.como_pedir, c.manutencao_semanas
	      FROM cortes c WHERE c.ativo ORDER BY c.id`
	args := []any{}
	if espelhoSlug != "" {
		q = `SELECT c.id, c.slug, c.comprimento, c.nome, c.descricao, c.como_pedir, c.manutencao_semanas
		     FROM cortes c
		     JOIN espelho_cortes ec ON ec.corte_id = c.id
		     JOIN espelhos e ON e.id = ec.espelho_id
		     WHERE c.ativo AND e.slug = $1 ORDER BY c.id`
		args = append(args, espelhoSlug)
	}
	rows, err := s.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var lista []Corte
	for rows.Next() {
		var c Corte
		var nome, desc, pedir []byte
		if err := rows.Scan(&c.ID, &c.Slug, &c.Comprimento, &nome, &desc, &pedir, &c.ManutencaoSemanas); err != nil {
			return nil, err
		}
		if c.Nome, err = lerTexto(nome); err != nil {
			return nil, err
		}
		if c.Descricao, err = lerTexto(desc); err != nil {
			return nil, err
		}
		if c.ComoPedir, err = lerTexto(pedir); err != nil {
			return nil, err
		}
		lista = append(lista, c)
	}
	return lista, rows.Err()
}

// AnaliseEmCache busca uma análise recente da mesma foto, no mesmo idioma e modelo de espelho.
func (s *Store) AnaliseEmCache(ctx context.Context, sha, idioma string, espelhoID int, validade time.Duration) (*Analise, error) {
	var a Analise
	var esp, corte sql.NullInt64
	var conf sql.NullFloat64
	var dur sql.NullInt64
	err := s.db.QueryRowContext(ctx, `
		SELECT id, foto_sha256, idioma, espelho_id, corte_id, confianca, resposta, provedor, modelo, demonstracao, duracao_ms, criado_em
		FROM analises
		WHERE foto_sha256 = $1 AND idioma = $2 AND espelho_id = $3 AND NOT demonstracao AND criado_em > $4
		ORDER BY criado_em DESC LIMIT 1`,
		sha, idioma, espelhoID, time.Now().Add(-validade)).
		Scan(&a.ID, &a.FotoSHA256, &a.Idioma, &esp, &corte, &conf, &a.Resposta, &a.Provedor, &a.Modelo, &a.Demonstracao, &dur, &a.CriadoEm)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNaoEncontrado
	}
	if err != nil {
		return nil, err
	}
	if esp.Valid {
		v := int(esp.Int64)
		a.EspelhoID = &v
	}
	if corte.Valid {
		v := int(corte.Int64)
		a.CorteID = &v
	}
	a.Confianca = conf.Float64
	a.DuracaoMS = int(dur.Int64)
	return &a, nil
}

// SalvarAnalise grava o resultado (nunca a foto) e devolve o id.
func (s *Store) SalvarAnalise(ctx context.Context, a Analise) (int64, error) {
	var id int64
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO analises (foto_sha256, idioma, espelho_id, corte_id, confianca, resposta, provedor, modelo, demonstracao, duracao_ms)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
		a.FotoSHA256, a.Idioma, a.EspelhoID, a.CorteID, a.Confianca, []byte(a.Resposta), a.Provedor, a.Modelo, a.Demonstracao, a.DuracaoMS).
		Scan(&id)
	return id, err
}

// SalvarLead grava um formulário de Contato ou Trabalhe Conosco.
func (s *Store) SalvarLead(ctx context.Context, l Lead) (int64, error) {
	var id int64
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO leads (tipo, nome, email, telefone, empresa, tipo_negocio, area, link, mensagem, idioma, consentimento, ip_hash)
		VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''), $9, $10, $11, NULLIF($12, ''))
		RETURNING id`,
		l.Tipo, l.Nome, l.Email, l.Telefone, l.Empresa, l.TipoNegocio, l.Area, l.Link, l.Mensagem, l.Idioma, l.Consentimento, l.IPHash).
		Scan(&id)
	return id, err
}
