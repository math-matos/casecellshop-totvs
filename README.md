# CaseCellShop

- `api/` - backend em Fastify + TypeScript, dados em memória.
- `web/` - frontend em React + Vite + TypeScript.

## Como rodar

### Windows (scripts .bat)

Instalação mais prática:

- Execute o .bat: `install-and-run.bat` - instala as dependências da API e do Web e já sobe os dois em dev.

Cada um abre a API e o Web em janelas de terminal separadas.

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
