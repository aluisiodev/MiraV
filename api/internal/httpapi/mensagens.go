package httpapi

var mensagens = map[string]map[string]string{
	"limite": {
		"pt": "Muitas tentativas seguidas. Aguarde alguns segundos e tente de novo.",
		"en": "Too many attempts in a row. Please wait a few seconds and try again.",
		"es": "Demasiados intentos seguidos. Espera unos segundos e inténtalo de nuevo.",
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
