import { defineConfig, devices } from '@playwright/test'

/**
 * E2E e testes de integração HTTP.
 *
 * O `webServer` sobe API (Fastify, :3000) e web (Vite, :5173) juntos, então os
 * testes exercitam o mesmo stack que o usuário: rede real, CORS e headers de
 * verdade — o que o `app.inject` dos testes da API (que roda em processo) não cobre.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // API é in-memory e reseta só ao subir; testes não podem disputar estoque.
  workers: 1,
  timeout: 30_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm exec tsx src/server.ts',
      cwd: '../api',
      url: 'http://localhost:3000/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'pnpm dev',
      url: 'http://localhost:5173/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
