package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mirav/visavision-api/internal/db"
)

// bancoFalso faz o papel do PostgreSQL nos testes: guarda os formulários na memória.
type bancoFalso struct {
	leads []db.Lead
}

func (b *bancoFalso) Ping(context.Context) error { return nil }

func (b *bancoFalso) SalvarLead(_ context.Context, l db.Lead) (int64, error) {
	b.leads = append(b.leads, l)
	return int64(len(b.leads)), nil
}

func novoTeste() (*Servidor, *bancoFalso) {
	banco := &bancoFalso{}
	s := Novo(banco, Config{OrigensPermitidas: []string{"https://mirav.example"}, SalIP: "teste"}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	return s, banco
}

func postJSON(h http.Handler, rota string, corpo any) *httptest.ResponseRecorder {
	b, _ := json.Marshal(corpo)
	r := httptest.NewRequest(http.MethodPost, rota, bytes.NewReader(b))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}

func TestContato(t *testing.T) {
	s, banco := novoTeste()
	h := s.Handler()
	ok := map[string]any{
		"nome": "Aluísio Alves", "email": "Contato@MiraV.com.br", "telefone": "+55 (11) 98888-7777",
		"empresa": "Barbearia Ouro", "tipo_negocio": "barbearia", "mensagem": "Quero uma demonstração do espelho.",
		"idioma": "pt", "consentimento": true,
	}
	if w := postJSON(h, "/v1/contato", ok); w.Code != http.StatusCreated {
		t.Fatalf("status %d: %s", w.Code, w.Body)
	}
	if len(banco.leads) != 1 || banco.leads[0].Email != "contato@mirav.com.br" || banco.leads[0].IPHash == "" {
		t.Fatalf("lead gravado errado: %+v", banco.leads)
	}

	ruim := map[string]any{"nome": "A", "email": "sem-arroba", "mensagem": "curta", "tipo_negocio": "padaria", "consentimento": false, "idioma": "es"}
	w := postJSON(h, "/v1/contato", ruim)
	if w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status %d", w.Code)
	}
	var e erroAPI
	json.Unmarshal(w.Body.Bytes(), &e)
	if e.Mensagem != Mensagem("campos_invalidos", "es") {
		t.Errorf("mensagem deveria vir em espanhol: %q", e.Mensagem)
	}
	for _, c := range []string{"nome", "email", "mensagem", "tipo_negocio", "consentimento"} {
		if e.Campos[c] == "" {
			t.Errorf("campo %s deveria estar inválido: %+v", c, e.Campos)
		}
	}
}

func TestCandidaturaEIsca(t *testing.T) {
	s, banco := novoTeste()
	h := s.Handler()
	c := map[string]any{
		"nome": "Livia Felix", "email": "livia@exemplo.com", "area": "design",
		"link": "https://www.linkedin.com/in/exemplo", "mensagem": "Gostaria de fazer parte da equipe.", "consentimento": true,
	}
	if w := postJSON(h, "/v1/candidaturas", c); w.Code != http.StatusCreated {
		t.Fatalf("status %d: %s", w.Code, w.Body)
	}
	c["link"] = "javascript:alert(1)"
	if w := postJSON(h, "/v1/candidaturas", c); w.Code != http.StatusUnprocessableEntity {
		t.Fatalf("link perigoso deveria ser recusado, status %d", w.Code)
	}
	robo := map[string]any{"site": "http://spam", "nome": "x"}
	if w := postJSON(h, "/v1/candidaturas", robo); w.Code != http.StatusCreated {
		t.Fatalf("isca deveria fingir sucesso, status %d", w.Code)
	}
	if len(banco.leads) != 1 {
		t.Fatalf("só a candidatura válida deveria ser gravada, há %d", len(banco.leads))
	}
}

func TestCORSESaude(t *testing.T) {
	s, _ := novoTeste()
	h := s.Handler()
	r := httptest.NewRequest(http.MethodOptions, "/v1/contato", nil)
	r.Header.Set("Origin", "https://mirav.example")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != http.StatusNoContent || w.Header().Get("Access-Control-Allow-Origin") != "https://mirav.example" {
		t.Fatalf("preflight falhou: %d %v", w.Code, w.Header())
	}
	r = httptest.NewRequest(http.MethodGet, "/saude", nil)
	r.Header.Set("Origin", "https://intruso.example")
	w = httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("origem não permitida recebeu CORS")
	}
	if w.Code != http.StatusOK {
		t.Fatalf("/saude deveria responder 200, veio %d", w.Code)
	}
}

func TestVivoNaoUsaBanco(t *testing.T) {
	s := Novo(bancoQuebrado{}, Config{}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	w := httptest.NewRecorder()
	s.Handler().ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/vivo", nil))
	if w.Code != http.StatusOK {
		t.Fatalf("/vivo deveria responder 200 mesmo com o banco fora, veio %d", w.Code)
	}
}

// bancoQuebrado falha em tudo: serve para provar que /vivo não depende do banco.
type bancoQuebrado struct{}

func (bancoQuebrado) Ping(context.Context) error { return context.DeadlineExceeded }
func (bancoQuebrado) SalvarLead(context.Context, db.Lead) (int64, error) {
	return 0, context.DeadlineExceeded
}

func TestRotaDeAnaliseRemovida(t *testing.T) {
	s, _ := novoTeste()
	w := httptest.NewRecorder()
	s.Handler().ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/v1/analises", nil))
	if w.Code != http.StatusNotFound && w.Code != http.StatusMethodNotAllowed {
		t.Fatalf("a análise de corte foi retirada; esperava 404, veio %d", w.Code)
	}
}
