// Comando server sobe a API do VisaVision.
//
// Variáveis de ambiente (veja .env.example):
//
//	DATABASE_URL       conexão PostgreSQL (obrigatória)
//	PORT               porta HTTP (padrão 8080)
//	ALLOWED_ORIGINS    origens do site separadas por vírgula
//	GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, OLLAMA_URL   provedores de IA
//	LLM_ORDER          ordem dos provedores (padrão groq,gemini,openrouter,ollama)
//	DEMO_FALLBACK      "true" devolve resultado simulado se nenhuma IA responder
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/mirav/visavision-api/internal/db"
	"github.com/mirav/visavision-api/internal/httpapi"
	"github.com/mirav/visavision-api/internal/llm"
)

func env(nome, padrao string) string {
	if v := strings.TrimSpace(os.Getenv(nome)); v != "" {
		return v
	}
	return padrao
}

// provedores monta a cadeia de IAs a partir das chaves presentes no ambiente.
func provedores() []llm.Provedor {
	disponiveis := map[string]llm.Provedor{}
	if k := env("GROQ_API_KEY", ""); k != "" {
		disponiveis["groq"] = llm.Provedor{
			Nome: "groq", BaseURL: "https://api.groq.com/openai/v1", Chave: k,
			Modelo: env("GROQ_MODEL", "qwen/qwen3.8-27b"), JSONMode: true,
		}
	}
	if k := env("GEMINI_API_KEY", ""); k != "" {
		disponiveis["gemini"] = llm.Provedor{
			Nome: "gemini", BaseURL: "https://generativelanguage.googleapis.com/v1beta/openai", Chave: k,
			Modelo: env("GEMINI_MODEL", "gemini-flash-latest"), JSONMode: true,
		}
	}
	if k, m := env("OPENROUTER_API_KEY", ""), env("OPENROUTER_MODEL", ""); k != "" && m != "" {
		disponiveis["openrouter"] = llm.Provedor{
			Nome: "openrouter", BaseURL: "https://openrouter.ai/api/v1", Chave: k, Modelo: m, JSONMode: false,
		}
	}
	if u := env("OLLAMA_URL", ""); u != "" {
		disponiveis["ollama"] = llm.Provedor{
			Nome: "ollama", BaseURL: u, Modelo: env("OLLAMA_MODEL", "qwen3-vl:8b"), JSONMode: true,
		}
	}
	var lista []llm.Provedor
	for _, nome := range strings.Split(env("LLM_ORDER", "groq,gemini,openrouter,ollama"), ",") {
		if p, ok := disponiveis[strings.TrimSpace(nome)]; ok {
			lista = append(lista, p)
		}
	}
	return lista
}

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := rodar(log); err != nil {
		log.Error("encerrando", "erro", err)
		os.Exit(1)
	}
}

func rodar(log *slog.Logger) error {
	ctx, parar := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer parar()

	url := env("DATABASE_URL", "")
	if url == "" {
		return errors.New("defina DATABASE_URL")
	}
	banco, err := db.Abrir(ctx, url)
	if err != nil {
		return err
	}
	defer banco.Fechar()

	aplicadas, err := banco.Migrar(ctx)
	if err != nil {
		return err
	}
	if len(aplicadas) > 0 {
		log.Info("migrações aplicadas", "versoes", aplicadas)
	}

	provs := provedores()
	demo := env("DEMO_FALLBACK", "true") == "true"
	nomes := make([]string, 0, len(provs))
	for _, p := range provs {
		nomes = append(nomes, p.Nome+":"+p.Modelo)
	}
	log.Info("IA configurada", "provedores", nomes, "demonstracao_de_reserva", demo)
	if len(provs) == 0 && !demo {
		return errors.New("nenhuma chave de IA definida e DEMO_FALLBACK desligado")
	}

	var origens []string
	for _, o := range strings.Split(env("ALLOWED_ORIGINS", "http://localhost:3000"), ",") {
		if o = strings.TrimSpace(o); o != "" {
			origens = append(origens, o)
		}
	}

	srv := httpapi.Novo(banco, llm.NovoCliente(provs, demo), httpapi.Config{
		OrigensPermitidas: origens,
		ConfiarProxy:      env("TRUST_PROXY", "true") == "true",
		SalIP:             env("IP_SALT", "troque-este-sal"),
	}, log)

	http := &http.Server{
		Addr:              ":" + env("PORT", "8080"),
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      120 * time.Second,
		IdleTimeout:       90 * time.Second,
	}
	erros := make(chan error, 1)
	go func() {
		log.Info("API no ar", "endereco", http.Addr, "origens", origens)
		erros <- http.ListenAndServe()
	}()

	select {
	case err := <-erros:
		return err
	case <-ctx.Done():
	}
	desligar, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return http.Shutdown(desligar)
}
