import { FastifyPluginAsync } from 'fastify'
import { ensureJsonBody } from '../../../lib/http'

const fetchJsonApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post('/echo', async (request, reply) => {
    const parsed = ensureJsonBody(request)
    if (!parsed.ok) {
      reply.code(415)
      return { error: parsed.error }
    }

    return {
      station: 'fetch-json',
      received: parsed.body,
      serverTime: new Date().toISOString()
    }
  })
}

export default fetchJsonApi
