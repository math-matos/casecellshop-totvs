import type { FastifyPluginAsync } from 'fastify'
import type { ProductRepository } from '../../repositories/product-repository.js'

export function productRoutes(productRepository: ProductRepository): FastifyPluginAsync {
  return async (app) => {
    app.get('/products', async () => {
      const products = await productRepository.findAll()
      return { products }
    })
  }
}
