// Package db guarda o acesso ao PostgreSQL: migrações e formulários.
package db

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"sort"
	"strings"
	"time"

	_ "github.com/lib/pq" // driver do PostgreSQL: registra o "postgres" usado em sql.Open
)

//go:embed migrations/*.sql
var migracoes embed.FS

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
