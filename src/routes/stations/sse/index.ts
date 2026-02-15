import { FastifyPluginAsync } from 'fastify'

const sseStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/sse.html')
  })
}

export default sseStation
