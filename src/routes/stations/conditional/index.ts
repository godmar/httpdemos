import { FastifyPluginAsync } from 'fastify'

const conditionalStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/conditional.html')
  })
}

export default conditionalStation
