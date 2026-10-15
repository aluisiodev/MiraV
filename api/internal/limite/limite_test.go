package limite

import (
	"testing"
	"time"
)

func TestBaldeDeFichas(t *testing.T) {
	agora := time.Unix(0, 0)
	l := Novo(2, 60) // 2 seguidas, 1 por segundo
	l.agora = func() time.Time { return agora }

	for i := 0; i < 2; i++ {
		if ok, _ := l.Permitir("ip"); !ok {
			t.Fatalf("requisição %d deveria passar", i+1)
		}
	}
	ok, espera := l.Permitir("ip")
	if ok || espera <= 0 || espera > time.Second {
		t.Fatalf("terceira deveria esperar até 1s: ok=%v espera=%v", ok, espera)
	}
	if ok, _ := l.Permitir("outro-ip"); !ok {
		t.Fatal("outro IP tem balde próprio")
	}
	agora = agora.Add(1100 * time.Millisecond)
	if ok, _ := l.Permitir("ip"); !ok {
		t.Fatal("depois de 1s deveria ter uma ficha")
	}
}
