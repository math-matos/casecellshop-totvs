# Decisões e trade-offs

OBS: coloquei atraso na api intencionalmente para simular os carregamentos.

## Persistência em memória

`api` guarda produtos, pedidos e chaves de idempotência em `Map`s (`InMemoryProductRepository`, `InMemoryOrderRepository`, `InMemoryIdempotencyStore`). Sem banco de dados por conta do case, se nao usaria um Postgres + Redis.
Em produção usaria Postgres + Redis (ou equivalente) para idempotência - só trocaria a implementação por trás das interfaces `ProductRepository` / `OrderRepository` / `IdempotencyStore`, os contratos já são pensados para isso.

## Preço e total calculados sempre no backend

O frontend nunca envia preço no `POST /checkout`, só `productId` + `quantity` (`web/src/api/client.ts`). Quem resolve o preço unitário e o total é `CheckoutService.createOrder`.

- **Por quê:** se o cliente manda o preço, qualquer um pode abrir o devtools e comprar mais barato. O carrinho no frontend (`useCart.ts`) calcula um total só para exibição/UX - é sempre "otimista", a fonte da verdade é a resposta da API.

## Idempotência via header `Idempotency-Key`

`CheckoutService.checkout` usa uma chave por tentativa de compra (`api/src/repositories/idempotency-store.ts`), guardando um hash dos itens junto. Replay com a mesma chave e o mesmo payload devolve o pedido já criado (`replayed: true`). mesma chave com payload diferente vira erro `422 IDEMPOTENCY_KEY_REUSED`. chave em uso simultâneo vira `409 IDEMPOTENCY_REQUEST_IN_PROGRESS`.

- **Por quê:** duplo clique no botão "Finalizar" ou um retry de rede não podem gerar dois pedidos e baixar o estoque duas vezes. Ao invés de desabilitar o botão só no client (race condition, retry automático de fetch, etc.), a garantia fica no backend, que é a única forma de não intercepitarem a rota.
- No `App.tsx`, a chave é gerada uma vez por "assinatura" de carrinho (`cartSignature`) e reaproveitada enquanto o carrinho não muda, assim um retry manual depois de erro de rede usa a mesma chave.
- **Trade-off:** o store de idempotência também é em memória, então some no reset. Deixei assim apenas por conta do case, em produção teria um TTL e um backend persistente como Redis porque duas instâncias da API precisam enxergar a mesma chave.

## Reserva de estoque sem lock explícito

`InMemoryProductRepository.reserveStock` valida a disponibilidade de todos os itens e só depois decrementa (`api/src/repositories/product-repository.ts`).

- **Trade-off assumido:** como o Node roda single-threaded e os `Map` são síncronos dentro do método, não há race condition *nesse* processo. Isso deixa de valer em múltiplas instâncias, ponto que já é coberto pela troca de storage mencionada acima.

## Testes

A cobertura se divide em duas camadas com papéis distintos:

- **`api/tests` (in-process, via `app.inject`):** o grosso dos testes. Cobre validação de checkout, idempotência, reserva de estoque e as rotas HTTP sem subir a rede.
- **`web/e2e` (Playwright, contra API + web reais):** `api.spec.ts` valida o contrato HTTP pela rede (CORS, headers, `Correlation-Id`) que o `client.ts` consome. `checkout.spec.ts` faz a compra no navegador.
