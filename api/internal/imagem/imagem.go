// Package imagem valida e normaliza as fotos enviadas.
//
// Toda foto é decodificada e recodificada em JPEG: isso descarta metadados EXIF
// (como a localização GPS do celular) antes de qualquer envio para a IA.
package imagem

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"image"
	"image/color"
	"image/jpeg"
	_ "image/png"
)

const (
	LadoMaximo = 1024 // a IA não precisa de mais que isso para reconhecer um corte
	LadoMinimo = 96
	MaxPixels  = 40_000_000 // protege contra imagens gigantes ("bombas" de descompressão)
)

var (
	ErrFormato = errors.New("formato não suportado: envie JPEG ou PNG")
	ErrPequena = errors.New("imagem pequena demais")
	ErrGrande  = errors.New("imagem grande demais")
)

// Normalizar devolve a foto em JPEG, no máximo LadoMaximo px, e o SHA-256 do resultado.
func Normalizar(dados []byte) ([]byte, string, error) {
	cfg, _, err := image.DecodeConfig(bytes.NewReader(dados))
	if err != nil {
		return nil, "", ErrFormato
	}
	if cfg.Width < LadoMinimo || cfg.Height < LadoMinimo {
		return nil, "", ErrPequena
	}
	if cfg.Width*cfg.Height > MaxPixels {
		return nil, "", ErrGrande
	}
	img, _, err := image.Decode(bytes.NewReader(dados))
	if err != nil {
		return nil, "", ErrFormato
	}
	img = reduzir(img, LadoMaximo)

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85}); err != nil {
		return nil, "", err
	}
	soma := sha256.Sum256(buf.Bytes())
	return buf.Bytes(), hex.EncodeToString(soma[:]), nil
}

// reduzir encolhe a imagem pela média de áreas (boa qualidade, sem dependências).
func reduzir(src image.Image, lado int) image.Image {
	b := src.Bounds()
	w, h := b.Dx(), b.Dy()
	if w <= lado && h <= lado {
		return paraRGBA(src)
	}
	nw, nh := lado, h*lado/w
	if h > w {
		nw, nh = w*lado/h, lado
	}
	if nw < 1 {
		nw = 1
	}
	if nh < 1 {
		nh = 1
	}
	dst := image.NewRGBA(image.Rect(0, 0, nw, nh))
	for y := 0; y < nh; y++ {
		y0 := b.Min.Y + y*h/nh
		y1 := b.Min.Y + (y+1)*h/nh
		if y1 <= y0 {
			y1 = y0 + 1
		}
		for x := 0; x < nw; x++ {
			x0 := b.Min.X + x*w/nw
			x1 := b.Min.X + (x+1)*w/nw
			if x1 <= x0 {
				x1 = x0 + 1
			}
			var r, g, bl, n uint64
			for yy := y0; yy < y1; yy++ {
				for xx := x0; xx < x1; xx++ {
					cr, cg, cb, _ := src.At(xx, yy).RGBA()
					r += uint64(cr)
					g += uint64(cg)
					bl += uint64(cb)
					n++
				}
			}
			dst.SetRGBA(x, y, color.RGBA{uint8(r / n >> 8), uint8(g / n >> 8), uint8(bl / n >> 8), 255})
		}
	}
	return dst
}

// paraRGBA achata transparências sobre fundo branco (JPEG não tem alfa).
func paraRGBA(src image.Image) image.Image {
	b := src.Bounds()
	dst := image.NewRGBA(image.Rect(0, 0, b.Dx(), b.Dy()))
	for y := b.Min.Y; y < b.Max.Y; y++ {
		for x := b.Min.X; x < b.Max.X; x++ {
			r, g, bl, a := src.At(x, y).RGBA()
			// compõe sobre branco
			r = r + (0xffff - a)
			g = g + (0xffff - a)
			bl = bl + (0xffff - a)
			dst.SetRGBA(x-b.Min.X, y-b.Min.Y, color.RGBA{uint8(r >> 8), uint8(g >> 8), uint8(bl >> 8), 255})
		}
	}
	return dst
}
