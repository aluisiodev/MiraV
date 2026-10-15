// Package limite controla quantas requisições cada visitante pode fazer.
// Protege as cotas gratuitas das IAs contra abuso.
package limite

import (
	"sync"
	"time"
)

type balde struct {
	fichas float64
	visto  time.Time
}

// Limitador é um "balde de fichas" por chave (normalmente o IP).
type Limitador struct {
	mu         sync.Mutex
	baldes     map[string]*balde
	capacidade float64
	porSegundo float64
	agora      func() time.Time
}

// Novo permite `capacidade` requisições seguidas e repõe `porMinuto` fichas a cada minuto.
func Novo(capacidade int, porMinuto float64) *Limitador {
	return &Limitador{
		baldes:     make(map[string]*balde),
		capacidade: float64(capacidade),
		porSegundo: porMinuto / 60,
		agora:      time.Now,
	}
}

// Permitir gasta uma ficha da chave. Devolve falso e o tempo de espera se não houver ficha.
func (l *Limitador) Permitir(chave string) (bool, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()
	agora := l.agora()
	b, ok := l.baldes[chave]
	if !ok {
		b = &balde{fichas: l.capacidade, visto: agora}
		l.baldes[chave] = b
	}
	b.fichas += agora.Sub(b.visto).Seconds() * l.porSegundo
	if b.fichas > l.capacidade {
		b.fichas = l.capacidade
	}
	b.visto = agora
	if len(l.baldes) > 10_000 {
		l.limpar(agora)
	}
	if b.fichas >= 1 {
		b.fichas--
		return true, 0
	}
	espera := time.Duration((1 - b.fichas) / l.porSegundo * float64(time.Second))
	return false, espera
}

// limpar remove baldes cheios e parados há mais de 10 minutos.
func (l *Limitador) limpar(agora time.Time) {
	for k, b := range l.baldes {
		if agora.Sub(b.visto) > 10*time.Minute {
			delete(l.baldes, k)
		}
	}
}
