// Package httpapi expõe a API REST usada pelo site: saúde do serviço e os formulários
// de Contato e Trabalhe Conosco.
package httpapi

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"math"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/mirav/visavision-api/internal/db"
	"github.com/mirav/visavision-api/internal/limite"
)

// Banco é o que a API precisa do PostgreSQL (permite testar sem banco).
type Banco interface {
	Ping(ctx context.Context) error
	SalvarLead(ctx context.Context, l db.Lead) (int64, error)
}

type Config struct {
	OrigensPermitidas []string // "*" libera tudo (só para desenvolvimento)
	ConfiarProxy      bool     // ler o IP de X-Forwarded-For (Render, Koyeb etc.)
	SalIP             string   // usado para anonimizar o IP gravado nos formulários
}

type Servidor struct {
	banco    Banco
	cfg      Config
	log      *slog.Logger
	limForm  *limite.Limitador
	limGeral *limite.Limitador
}

func Novo(banco Banco, cfg Config, log *slog.Logger) *Servidor {
	return &Servidor{
		banco:    banco,
		cfg:      cfg,
		log:      log,
		limForm:  limite.Novo(3, 2), // formulários: 3 seguidos, depois 2 por minuto
		limGeral: limite.Novo(60, 120),
	}
}

// Handler devolve o roteador com os middlewares aplicados.
func (s *Servidor) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /vivo", s.vivo)
	mux.HandleFunc("GET /saude", s.saude)
	mux.HandleFunc("POST /v1/contato", s.contato)
	mux.HandleFunc("POST /v1/candidaturas", s.candidatura)
	return s.cors(s.seguranca(mux))
}

func (s *Servidor) seguranca(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cache-Control", "no-store")
		if ok, espera := s.limGeral.Permitir(s.ipCliente(r)); !ok {
			s.muitasRequisicoes(w, r, espera)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Servidor) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origem := r.Header.Get("Origin")
		if origem != "" && s.origemPermitida(origem) {
			w.Header().Set("Access-Control-Allow-Origin", origem)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Accept-Language")
			w.Header().Set("Access-Control-Max-Age", "600")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Servidor) origemPermitida(origem string) bool {
	for _, o := range s.cfg.OrigensPermitidas {
		if o == "*" || strings.EqualFold(o, origem) {
			return true
		}
	}
	return false
}

func (s *Servidor) ipCliente(r *http.Request) string {
	if s.cfg.ConfiarProxy {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			return strings.TrimSpace(strings.Split(xff, ",")[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func (s *Servidor) hashIP(r *http.Request) string {
	soma := sha256.Sum256([]byte(s.cfg.SalIP + "|" + s.ipCliente(r)))
	return hex.EncodeToString(soma[:16])
}

// ---------- respostas ----------

type erroAPI struct {
	Erro     string            `json:"erro"`
	Mensagem string            `json:"mensagem"`
	Campos   map[string]string `json:"campos,omitempty"`
}

func escreverJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func (s *Servidor) falha(w http.ResponseWriter, r *http.Request, status int, codigo string, campos map[string]string) {
	falhaEm(w, idiomaDe(r), status, codigo, campos)
}

func falhaEm(w http.ResponseWriter, idioma string, status int, codigo string, campos map[string]string) {
	escreverJSON(w, status, erroAPI{Erro: codigo, Mensagem: Mensagem(codigo, idioma), Campos: campos})
}

func (s *Servidor) muitasRequisicoes(w http.ResponseWriter, r *http.Request, espera time.Duration) {
	w.Header().Set("Retry-After", strconv.Itoa(int(math.Ceil(espera.Seconds()))))
	s.falha(w, r, http.StatusTooManyRequests, "limite", nil)
}

// idiomaDe lê ?idioma= e depois Accept-Language.
func idiomaDe(r *http.Request) string {
	cands := []string{r.URL.Query().Get("idioma"), r.Header.Get("Accept-Language")}
	for _, c := range cands {
		c = strings.ToLower(strings.TrimSpace(c))
		if len(c) >= 2 {
			switch c[:2] {
			case "pt", "en", "es":
				return c[:2]
			}
		}
	}
	return "pt"
}

// ---------- rotas ----------

// vivo responde sem consultar o banco. O Render usa esta rota para saber se a API está no ar,
// e o site chama para "acordar" a API. Assim o banco (Neon) pode dormir quando ninguém usa,
// o que economiza as horas grátis de processamento.
func (s *Servidor) vivo(w http.ResponseWriter, r *http.Request) {
	escreverJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Servidor) saude(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	bancoOK := s.banco.Ping(ctx) == nil
	status := http.StatusOK
	if !bancoOK {
		status = http.StatusServiceUnavailable
	}
	escreverJSON(w, status, map[string]any{"ok": bancoOK, "banco": bancoOK, "servico": "visavision-api"})
}

func (s *Servidor) erroInterno(w http.ResponseWriter, r *http.Request, onde string, err error) {
	s.log.Error("erro interno", "onde", onde, "erro", err)
	s.falha(w, r, http.StatusInternalServerError, "interno", nil)
}
