# MiraV · VisaVision

Site de divulgação do **VisaVision**, o espelho inteligente da MiraV.

> *Mais certeza para o cliente, mais resultado para o seu negócio.*

Projeto acadêmico. A apresentação é em **29/10/2026**. Todo o projeto roda **sem custo** (R$ 0).

| Pasta | O que é | Tecnologia |
|---|---|---|
| `web/` | Site: home, Produtos, Sobre, Contato, Trabalhe Conosco, página secreta `/espelho` e tela do QR code `/qr` | Next.js 16 (TypeScript, Tailwind 4), exportado como site estático |
| `api/` | API: formulários, catálogo de espelhos e cortes, análise da foto com IA | Go 1.24 (só biblioteca padrão + `lib/pq`) |
| `api/internal/db/migrations/` | Tabelas e catálogo inicial (5 espelhos, 24 cortes em PT/EN/ES) | PostgreSQL 16 |

---

## Rodar no computador

Você precisa de **Go 1.24+**, **Node 20+** e **PostgreSQL 16** (ou Docker).

### 1. Banco e API

Com Docker (mais simples):

```bash
cp api/.env.example api/.env      # preencha ao menos uma chave de IA (opcional)
docker compose up --build         # sobe PostgreSQL e API em http://localhost:8080
```

Sem Docker, com um PostgreSQL já instalado:

```bash
cd api
cp .env.example .env              # ajuste DATABASE_URL
export $(grep -v '^#' .env | xargs)
go run ./cmd/server
```

A API cria as tabelas e o catálogo sozinha na primeira execução. Teste com:

```bash
curl http://localhost:8080/saude
curl "http://localhost:8080/v1/espelhos?idioma=pt"
```

### 2. Site

```bash
cd web
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8080
npm install
npm run dev                       # http://localhost:3000
```

Páginas: `/`, `/produtos/`, `/sobre/`, `/contato/`, `/trabalhe-conosco/`.
Fora do menu e sem indexação no Google: `/espelho/` (Como funciona) e `/qr/` (tela do telão).

### 3. Testes

```bash
cd api && go test ./...           # API: IA, imagem, limites, formulários, CORS
cd web && npm run lint && npm run build
```

---

## IA gratuita

A API conversa com qualquer provedor compatível com a API da OpenAI. Basta **uma** chave; se houver várias, ela tenta na ordem de `LLM_ORDER` e passa para a próxima quando uma falha ou estoura o limite gratuito.

| Provedor | Variáveis | Onde pegar a chave |
|---|---|---|
| Groq (principal) | `GROQ_API_KEY`, `GROQ_MODEL` | console.groq.com → API Keys |
| Google Gemini (reserva) | `GEMINI_API_KEY`, `GEMINI_MODEL` | aistudio.google.com → Get API key |
| OpenRouter (opcional) | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | openrouter.ai → Keys (use um modelo de visão `:free`) |
| Ollama (offline, no notebook) | `OLLAMA_URL`, `OLLAMA_MODEL` | `ollama pull qwen3-vl:8b` |

Os nomes de modelo padrão estão no `.env.example`. Antes da apresentação, confira na página de cada provedor se o modelo de visão ainda está disponível no plano gratuito.

**Plano B:** com `DEMO_FALLBACK=true`, se nenhuma IA responder, a API devolve um resultado simulado. O site mostra o selo "Resultado de demonstração".

**Como a análise funciona:**
1. O site reduz a foto no próprio celular (até 1024 px, em JPEG). Os metadados, como a localização GPS, são descartados.
2. A API decodifica e recodifica a imagem de novo, por segurança. Depois calcula o SHA-256.
3. Se a mesma foto já foi analisada, a resposta sai do cache, sem gastar cota.
4. O prompt manda a IA escolher **somente** cortes do catálogo do banco e responder em JSON. Qualquer slug inventado é descartado.
5. O banco guarda **só o resultado**, nunca a foto.

Há limite de uso por visitante: 5 análises seguidas e depois 6 por minuto. Os formulários permitem 3 envios seguidos e depois 2 por minuto.

---

## Publicar de graça

| Parte | Serviço | Observações |
|---|---|---|
| Banco | **Neon** (plano Free) | 1 GB por projeto, sem cartão e sem prazo. O banco "dorme" após 5 min parado e acorda sozinho. |
| API | **Render** (Free, Docker) | Use o `render.yaml`. O serviço dorme após 15 min sem acesso e leva cerca de 1 min para acordar. **Abra `/saude` uns minutos antes da apresentação.** Não use o Postgres gratuito do Render, que expira em 30 dias. |
| Site | **Cloudflare Pages** ou **Vercel** (Hobby) | Diretório `web`, comando `npm run build`, saída `out`. Defina `NEXT_PUBLIC_API_URL` (URL da API) e `NEXT_PUBLIC_SITE_URL` (URL do site). |

Depois de publicar o site, coloque a URL dele em `ALLOWED_ORIGINS` na API. É o que libera o CORS.

### Checklist do dia 29/10

- [ ] Acordar a API (`/saude`) e o banco 10 minutos antes.
- [ ] Abrir `/qr/` no telão; testar o QR com dois celulares diferentes.
- [ ] Testar `/espelho/` com uma foto real em PT, EN e ES.
- [ ] Ter o Ollama rodando no notebook e `LLM_ORDER=groq,gemini,ollama` como reserva.
- [ ] Se tudo falhar, a demonstração simulada continua funcionando.

---

## Banco de dados

- `espelhos`: os 5 modelos (Retangular, Oval, Arco, Redondo, Personalizado), com textos em PT/EN/ES em JSONB.
- `cortes`: 24 cortes com nome, descrição e "como pedir ao profissional" nos três idiomas.
- `espelho_cortes`: catálogo de cada modelo e os cortes de destaque mostrados em `/espelho`.
- `analises`: resultado de cada análise e o hash da foto (a foto não é guardada).
- `leads`: formulários de Contato e Trabalhe Conosco, com o IP anonimizado por hash.

Para ver os formulários recebidos:

```sql
SELECT tipo, nome, email, tipo_negocio, area, mensagem, criado_em FROM leads ORDER BY criado_em DESC;
```

## API

| Método | Rota | Corpo |
|---|---|---|
| GET | `/saude` | |
| GET | `/v1/espelhos?idioma=pt` | |
| GET | `/v1/cortes?idioma=pt&espelho=oval` | |
| POST | `/v1/analises` | `multipart/form-data`: `foto`, `espelho`, `idioma` |
| POST | `/v1/contato` | JSON: `nome`, `email`, `telefone?`, `empresa?`, `tipo_negocio?`, `mensagem`, `consentimento`, `idioma` |
| POST | `/v1/candidaturas` | JSON: `nome`, `email`, `telefone?`, `area`, `link?`, `mensagem`, `consentimento`, `idioma` |

Os erros vêm com `erro` (código), `mensagem` (no idioma pedido) e `campos` (o que está inválido).

## Identidade

Paleta A, "Ouro clássico": `#0B0B0C` fundo, `#17171A` superfícies, `#F4F1EA` texto, `#E0B23B` ouro e `#8A6A1F` ouro escuro.

Fontes: Space Grotesk (títulos e texto), Cormorant Garamond itálico (destaques), JetBrains Mono (rótulos) e Cinzel (palavra MIRAV no carregamento).

Logo: no site aparece o **olho da logo original**. Nas telas de carregamento, que têm animação, entra a **logo simplificada**.

Números, casos e a conversa da home são **simulados** e sinalizados assim no site.

Equipe: Aluísio Alves, Luan Sousa, Luiz Felipe, Caio, Livia Felix e Ryan.
