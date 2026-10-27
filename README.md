# MiraV · VisaVision

Site de divulgação do **VisaVision**, o espelho inteligente da MiraV.

> *Mais certeza para o cliente, mais resultado para o seu negócio.*


| Pasta | O que é | Tecnologia |
|---|---|---|
| `web/` | Site: home (com o espelho interativo e o Miro), Produtos, Sobre, Contato, Trabalhe Conosco (com as vagas) e a tela do QR code `/qr` | Next.js 16 (TypeScript, Tailwind 4, three.js), exportado como site estático |
| `api/` | API: recebe os formulários de Contato e Trabalhe Conosco | Go 1.24 (só biblioteca padrão + `lib/pq`) |
| `api/internal/db/migrations/` | Tabela dos formulários | PostgreSQL 16 |


---

## Rodar no computador

Você precisa de **Go 1.24+**, **Node 20+** e **PostgreSQL 16** (ou Docker).

### 1. Banco e API

Com Docker (mais simples):

```bash
cp api/.env.example api/.env
docker compose up --build         # sobe PostgreSQL e API em http://localhost:8080
```

Sem Docker, com um PostgreSQL já instalado:

```bash
cd api
cp .env.example .env              # ajuste DATABASE_URL
export $(grep -v '^#' .env | xargs)
go run ./cmd/server
```

A API cria a tabela sozinha na primeira execução. Teste com:

```bash
curl http://localhost:8080/saude
```

### 2. Site

```bash
cd web
cp .env.example .env.local        # para enviar à API local: NEXT_PUBLIC_API_URL=http://localhost:8080
npm install
npm run dev                       # http://localhost:3000
```

Páginas: `/`, `/produtos/`, `/sobre/`, `/contato/`, `/trabalhe-conosco/` (e uma página para cada vaga).
Fora do menu: `/qr/`, a tela do telão, com um QR code que leva à home.

### 3. Testes

```bash
cd api && go test ./...           # API: formulários, limites de envio, CORS
cd web && npm run lint && npm run build
```

---

**Para receber os formulários de verdade (opcional, depois):**

| Parte | Serviço | Observações |
|---|---|---|
| Banco | **Neon** (plano Free) | 1 GB por projeto, sem cartão e sem prazo. Região AWS US East 1. Use o endereço sem `-pooler`. O banco "dorme" após 5 min parado e acorda sozinho. |
| API | **Render** (Free, Docker) | Use o `render.yaml` (New > Blueprint). O serviço dorme após 15 min sem acesso e leva cerca de 1 min para acordar. Não use o Postgres gratuito do Render, que expira em 30 dias. |

Depois, defina `NEXT_PUBLIC_API_URL` no Cloudflare com o endereço da API e coloque o endereço do site em `ALLOWED_ORIGINS` na API (é o que libera o CORS).

---

## Banco de dados

- `leads`: formulários de Contato e Trabalhe Conosco, com o IP anonimizado por hash.

Para ver os formulários recebidos:

```sql
SELECT tipo, nome, email, tipo_negocio, area, mensagem, criado_em FROM leads ORDER BY criado_em DESC;
```

## API

| Método | Rota | Corpo |
|---|---|---|
| GET | `/saude` | |
| POST | `/v1/contato` | JSON: `nome`, `email`, `telefone?`, `empresa?`, `tipo_negocio?`, `mensagem`, `consentimento`, `idioma` |
| POST | `/v1/candidaturas` | JSON: `nome`, `email`, `telefone?`, `area`, `link?`, `mensagem`, `consentimento`, `idioma` |

Os erros vêm com `erro` (código), `mensagem` (no idioma pedido) e `campos` (o que está inválido). Os formulários aceitam 3 envios seguidos e depois 2 por minuto, por visitante.

## Identidade

Paleta azul da marca, com dois temas: **claro** (padrão) e **escuro marinho**, trocados pelo botão de lua/sol no cabeçalho. Azul principal `#0C67F1`, azul escuro `#0846A4`, ciano `#01A9DB`, marinho `#0A1D39` (texto) e `#00102A` (fundo do tema escuro). As cores ficam em `web/src/app/globals.css`.

Fontes: Space Grotesk (títulos e texto), Cormorant Garamond itálico (destaques), JetBrains Mono (rótulos) e Cinzel (palavra MIRAV).

Logo: no site aparece o **olho da logo azul**. Nas telas de carregamento entra a versão simplificada.

**Miro:** o robozinho em pixel art da MiraV. Na home ele explica o espelho e cada seção; em Produtos, conta onde cada espelho fica melhor.

Os números da home aparecem como estimativas da MiraV, e os casos como exemplos de uso.

Equipe: Luan Sousa (CEO), Aluísio Alves (CTO), Caio (COO), Ryan (CFO) e Livia Felix (CMO). Site desenvolvido por Aluísio Alves.
