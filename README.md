# CaseCellShop

- `api/` - backend em Fastify + TypeScript, dados em memória.
- `web/` - frontend em React + Vite + TypeScript.

## Como rodar

### Docker

```bash
docker compose up -d
```

Sobe a API em `http://localhost:3000` e o web em `http://localhost:5173`. Sem precisar instalar Node/pnpm localmente.

### Manual

### 1. API (`api/`)

```bash
cd api
pnpm install
pnpm dev
```

### 2. Web (`web/`)

Em outro terminal:

```bash
cd web
pnpm install
pnpm dev
```

## Testes

```bash
cd api
pnpm test
```

`api/tests` cobre validação de checkout, idempotência, reserva de estoque e as rotas HTTP, rodando a app em processo (`app.inject`).

### Integração + E2E (`web/e2e`)

```bash
cd web
pnpm exec playwright install chromium
pnpm test:e2e
```

Sobe API (`:3000`) e web (`:5173`) juntos e roda a stack de ponta a ponta:

- `api.spec.ts` - contrato HTTP contra a API rodando de verdade (rede, CORS e headers reais), que é o contrato consumido pelo `web/src/api/client.ts`.
- `checkout.spec.ts` - rodada no navegador: catálogo → carrinho → checkout → confirmação.

## Decisões e trade-offs

Ver [`DECISIONS.md`](./DECISIONS.md).
