package imagem

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"
)

func foto(w, h int) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			img.Set(x, y, color.RGBA{uint8(x), uint8(y), 120, 255})
		}
	}
	return img
}

func TestReduzEMantemProporcao(t *testing.T) {
	var buf bytes.Buffer
	png.Encode(&buf, foto(3000, 4000))
	saida, sha, err := Normalizar(buf.Bytes())
	if err != nil {
		t.Fatal(err)
	}
	cfg, formato, err := image.DecodeConfig(bytes.NewReader(saida))
	if err != nil || formato != "jpeg" {
		t.Fatalf("saída deveria ser JPEG: %v %s", err, formato)
	}
	if cfg.Height != LadoMaximo || cfg.Width != 768 {
		t.Fatalf("tamanho %dx%d, quero 768x1024", cfg.Width, cfg.Height)
	}
	if len(sha) != 64 {
		t.Fatal("sha256 inválido")
	}
}

func TestRemoveEXIF(t *testing.T) {
	var buf bytes.Buffer
	jpeg.Encode(&buf, foto(400, 400), nil)
	orig := buf.Bytes()
	// Insere um segmento APP1 "Exif" logo depois do SOI (FFD8).
	exif := append([]byte{0xFF, 0xE1, 0x00, 0x10}, []byte("Exif\x00\x00GPS-AQUI")...)
	comExif := append(append(append([]byte{}, orig[:2]...), exif...), orig[2:]...)

	saida, _, err := Normalizar(comExif)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Contains(saida, []byte("Exif")) || bytes.Contains(saida, []byte("GPS-AQUI")) {
		t.Fatal("metadados EXIF continuaram na foto")
	}
}

func TestRecusa(t *testing.T) {
	if _, _, err := Normalizar([]byte("não é imagem")); err != ErrFormato {
		t.Fatalf("esperava ErrFormato, veio %v", err)
	}
	var buf bytes.Buffer
	png.Encode(&buf, foto(40, 40))
	if _, _, err := Normalizar(buf.Bytes()); err != ErrPequena {
		t.Fatalf("esperava ErrPequena, veio %v", err)
	}
}
