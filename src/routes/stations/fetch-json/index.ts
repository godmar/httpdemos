import { FastifyPluginAsync } from 'fastify'

const fetchJsonStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/fetch-json.html')
  })
}

export default fetchJsonStation
