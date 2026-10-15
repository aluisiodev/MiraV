// Package httpapi expõe a API REST usada pelo site.
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
	"github.com/mirav/visavision-api/internal/llm"
)

// Banco é o que a API precisa do PostgreSQL (permite testar sem banco).
type Banco interface {
	Ping(ctx context.Context) error
	Espelhos(ctx context.Context) ([]db.Espelho, error)
	Cortes(ctx context.Context, espelhoSlug string) ([]db.Corte, error)
	AnaliseEmCache(ctx context.Context, sha, idioma string, espelhoID int, validade time.Duration) (*db.Analise, error)
	SalvarAnalise(ctx context.Context, a db.Analise) (int64, error)
	SalvarLead(ctx context.Context, l db.Lead) (int64, error)
}

// Analisador é a IA (ou um dublê nos testes).
type Analisador interface {
	Analisar(ctx context.Context, p llm.Pedido) (llm.Resultado, error)
}

type Config struct {
	OrigensPermitidas []string // "*" libera tudo (só para desenvolvimento)
	ConfiarProxy      bool     // ler o IP de X-Forwarded-For (Render, Koyeb etc.)
	SalIP             string   // usado para anonimizar o IP gravado nos formulários
	ValidadeCache     time.Duration
	TamanhoMaxFoto    int64
}

type Servidor struct {
	banco    Banco
	ia       Analisador
	cfg      Config
	log      *slog.Logger
	limIA    *limite.Limitador
	limForm  *limite.Limitador
	limGeral *limite.Limitador
}

func Novo(banco Banco, ia Analisador, cfg Config, log *slog.Logger) *Servidor {
	if cfg.ValidadeCache == 0 {
		cfg.ValidadeCache = 30 * 24 * time.Hour
	}
	if cfg.TamanhoMaxFoto == 0 {
		cfg.TamanhoMaxFoto = 8 << 20
	}
	return &Servidor{
		banco:    banco,
		ia:       ia,
		cfg:      cfg,
		log:      log,
		limIA:    limite.Novo(5, 6), // 5 seguidas, depois 6 por minuto
		limForm:  limite.Novo(3, 2), // formulários: 3 seguidos, depois 2 por minuto
		limGeral: limite.Novo(60, 120),
	}
}

// Handler devolve o roteador com os middlewares aplicados.
func (s *Servidor) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /saude", s.saude)
	mux.HandleFunc("GET /v1/espelhos", s.listarEspelhos)
	mux.HandleFunc("GET /v1/cortes", s.listarCortes)
	mux.HandleFunc("POST /v1/analises", s.analisar)
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

// idiomaDe lê ?idioma=, depois o campo do formulário, depois Accept-Language.
func idiomaDe(r *http.Request) string {
	cands := []string{r.URL.Query().Get("idioma")}
	if r.MultipartForm != nil {
		if v := r.MultipartForm.Value["idioma"]; len(v) > 0 {
			cands = append(cands, v[0])
		}
	}
	cands = append(cands, r.Header.Get("Accept-Language"))
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

type corteDTO struct {
	Slug              string `json:"slug"`
	Nome              string `json:"nome"`
	Descricao         string `json:"descricao,omitempty"`
	ComoPedir         string `json:"como_pedir,omitempty"`
	Comprimento       string `json:"comprimento,omitempty"`
	ManutencaoSemanas int    `json:"manutencao_semanas,omitempty"`
}

type espelhoDTO struct {
	Slug      string     `json:"slug"`
	Formato   string     `json:"formato"`
	Nome      string     `json:"nome"`
	Descricao string     `json:"descricao"`
	Indicado  string     `json:"indicado"`
	Medidas   string     `json:"medidas,omitempty"`
	Destaques []corteDTO `json:"destaques"`
}

func corteCompleto(c db.Corte, idioma string) corteDTO {
	return corteDTO{
		Slug: c.Slug, Nome: c.Nome.Em(idioma), Descricao: c.Descricao.Em(idioma),
		ComoPedir: c.ComoPedir.Em(idioma), Comprimento: c.Comprimento, ManutencaoSemanas: c.ManutencaoSemanas,
	}
}

func (s *Servidor) listarEspelhos(w http.ResponseWriter, r *http.Request) {
	idioma := idiomaDe(r)
	espelhos, err := s.banco.Espelhos(r.Context())
	if err != nil {
		s.erroInterno(w, r, "listar espelhos", err)
		return
	}
	cortes, err := s.banco.Cortes(r.Context(), "")
	if err != nil {
		s.erroInterno(w, r, "listar cortes", err)
		return
	}
	porSlug := map[string]db.Corte{}
	for _, c := range cortes {
		porSlug[c.Slug] = c
	}
	lista := make([]espelhoDTO, 0, len(espelhos))
	for _, e := range espelhos {
		d := espelhoDTO{
			Slug: e.Slug, Formato: e.Formato, Nome: e.Nome.Em(idioma), Descricao: e.Descricao.Em(idioma),
			Indicado: e.Indicado.Em(idioma), Medidas: e.Medidas, Destaques: []corteDTO{},
		}
		for _, slug := range e.Destaques {
			if c, ok := porSlug[slug]; ok {
				d.Destaques = append(d.Destaques, corteDTO{Slug: c.Slug, Nome: c.Nome.Em(idioma)})
			}
		}
		lista = append(lista, d)
	}
	w.Header().Set("Cache-Control", "public, max-age=300")
	escreverJSON(w, http.StatusOK, map[string]any{"espelhos": lista})
}

func (s *Servidor) listarCortes(w http.ResponseWriter, r *http.Request) {
	idioma := idiomaDe(r)
	cortes, err := s.banco.Cortes(r.Context(), r.URL.Query().Get("espelho"))
	if err != nil {
		s.erroInterno(w, r, "listar cortes", err)
		return
	}
	lista := make([]corteDTO, 0, len(cortes))
	for _, c := range cortes {
		lista = append(lista, corteCompleto(c, idioma))
	}
	w.Header().Set("Cache-Control", "public, max-age=300")
	escreverJSON(w, http.StatusOK, map[string]any{"cortes": lista})
}

func (s *Servidor) erroInterno(w http.ResponseWriter, r *http.Request, onde string, err error) {
	s.log.Error("erro interno", "onde", onde, "erro", err)
	s.falha(w, r, http.StatusInternalServerError, "interno", nil)
}
