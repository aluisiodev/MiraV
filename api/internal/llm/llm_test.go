package llm

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

var catalogo = []ItemCatalogo{
	{Slug: "topete", Nome: "Topete", NomeEN: "Pompadour"},
	{Slug: "chanel", Nome: "Chanel", NomeEN: "Bob"},
	{Slug: "pixie", Nome: "Pixie", NomeEN: "Pixie cut"},
	{Slug: "undercut", Nome: "Undercut", NomeEN: "Undercut"},
}

func TestInterpretar(t *testing.T) {
	casos := []struct {
		nome, texto, corte string
		alt                []string
		erro               bool
	}{
		{"json puro", `{"e_cabelo":true,"corte":"topete","confianca":0.9,"alternativas":["undercut"],"caracteristicas":["a"],"explicacao":"x"}`, "topete", []string{"undercut"}, false},
		{"com raciocinio e cerca", "<think>hmm {não é isso}</think>\n```json\n{\"e_cabelo\":true,\"corte\":\"Chanel\",\"confianca\":0.7}\n```", "chanel", []string{}, false},
		{"slug inventado vira vazio", `{"e_cabelo":true,"corte":"moicano-roxo","confianca":0.9}`, "", []string{}, false},
		{"alternativas filtradas", `{"e_cabelo":true,"corte":"pixie","alternativas":["pixie","xx","chanel","chanel","topete","undercut"]}`, "pixie", []string{"chanel", "topete", "undercut"}, false},
		{"sem cabelo", `{"e_cabelo":false,"corte":"pixie"}`, "", []string{}, false},
		{"texto sem json", "não sei", "", nil, true},
	}
	for _, c := range casos {
		t.Run(c.nome, func(t *testing.T) {
			r, err := Interpretar(c.texto, catalogo)
			if c.erro {
				if err == nil {
					t.Fatal("esperava erro")
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if r.Corte != c.corte {
				t.Fatalf("corte = %q, quero %q", r.Corte, c.corte)
			}
			if strings.Join(r.Alternativas, ",") != strings.Join(c.alt, ",") {
				t.Fatalf("alternativas = %v, quero %v", r.Alternativas, c.alt)
			}
		})
	}
}

func TestInterpretarLimitaConfianca(t *testing.T) {
	r, _ := Interpretar(`{"e_cabelo":true,"corte":"topete","confianca":7}`, catalogo)
	if r.Confianca != 1 {
		t.Fatalf("confiança = %v", r.Confianca)
	}
	r, _ = Interpretar(`{"e_cabelo":true,"corte":"inexistente","confianca":0.9}`, catalogo)
	if r.Confianca != 0 {
		t.Fatalf("slug inválido deveria zerar a confiança, veio %v", r.Confianca)
	}
}

func TestPromptTemCatalogoEIdioma(t *testing.T) {
	p := PromptSistema("es", catalogo)
	for _, trecho := range []string{"topete | Topete | Pompadour", "español", "Nunca invente slugs"} {
		if !strings.Contains(p, trecho) {
			t.Errorf("prompt sem %q", trecho)
		}
	}
}

// Cadeia: o primeiro provedor falha (429) e o segundo responde.
func TestCadeiaDeProvedores(t *testing.T) {
	ruim := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
		w.Write([]byte(`{"error":{"message":"rate limit"}}`))
	}))
	defer ruim.Close()

	var recebido corpoPedido
	bom := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/chat/completions" || r.Header.Get("Authorization") != "Bearer k2" {
			t.Errorf("pedido inesperado: %s %s", r.URL.Path, r.Header.Get("Authorization"))
		}
		json.NewDecoder(r.Body).Decode(&recebido)
		w.Write([]byte(`{"choices":[{"message":{"content":"{\"e_cabelo\":true,\"corte\":\"chanel\",\"confianca\":0.8}"}}]}`))
	}))
	defer bom.Close()

	c := NovoCliente([]Provedor{
		{Nome: "a", BaseURL: ruim.URL, Chave: "k1", Modelo: "m1"},
		{Nome: "b", BaseURL: bom.URL, Chave: "k2", Modelo: "m2", JSONMode: true},
	}, false)
	res, err := c.Analisar(context.Background(), Pedido{Foto: []byte{1, 2, 3}, Mime: "image/jpeg", Idioma: "pt", Catalogo: catalogo})
	if err != nil {
		t.Fatal(err)
	}
	if res.Provedor != "b" || res.Corte != "chanel" || res.Demonstracao {
		t.Fatalf("resultado inesperado: %+v", res)
	}
	if recebido.Model != "m2" || recebido.ResponseFormat["type"] != "json_object" {
		t.Fatalf("corpo enviado inesperado: %+v", recebido)
	}
	if len(recebido.Messages) != 2 {
		t.Fatal("esperava mensagens de sistema e usuário")
	}
}

func TestSemProvedorUsaDemonstracao(t *testing.T) {
	c := NovoCliente(nil, true)
	r1, err := c.Analisar(context.Background(), Pedido{Foto: []byte("foto"), Idioma: "en", Catalogo: catalogo})
	if err != nil || !r1.Demonstracao || r1.Corte == "" {
		t.Fatalf("demonstração falhou: %+v %v", r1, err)
	}
	r2, _ := c.Analisar(context.Background(), Pedido{Foto: []byte("foto"), Idioma: "en", Catalogo: catalogo})
	if r1.Corte != r2.Corte {
		t.Fatal("demonstração deveria ser estável para a mesma foto")
	}
	if !strings.Contains(r1.Explicacao, "simulated") {
		t.Fatalf("explicação deveria estar em inglês: %q", r1.Explicacao)
	}

	semDemo := NovoCliente(nil, false)
	if _, err := semDemo.Analisar(context.Background(), Pedido{Catalogo: catalogo}); err == nil {
		t.Fatal("sem provedor e sem demonstração deveria falhar")
	}
}
