import { FastifyPluginAsync } from 'fastify'

const cacheStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/cache.html')
  })
}

export default cacheStation
