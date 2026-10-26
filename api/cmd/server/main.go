// Comando server sobe a API do site da MiraV (formulários de Contato e Trabalhe Conosco).
//
// Variáveis de ambiente (veja .env.example):
//
//	DATABASE_URL       conexão PostgreSQL (obrigatória)
//	PORT               porta HTTP (padrão 8080)
//	ALLOWED_ORIGINS    origens do site separadas por vírgula
//	IP_SALT            sal para anonimizar o IP gravado nos formulários
//	TRUST_PROXY        "true" lê o IP real do cabeçalho X-Forwarded-For (Render)
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
)

func env(nome, padrao string) string {
	if v := strings.TrimSpace(os.Getenv(nome)); v != "" {
		return v
	}
	return padrao
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

	var origens []string
	for _, o := range strings.Split(env("ALLOWED_ORIGINS", "http://localhost:3000"), ",") {
		if o = strings.TrimSpace(o); o != "" {
			origens = append(origens, o)
		}
	}

	srv := httpapi.Novo(banco, httpapi.Config{
		OrigensPermitidas: origens,
		ConfiarProxy:      env("TRUST_PROXY", "true") == "true",
		SalIP:             env("IP_SALT", "troque-este-sal"),
	}, log)

	http := &http.Server{
		Addr:              ":" + env("PORT", "8080"),
		Handler:           srv.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       60 * time.Second,
		WriteTimeout:      30 * time.Second,
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
