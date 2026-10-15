// Package llm identifica o corte de cabelo de uma foto usando modelos de visão gratuitos.
//
// Todos os provedores falam o formato da API da OpenAI (chat completions), então trocar
// de provedor é só trocar URL, chave e modelo. Eles são tentados em ordem: se um falhar
// ou estourar o limite gratuito, o próximo assume.
package llm

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// Provedor é um endpoint compatível com a API da OpenAI.
type Provedor struct {
	Nome    string // ex.: "groq"
	BaseURL string // ex.: "https://api.groq.com/openai/v1"
	Chave   string // vazio para Ollama local
	Modelo  string
	// JSONMode envia response_format {"type":"json_object"}. Desligue se o provedor recusar.
	JSONMode bool
}

// ItemCatalogo é um corte que a IA pode escolher.
type ItemCatalogo struct {
	Slug      string
	Nome      string // em português, para o modelo
	NomeEN    string
	Descricao string
}

// Pedido é o que a API envia para a análise.
type Pedido struct {
	Foto     []byte // JPEG já normalizado
	Mime     string
	Idioma   string // pt, en, es
	Catalogo []ItemCatalogo
}

// Resposta é o JSON que o modelo devolve, já validado contra o catálogo.
type Resposta struct {
	EhCabelo        bool     `json:"e_cabelo"`
	Corte           string   `json:"corte"`
	Confianca       float64  `json:"confianca"`
	Alternativas    []string `json:"alternativas"`
	Caracteristicas []string `json:"caracteristicas"`
	Explicacao      string   `json:"explicacao"`
}

// Resultado junta a resposta e quem respondeu.
type Resultado struct {
	Resposta
	Provedor     string
	Modelo       string
	Demonstracao bool
}

// Cliente tenta os provedores em ordem.
type Cliente struct {
	Provedores []Provedor
	HTTP       *http.Client
	// Demonstracao, quando verdadeiro, devolve uma resposta simulada se nenhum provedor
	// responder. Serve de plano B na apresentação sem internet.
	Demonstracao bool
}

var ErrSemProvedor = errors.New("nenhum provedor de IA respondeu")

func NovoCliente(provedores []Provedor, demonstracao bool) *Cliente {
	return &Cliente{
		Provedores:   provedores,
		HTTP:         &http.Client{Timeout: 45 * time.Second},
		Demonstracao: demonstracao,
	}
}

var nomesIdioma = map[string]string{"pt": "português do Brasil", "en": "English", "es": "español"}

// PromptSistema monta as instruções com o catálogo fechado de cortes.
func PromptSistema(idioma string, catalogo []ItemCatalogo) string {
	var b strings.Builder
	b.WriteString("Você é o assistente de visagismo do espelho inteligente VisaVision, da MiraV.\n")
	b.WriteString("Recebe UMA foto e identifica o corte de cabelo da pessoa, escolhendo SOMENTE entre os cortes do catálogo abaixo.\n\n")
	b.WriteString("CATÁLOGO (slug | nome | inglês | descrição):\n")
	for _, c := range catalogo {
		fmt.Fprintf(&b, "- %s | %s | %s | %s\n", c.Slug, c.Nome, c.NomeEN, c.Descricao)
	}
	b.WriteString("\nREGRAS:\n")
	b.WriteString("1. Responda APENAS com um objeto JSON, sem texto fora dele e sem markdown.\n")
	b.WriteString("2. Se a foto não mostrar cabelo humano com clareza (paisagem, objeto, rosto coberto, imagem muito escura), use \"e_cabelo\": false e \"corte\": \"\".\n")
	b.WriteString("3. \"corte\" e \"alternativas\" devem ser slugs EXATOS do catálogo. Nunca invente slugs.\n")
	b.WriteString("4. \"confianca\" vai de 0 a 1. Use menos de 0.5 quando estiver em dúvida.\n")
	b.WriteString("5. \"caracteristicas\": de 2 a 4 observações curtas e visíveis na foto (comprimento, laterais, franja, textura).\n")
	b.WriteString("6. \"explicacao\": uma ou duas frases dizendo por que esse corte, em tom formal e acolhedor.\n")
	b.WriteString("7. Não comente aparência física, idade, gênero, etnia ou qualquer traço pessoal: fale só do cabelo.\n")
	fmt.Fprintf(&b, "8. Escreva \"caracteristicas\" e \"explicacao\" em %s.\n\n", nomesIdioma[idiomaValido(idioma)])
	b.WriteString(`FORMATO: {"e_cabelo": true, "corte": "slug", "confianca": 0.0, "alternativas": ["slug", "slug"], "caracteristicas": ["..."], "explicacao": "..."}`)
	return b.String()
}

func idiomaValido(i string) string {
	if _, ok := nomesIdioma[i]; ok {
		return i
	}
	return "pt"
}

// Analisar tenta cada provedor até um responder com JSON válido.
func (c *Cliente) Analisar(ctx context.Context, p Pedido) (Resultado, error) {
	var erros []string
	for _, prov := range c.Provedores {
		texto, err := c.chamar(ctx, prov, p)
		if err != nil {
			erros = append(erros, fmt.Sprintf("%s: %v", prov.Nome, err))
			continue
		}
		resp, err := Interpretar(texto, p.Catalogo)
		if err != nil {
			erros = append(erros, fmt.Sprintf("%s: resposta inválida: %v", prov.Nome, err))
			continue
		}
		return Resultado{Resposta: resp, Provedor: prov.Nome, Modelo: prov.Modelo}, nil
	}
	if c.Demonstracao {
		return Simular(p), nil
	}
	if len(erros) == 0 {
		return Resultado{}, ErrSemProvedor
	}
	return Resultado{}, fmt.Errorf("%w: %s", ErrSemProvedor, strings.Join(erros, "; "))
}

type mensagem struct {
	Role    string `json:"role"`
	Content any    `json:"content"`
}

type parte struct {
	Type     string    `json:"type"`
	Text     string    `json:"text,omitempty"`
	ImageURL *imageURL `json:"image_url,omitempty"`
}

type imageURL struct {
	URL string `json:"url"`
}

type corpoPedido struct {
	Model          string            `json:"model"`
	Messages       []mensagem        `json:"messages"`
	Temperature    float64           `json:"temperature"`
	MaxTokens      int               `json:"max_tokens"`
	ResponseFormat map[string]string `json:"response_format,omitempty"`
}

type corpoResposta struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (c *Cliente) chamar(ctx context.Context, prov Provedor, p Pedido) (string, error) {
	dataURL := "data:" + p.Mime + ";base64," + base64.StdEncoding.EncodeToString(p.Foto)
	corpo := corpoPedido{
		Model: prov.Modelo,
		Messages: []mensagem{
			{Role: "system", Content: PromptSistema(p.Idioma, p.Catalogo)},
			{Role: "user", Content: []parte{
				{Type: "text", Text: "Identifique o corte de cabelo desta foto e responda só com o JSON."},
				{Type: "image_url", ImageURL: &imageURL{URL: dataURL}},
			}},
		},
		Temperature: 0.1,
		MaxTokens:   1200,
	}
	if prov.JSONMode {
		corpo.ResponseFormat = map[string]string{"type": "json_object"}
	}
	payload, err := json.Marshal(corpo)
	if err != nil {
		return "", err
	}
	url := strings.TrimRight(prov.BaseURL, "/") + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if prov.Chave != "" {
		req.Header.Set("Authorization", "Bearer "+prov.Chave)
	}
	res, err := c.HTTP.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()
	bruto, err := io.ReadAll(io.LimitReader(res.Body, 2<<20))
	if err != nil {
		return "", err
	}
	var r corpoResposta
	_ = json.Unmarshal(bruto, &r)
	if res.StatusCode != http.StatusOK {
		msg := strings.TrimSpace(string(bruto))
		if r.Error != nil && r.Error.Message != "" {
			msg = r.Error.Message
		}
		if len(msg) > 300 {
			msg = msg[:300]
		}
		return "", fmt.Errorf("HTTP %d: %s", res.StatusCode, msg)
	}
	if len(r.Choices) == 0 || strings.TrimSpace(r.Choices[0].Message.Content) == "" {
		return "", errors.New("resposta vazia")
	}
	return r.Choices[0].Message.Content, nil
}

var (
	reThink = regexp.MustCompile(`(?s)<think>.*?</think>`)
	reCerca = regexp.MustCompile("(?s)```(?:json)?\\s*(.*?)```")
)

// Interpretar extrai e valida o JSON do texto devolvido pelo modelo.
// Aceita blocos <think> (modelos de raciocínio) e cercas de markdown.
func Interpretar(texto string, catalogo []ItemCatalogo) (Resposta, error) {
	t := reThink.ReplaceAllString(texto, "")
	if m := reCerca.FindStringSubmatch(t); m != nil {
		t = m[1]
	}
	ini, fim := strings.Index(t, "{"), strings.LastIndex(t, "}")
	if ini < 0 || fim <= ini {
		return Resposta{}, errors.New("sem JSON na resposta")
	}
	var r Resposta
	if err := json.Unmarshal([]byte(t[ini:fim+1]), &r); err != nil {
		return Resposta{}, err
	}

	validos := make(map[string]bool, len(catalogo))
	for _, c := range catalogo {
		validos[c.Slug] = true
	}
	r.Corte = strings.TrimSpace(strings.ToLower(r.Corte))
	if !validos[r.Corte] {
		// Slug fora do catálogo: tratamos como não identificado em vez de inventar.
		if r.Corte != "" {
			r.Confianca = 0
		}
		r.Corte = ""
	}
	if !r.EhCabelo {
		r.Corte = ""
	}
	alt := make([]string, 0, 3)
	visto := map[string]bool{r.Corte: true}
	for _, a := range r.Alternativas {
		a = strings.TrimSpace(strings.ToLower(a))
		if validos[a] && !visto[a] && len(alt) < 3 {
			alt = append(alt, a)
			visto[a] = true
		}
	}
	r.Alternativas = alt
	if r.Confianca < 0 {
		r.Confianca = 0
	}
	if r.Confianca > 1 {
		r.Confianca = 1
	}
	if len(r.Caracteristicas) > 4 {
		r.Caracteristicas = r.Caracteristicas[:4]
	}
	r.Explicacao = strings.TrimSpace(r.Explicacao)
	if len(r.Explicacao) > 600 {
		r.Explicacao = r.Explicacao[:600]
	}
	return r, nil
}

// Simular devolve uma resposta de demonstração, sempre a mesma para a mesma foto.
// O site mostra o selo "demonstração" quando ela é usada.
func Simular(p Pedido) Resultado {
	var soma uint32
	for _, b := range p.Foto {
		soma = soma*31 + uint32(b)
	}
	r := Resultado{Provedor: "demonstracao", Modelo: "simulado", Demonstracao: true}
	r.EhCabelo = true
	r.Confianca = 0.6
	if n := len(p.Catalogo); n > 0 {
		i := int(soma % uint32(n))
		r.Corte = p.Catalogo[i].Slug
		r.Alternativas = []string{p.Catalogo[(i+1)%n].Slug, p.Catalogo[(i+2)%n].Slug}
	}
	textos := map[string][2]string{ // [selo, explicação]
		"pt": {"Resultado de demonstração", "A IA está desligada neste momento, então este resultado é simulado e serve só para mostrar como a tela funciona."},
		"en": {"Demo result", "The AI is offline right now, so this result is simulated and only shows how the screen works."},
		"es": {"Resultado de demostración", "La IA está desconectada en este momento, así que este resultado es simulado y solo muestra cómo funciona la pantalla."},
	}
	r.Caracteristicas = []string{}
	r.Explicacao = textos[idiomaValido(p.Idioma)][1]
	return r
}
