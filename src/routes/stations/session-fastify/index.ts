import { FastifyPluginAsync } from 'fastify'

const sessionFastifyStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/session-fastify.html')
  })
}

export default sessionFastifyStation
