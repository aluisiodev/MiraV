package httpapi

import (
	"encoding/json"
	"net/http"
	"net/mail"
	"net/url"
	"strings"
	"unicode/utf8"

	"github.com/mirav/visavision-api/internal/db"
)

// formulario cobre os campos de Contato e de Trabalhe Conosco.
type formulario struct {
	Nome          string `json:"nome"`
	Email         string `json:"email"`
	Telefone      string `json:"telefone"`
	Empresa       string `json:"empresa"`
	TipoNegocio   string `json:"tipo_negocio"`
	Area          string `json:"area"`
	Link          string `json:"link"`
	Mensagem      string `json:"mensagem"`
	Idioma        string `json:"idioma"`
	Consentimento bool   `json:"consentimento"`
	// Site é um campo-isca invisível: pessoas não preenchem, robôs sim.
	Site string `json:"site"`
}

var tiposNegocio = map[string]bool{
	"barbearia": true, "salao": true, "clinica": true, "coloracao": true, "rede": true, "outro": true,
}

var areas = map[string]bool{
	"desenvolvimento": true, "design": true, "ia": true, "comercial": true, "atendimento": true, "outra": true,
}

func limpar(s string) string { return strings.TrimSpace(s) }

func tamanho(campos map[string]string, nome, valor string, min, max int) {
	n := utf8.RuneCountInString(valor)
	if n < min || n > max {
		campos[nome] = "tamanho"
	}
}

// Validar confere os campos comuns e os específicos de cada tipo.
// Devolve um mapa campo → código de erro (vazio quando está tudo certo).
func (f *formulario) Validar(tipo string) map[string]string {
	f.Nome, f.Email, f.Telefone = limpar(f.Nome), strings.ToLower(limpar(f.Email)), limpar(f.Telefone)
	f.Empresa, f.TipoNegocio, f.Area = limpar(f.Empresa), limpar(f.TipoNegocio), limpar(f.Area)
	f.Link, f.Mensagem = limpar(f.Link), limpar(f.Mensagem)
	switch f.Idioma {
	case "pt", "en", "es":
	default:
		f.Idioma = "pt"
	}

	campos := map[string]string{}
	tamanho(campos, "nome", f.Nome, 2, 120)
	if a, err := mail.ParseAddress(f.Email); err != nil || a.Address != f.Email || len(f.Email) > 200 || !strings.Contains(f.Email[strings.LastIndex(f.Email, "@")+1:], ".") {
		campos["email"] = "formato"
	}
	tamanho(campos, "mensagem", f.Mensagem, 10, 4000)
	if !f.Consentimento {
		campos["consentimento"] = "obrigatorio"
	}
	if f.Telefone != "" {
		digitos := 0
		for _, r := range f.Telefone {
			switch {
			case r >= '0' && r <= '9':
				digitos++
			case strings.ContainsRune(" +()-.", r):
			default:
				campos["telefone"] = "formato"
			}
		}
		if digitos < 8 || digitos > 15 {
			campos["telefone"] = "formato"
		}
	}

	switch tipo {
	case "contato":
		tamanho(campos, "empresa", f.Empresa, 0, 160)
		if f.TipoNegocio != "" && !tiposNegocio[f.TipoNegocio] {
			campos["tipo_negocio"] = "opcao"
		}
		f.Area, f.Link = "", ""
	case "candidatura":
		if !areas[f.Area] {
			campos["area"] = "opcao"
		}
		if f.Link != "" {
			u, err := url.Parse(f.Link)
			if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || len(f.Link) > 300 {
				campos["link"] = "formato"
			}
		}
		f.Empresa, f.TipoNegocio = "", ""
	}
	return campos
}

func (s *Servidor) contato(w http.ResponseWriter, r *http.Request) {
	s.receberFormulario(w, r, "contato")
}
func (s *Servidor) candidatura(w http.ResponseWriter, r *http.Request) {
	s.receberFormulario(w, r, "candidatura")
}

func (s *Servidor) receberFormulario(w http.ResponseWriter, r *http.Request, tipo string) {
	if ok, espera := s.limForm.Permitir(s.ipCliente(r)); !ok {
		s.muitasRequisicoes(w, r, espera)
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 32<<10)
	var f formulario
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(&f); err != nil {
		s.falha(w, r, http.StatusBadRequest, "json_invalido", nil)
		return
	}
	if f.Site != "" {
		// Robô: respondemos como sucesso para não ensinar o truque, mas não gravamos.
		escreverJSON(w, http.StatusCreated, map[string]any{"ok": true})
		return
	}
	if campos := f.Validar(tipo); len(campos) > 0 {
		falhaEm(w, f.Idioma, http.StatusUnprocessableEntity, "campos_invalidos", campos)
		return
	}
	id, err := s.banco.SalvarLead(r.Context(), db.Lead{
		Tipo: tipo, Nome: f.Nome, Email: f.Email, Telefone: f.Telefone, Empresa: f.Empresa,
		TipoNegocio: f.TipoNegocio, Area: f.Area, Link: f.Link, Mensagem: f.Mensagem,
		Idioma: f.Idioma, Consentimento: f.Consentimento, IPHash: s.hashIP(r),
	})
	if err != nil {
		s.erroInterno(w, r, "gravar formulário", err)
		return
	}
	escreverJSON(w, http.StatusCreated, map[string]any{"ok": true, "id": id})
}
