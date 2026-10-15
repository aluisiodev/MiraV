package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/mirav/visavision-api/internal/db"
	"github.com/mirav/visavision-api/internal/imagem"
	"github.com/mirav/visavision-api/internal/llm"
)

type resultadoDTO struct {
	ID              int64      `json:"id,omitempty"`
	EhCabelo        bool       `json:"e_cabelo"`
	Corte           *corteDTO  `json:"corte"`
	Confianca       float64    `json:"confianca"`
	Alternativas    []corteDTO `json:"alternativas"`
	Caracteristicas []string   `json:"caracteristicas"`
	Explicacao      string     `json:"explicacao"`
	Espelho         espelhoMin `json:"espelho"`
	Provedor        string     `json:"provedor"`
	Modelo          string     `json:"modelo"`
	Demonstracao    bool       `json:"demonstracao"`
	Cache           bool       `json:"cache"`
	DuracaoMS       int        `json:"duracao_ms"`
}

type espelhoMin struct {
	Slug    string `json:"slug"`
	Nome    string `json:"nome"`
	Formato string `json:"formato"`
}

// analisar recebe multipart/form-data com: foto (arquivo), espelho (slug) e idioma.
func (s *Servidor) analisar(w http.ResponseWriter, r *http.Request) {
	if ok, espera := s.limIA.Permitir(s.ipCliente(r)); !ok {
		s.muitasRequisicoes(w, r, espera)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, s.cfg.TamanhoMaxFoto+64<<10)
	if err := r.ParseMultipartForm(s.cfg.TamanhoMaxFoto); err != nil {
		var mbe *http.MaxBytesError
		if errors.As(err, &mbe) {
			s.falha(w, r, http.StatusRequestEntityTooLarge, "foto_grande", nil)
			return
		}
		s.falha(w, r, http.StatusBadRequest, "foto_ausente", nil)
		return
	}
	defer r.MultipartForm.RemoveAll()
	idioma := idiomaDe(r)

	arquivo, _, err := r.FormFile("foto")
	if err != nil {
		s.falha(w, r, http.StatusBadRequest, "foto_ausente", nil)
		return
	}
	bruto, err := io.ReadAll(io.LimitReader(arquivo, s.cfg.TamanhoMaxFoto+1))
	arquivo.Close()
	if err != nil {
		s.falha(w, r, http.StatusBadRequest, "foto_ausente", nil)
		return
	}

	// Modelo de espelho escolhido.
	espelhos, err := s.banco.Espelhos(r.Context())
	if err != nil {
		s.erroInterno(w, r, "espelhos", err)
		return
	}
	slug := r.FormValue("espelho")
	var esp *db.Espelho
	for i := range espelhos {
		if espelhos[i].Slug == slug {
			esp = &espelhos[i]
			break
		}
	}
	if esp == nil {
		s.falha(w, r, http.StatusBadRequest, "espelho_invalido", nil)
		return
	}

	foto, sha, err := imagem.Normalizar(bruto)
	switch {
	case errors.Is(err, imagem.ErrPequena):
		s.falha(w, r, http.StatusUnprocessableEntity, "foto_pequena", nil)
		return
	case errors.Is(err, imagem.ErrGrande):
		s.falha(w, r, http.StatusRequestEntityTooLarge, "foto_grande", nil)
		return
	case err != nil:
		s.falha(w, r, http.StatusUnsupportedMediaType, "foto_formato", nil)
		return
	}

	cortes, err := s.banco.Cortes(r.Context(), esp.Slug)
	if err != nil {
		s.erroInterno(w, r, "cortes", err)
		return
	}
	minimo := espelhoMin{Slug: esp.Slug, Nome: esp.Nome.Em(idioma), Formato: esp.Formato}

	// Mesma foto já analisada? Devolve do cache e poupa a cota gratuita.
	if a, err := s.banco.AnaliseEmCache(r.Context(), sha, idioma, esp.ID, s.cfg.ValidadeCache); err == nil {
		var resp llm.Resposta
		if json.Unmarshal(a.Resposta, &resp) == nil {
			dto := montarResultado(resp, cortes, idioma, minimo)
			dto.ID, dto.Provedor, dto.Modelo, dto.Cache, dto.DuracaoMS = a.ID, a.Provedor, a.Modelo, true, a.DuracaoMS
			escreverJSON(w, http.StatusOK, dto)
			return
		}
	}

	catalogo := make([]llm.ItemCatalogo, 0, len(cortes))
	for _, c := range cortes {
		catalogo = append(catalogo, llm.ItemCatalogo{
			Slug: c.Slug, Nome: c.Nome.Em("pt"), NomeEN: c.Nome.Em("en"), Descricao: c.Descricao.Em("pt"),
		})
	}

	ctx, cancel := context.WithTimeout(r.Context(), 90*time.Second)
	defer cancel()
	inicio := time.Now()
	res, err := s.ia.Analisar(ctx, llm.Pedido{Foto: foto, Mime: "image/jpeg", Idioma: idioma, Catalogo: catalogo})
	duracao := int(time.Since(inicio).Milliseconds())
	if err != nil {
		s.log.Warn("IA indisponível", "erro", err)
		s.falha(w, r, http.StatusServiceUnavailable, "ia_indisponivel", nil)
		return
	}

	dto := montarResultado(res.Resposta, cortes, idioma, minimo)
	dto.Provedor, dto.Modelo, dto.Demonstracao, dto.DuracaoMS = res.Provedor, res.Modelo, res.Demonstracao, duracao

	bruta, _ := json.Marshal(res.Resposta)
	reg := db.Analise{
		FotoSHA256: sha, Idioma: idioma, EspelhoID: &esp.ID, Confianca: res.Confianca,
		Resposta: bruta, Provedor: res.Provedor, Modelo: res.Modelo, Demonstracao: res.Demonstracao, DuracaoMS: duracao,
	}
	if dto.Corte != nil {
		for _, c := range cortes {
			if c.Slug == dto.Corte.Slug {
				id := c.ID
				reg.CorteID = &id
			}
		}
	}
	// Falha ao gravar não impede a resposta: o visitante recebe o resultado mesmo assim.
	if id, err := s.banco.SalvarAnalise(r.Context(), reg); err != nil {
		s.log.Error("gravar análise", "erro", err)
	} else {
		dto.ID = id
	}
	escreverJSON(w, http.StatusOK, dto)
}

func montarResultado(resp llm.Resposta, cortes []db.Corte, idioma string, esp espelhoMin) resultadoDTO {
	porSlug := make(map[string]db.Corte, len(cortes))
	for _, c := range cortes {
		porSlug[c.Slug] = c
	}
	dto := resultadoDTO{
		EhCabelo:        resp.EhCabelo,
		Confianca:       resp.Confianca,
		Caracteristicas: resp.Caracteristicas,
		Explicacao:      resp.Explicacao,
		Alternativas:    []corteDTO{},
		Espelho:         esp,
	}
	if dto.Caracteristicas == nil {
		dto.Caracteristicas = []string{}
	}
	if c, ok := porSlug[resp.Corte]; ok {
		cc := corteCompleto(c, idioma)
		dto.Corte = &cc
	}
	for _, a := range resp.Alternativas {
		if c, ok := porSlug[a]; ok {
			dto.Alternativas = append(dto.Alternativas, corteDTO{Slug: c.Slug, Nome: c.Nome.Em(idioma), ComoPedir: c.ComoPedir.Em(idioma)})
		}
	}
	return dto
}
