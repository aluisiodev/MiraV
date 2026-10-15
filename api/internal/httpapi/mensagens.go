package httpapi

var mensagens = map[string]map[string]string{
	"limite": {
		"pt": "Muitas tentativas seguidas. Aguarde alguns segundos e tente de novo.",
		"en": "Too many attempts in a row. Please wait a few seconds and try again.",
		"es": "Demasiados intentos seguidos. Espera unos segundos e inténtalo de nuevo.",
	},
	"foto_ausente": {
		"pt": "Envie uma foto para a análise.",
		"en": "Please send a photo to analyse.",
		"es": "Envía una foto para el análisis.",
	},
	"foto_grande": {
		"pt": "A foto é grande demais. Use uma imagem de até 8 MB.",
		"en": "The photo is too large. Please use an image up to 8 MB.",
		"es": "La foto es demasiado grande. Usa una imagen de hasta 8 MB.",
	},
	"foto_pequena": {
		"pt": "A foto é pequena demais para reconhecer o corte.",
		"en": "The photo is too small to recognise the haircut.",
		"es": "La foto es demasiado pequeña para reconocer el corte.",
	},
	"foto_formato": {
		"pt": "Formato não suportado. Envie JPEG ou PNG.",
		"en": "Unsupported format. Please send a JPEG or PNG.",
		"es": "Formato no compatible. Envía JPEG o PNG.",
	},
	"espelho_invalido": {
		"pt": "Escolha um modelo de espelho válido.",
		"en": "Please choose a valid mirror model.",
		"es": "Elige un modelo de espejo válido.",
	},
	"ia_indisponivel": {
		"pt": "A IA está indisponível no momento. Tente novamente em instantes.",
		"en": "The AI is unavailable right now. Please try again shortly.",
		"es": "La IA no está disponible ahora. Inténtalo de nuevo en unos instantes.",
	},
	"json_invalido": {
		"pt": "Não foi possível ler o formulário.",
		"en": "The form could not be read.",
		"es": "No se pudo leer el formulario.",
	},
	"campos_invalidos": {
		"pt": "Revise os campos destacados.",
		"en": "Please review the highlighted fields.",
		"es": "Revisa los campos destacados.",
	},
	"interno": {
		"pt": "Algo deu errado do nosso lado. Tente novamente.",
		"en": "Something went wrong on our side. Please try again.",
		"es": "Algo salió mal de nuestro lado. Inténtalo de nuevo.",
	},
}

// Mensagem devolve o texto do erro no idioma pedido.
func Mensagem(codigo, idioma string) string {
	m, ok := mensagens[codigo]
	if !ok {
		m = mensagens["interno"]
	}
	if v, ok := m[idioma]; ok {
		return v
	}
	return m["pt"]
}
