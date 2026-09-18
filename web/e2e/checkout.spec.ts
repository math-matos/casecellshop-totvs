import { expect, test } from '@playwright/test'

/**
 * E2E: jornada real no navegador contra API + web de verdade.
 * Usa capinha-preta (estoque alto) para não competir com os testes de integração.
 */

test('compra do início ao fim confirma o pedido', async ({ page }) => {
  await page.goto('/')

  const card = page.getByRole('article').filter({ hasText: 'Capinha Preta' })
  await card.getByRole('button', { name: 'Adicionar' }).click()

  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page).toHaveURL(/\/checkout$/)

  await page.getByRole('button', { name: 'Finalizar compra' }).click()

  await expect(page).toHaveURL(/\/payment-confirmed$/)
  const confirmation = page.getByRole('region', { name: 'Pedido confirmado' })
  await expect(confirmation.getByRole('heading', { name: 'Pedido confirmado' })).toBeVisible()
  await expect(confirmation.getByRole('definition')).toHaveText(/^[0-9a-f-]{36}$/)

  await expect(confirmation).toContainText('Capinha Preta')
  await expect(confirmation).toContainText('49,90') // total calculado pela API (1x R$ 49,90)
})

test('filtrar por categoria mostra só os produtos daquela categoria', async ({ page }) => {
  await page.goto('/')
  // Espera o catálogo carregar (client.ts tem delay artificial em dev).
  await expect(page.getByRole('article').filter({ hasText: 'Capinha Preta' })).toBeVisible()

  await page.getByRole('tab', { name: 'Películas' }).click()

  await expect(page.getByRole('article').filter({ hasText: 'Película de Vidro 3D' })).toBeVisible()
  await expect(page.getByRole('article').filter({ hasText: 'Capinha Preta' })).toHaveCount(0)
})

test('acessar /checkout com carrinho vazio mostra o estado vazio', async ({ page }) => {
  await page.goto('/checkout')

  await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ver produtos' })).toBeVisible()
})
