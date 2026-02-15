import { FastifyPluginAsync } from 'fastify'

const corsStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/cors.html')
  })
}

export default corsStation
