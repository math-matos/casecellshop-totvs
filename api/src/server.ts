import { buildApp } from './app.js'

const app = buildApp()
const port = Number(process.env.PORT ?? 3000)

try {
  await app.listen({ port })
  console.log(`API rodando em http://localhost:${port}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
