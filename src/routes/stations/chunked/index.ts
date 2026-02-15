import { FastifyPluginAsync } from 'fastify'

const chunkedStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/chunked.html')
  })
}

export default chunkedStation
