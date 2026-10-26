package db

import "testing"

func TestURLParaLibPQ(t *testing.T) {
	casos := []struct{ entrada, saida string }{
		// a URL como o Neon mostra
		{"postgresql://dono:npg_abc123@ep-exemplo-123.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
			"postgresql://dono:npg_abc123@ep-exemplo-123.us-east-1.aws.neon.tech/neondb?sslmode=require"},
		// sem nada para tirar: fica igual
		{"postgres://mirav:mirav@localhost:5432/mirav?sslmode=disable", "postgres://mirav:mirav@localhost:5432/mirav?sslmode=disable"},
		// formato "chave=valor" (não é URL): fica igual
		{"host=localhost user=mirav sslmode=disable", "host=localhost user=mirav sslmode=disable"},
	}
	for _, c := range casos {
		if got := urlParaLibPQ(c.entrada); got != c.saida {
			t.Errorf("urlParaLibPQ(%q)\n  = %q\n  quero %q", c.entrada, got, c.saida)
		}
	}
}
