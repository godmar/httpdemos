import { FastifyPluginAsync } from 'fastify'

const jwtFastifyStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/jwt-fastify.html')
  })
}

export default jwtFastifyStation
