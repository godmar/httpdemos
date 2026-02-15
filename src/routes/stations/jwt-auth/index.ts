import { FastifyPluginAsync } from 'fastify'

const jwtAuthStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/jwt-auth.html')
  })
}

export default jwtAuthStation
