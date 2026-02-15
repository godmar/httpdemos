import { FastifyPluginAsync } from 'fastify'

const cacheApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/public', async (_request, reply) => {
    reply.header('Cache-Control', 'public, max-age=60')
    reply.header('Expires', new Date(Date.now() + 60_000).toUTCString())
    return { station: 'cache', policy: 'public', at: new Date().toISOString() }
  })

  fastify.get('/private', async (_request, reply) => {
    reply.header('Cache-Control', 'private, max-age=30')
    return { station: 'cache', policy: 'private', at: new Date().toISOString() }
  })

  fastify.get('/no-store', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store')
    return { station: 'cache', policy: 'no-store', at: new Date().toISOString() }
  })
}

export default cacheApi
