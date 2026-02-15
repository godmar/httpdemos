import { FastifyPluginAsync } from 'fastify'

const restPutStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/rest-put.html')
  })
}

export default restPutStation
