import { FastifyPluginAsync } from 'fastify'

const sessionAuthStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/session-auth.html')
  })
}

export default sessionAuthStation
