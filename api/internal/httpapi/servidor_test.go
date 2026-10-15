package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"image"
	"image/color"
	"image/png"
	"io"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/mirav/visavision-api/internal/db"
	"github.com/mirav/visavision-api/internal/llm"
)

type bancoFalso struct {
	analises []db.Analise
	leads    []db.Lead
}

func (b *bancoFalso) Ping(context.Context) error { return nil }

func (b *bancoFalso) Espelhos(context.Context) ([]db.Espelho, error) {
	return []db.Espelho{{
		ID: 1, Slug: "retangular", Formato: "retangular",
		Nome:      db.Texto{"pt": "Retangular", "en": "Rectangular"},
		Descricao: db.Texto{"pt": "d"}, Indicado: db.Texto{"pt": "i"},
		Destaques: []string{"topete"},
	}}, nil
}

func (b *bancoFalso) Cortes(context.Context, string) ([]db.Corte, error) {
	return []db.Corte{
		{ID: 1, Slug: "topete", Comprimento: "curto", Nome: db.Texto{"pt": "Topete", "en": "Pompadour"}, Descricao: db.Texto{"pt": "d"}, ComoPedir: db.Texto{"pt": "peça"}},
		{ID: 2, Slug: "chanel", Comprimento: "medio", Nome: db.Texto{"pt": "Chanel", "en": "Bob"}, Descricao: db.Texto{"pt": "d"}, ComoPedir: db.Texto{"pt": "peça"}},
	}, nil
}

func (b *bancoFalso) AnaliseEmCache(_ context.Context, sha, idioma string, espelhoID int, _ time.Duration) (*db.Analise, error) {
	for i := len(b.analises) - 1; i >= 0; i-- {
		a := b.analises[i]
		if a.FotoSHA256 == sha && a.Idioma == idioma && *a.EspelhoID == espelhoID && !a.Demonstracao {
			return &a, nil
		}
	}
	return nil, db.ErrNaoEncontrado
}

func (b *bancoFalso) SalvarAnalise(_ context.Context, a db.Analise) (int64, error) {
	b.analises = append(b.analises, a)
	return int64(len(b.analises)), nil
}

func (b *bancoFalso) SalvarLead(_ context.Context, l db.Lead) (int64, error) {
	b.leads = append(b.leads, l)
	return int64(len(b.leads)), nil
}

type iaFalsa struct{ chamadas int }

func (f *iaFalsa) Analisar(_ context.Context, p llm.Pedido) (llm.Resultado, error) {
	f.chamadas++
	return llm.Resultado{
		Resposta: llm.Resposta{EhCabelo: true, Corte: "topete", Confianca: 0.9, Alternativas: []string{"chanel"}, Caracteristicas: []string{"volume"}, Explicacao: "ok"},
		Provedor: "falso", Modelo: "m",
	}, nil
}

func novoTeste() (*Servidor, *bancoFalso, *iaFalsa) {
	b, ia := &bancoFalso{}, &iaFalsa{}
	log := slog.New(slog.NewTextHandler(io.Discard, nil))
	s := Novo(b, ia, Config{OrigensPermitidas: []string{"https://mirav.example"}}, log)
	return s, b, ia
}

func pedidoFoto(t *testing.T, espelho, idioma string) *http.Request {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, 300, 400))
	for i := range img.Pix {
		img.Pix[i] = uint8(i % 251)
	}
	img.Set(0, 0, color.White)
	var foto bytes.Buffer
	png.Encode(&foto, img)

	var corpo bytes.Buffer
	mw := multipart.NewWriter(&corpo)
	fw, _ := mw.CreateFormFile("foto", "corte.png")
	fw.Write(foto.Bytes())
	mw.WriteField("espelho", espelho)
	mw.WriteField("idioma", idioma)
	mw.Close()
	r := httptest.NewRequest(http.MethodPost, "/v1/analises", &corpo)
	r.Header.Set("Content-Type", mw.FormDataContentType())
	return r
}

func TestAnaliseECache(t *testing.T) {
	s, banco, ia := novoTeste()
	h := s.Handler()

	w := httptest.NewRecorder()
	h.ServeHTTP(w, pedidoFoto(t, "retangular", "en"))
	if w.Code != http.StatusOK {
		t.Fatalf("status %d: %s", w.Code, w.Body)
	}
	var res resultadoDTO
	json.Unmarshal(w.Body.Bytes(), &res)
	if res.Corte == nil || res.Corte.Nome != "Pompadour" || res.Espelho.Nome != "Rectangular" || res.Cache {
		t.Fatalf("resultado inesperado: %s", w.Body)
	}
	if len(res.Alternativas) != 1 || res.Alternativas[0].Nome != "Bob" {
		t.Fatalf("alternativas: %+v", res.Alternativas)
	}
	if len(banco.analises) != 1 || banco.analises[0].CorteID == nil || *banco.analises[0].CorteID != 1 {
		t.Fatal("análise não foi gravada com o corte")
	}

	// Mesma foto de novo: vem do cache, sem chamar a IA.
	w = httptest.NewRecorder()
	h.ServeHTTP(w, pedidoFoto(t, "retangular", "en"))
	json.Unmarshal(w.Body.Bytes(), &res)
	if !res.Cache || ia.chamadas != 1 {
		t.Fatalf("esperava cache: cache=%v chamadas=%d", res.Cache, ia.chamadas)
	}
}

func TestAnaliseRecusaEspelhoESemFoto(t *testing.T) {
	s, _, _ := novoTeste()
	h := s.Handler()
	w := httptest.NewRecorder()
	h.ServeHTTP(w, pedidoFoto(t, "triangular", "pt"))
	if w.Code != http.StatusBadRequest || !strings.Contains(w.Body.String(), "espelho_invalido") {
		t.Fatalf("status %d: %s", w.Code, w.Body)
	}
	w = httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest(http.MethodPost, "/v1/analises", strings.NewReader("x")))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("sem foto: status %d", w.Code)
	}
}

func TestLimiteDeAnalises(t *testing.T) {
	s, _, _ := novoTeste()
	h := s.Handler()
	ultimo := 0
	for i := 0; i < 7; i++ {
		w := httptest.NewRecorder()
		h.ServeHTTP(w, pedidoFoto(t, "retangular", "pt"))
		ultimo = w.Code
		if w.Code == http.StatusTooManyRequests && w.Header().Get("Retry-After") == "" {
			t.Fatal("429 sem Retry-After")
		}
	}
	if ultimo != http.StatusTooManyRequests {
		t.Fatalf("depois de 7 seguidas esperava 429, veio %d", ultimo)
	}
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
	s, banco, _ := novoTeste()
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
	s, banco, _ := novoTeste()
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

func TestCORSEEspelhos(t *testing.T) {
	s, _, _ := novoTeste()
	h := s.Handler()
	r := httptest.NewRequest(http.MethodOptions, "/v1/contato", nil)
	r.Header.Set("Origin", "https://mirav.example")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Code != http.StatusNoContent || w.Header().Get("Access-Control-Allow-Origin") != "https://mirav.example" {
		t.Fatalf("preflight falhou: %d %v", w.Code, w.Header())
	}
	r = httptest.NewRequest(http.MethodGet, "/v1/espelhos?idioma=en", nil)
	r.Header.Set("Origin", "https://intruso.example")
	w = httptest.NewRecorder()
	h.ServeHTTP(w, r)
	if w.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("origem não permitida recebeu CORS")
	}
	if !strings.Contains(w.Body.String(), `"nome":"Rectangular"`) || !strings.Contains(w.Body.String(), `"nome":"Pompadour"`) {
		t.Fatalf("espelhos em inglês: %s", w.Body)
	}
}
