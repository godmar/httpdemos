import { FastifyPluginAsync } from 'fastify'
import { ensureJsonBody } from '../../../lib/http'

const ALLOWED_ORIGIN = 'https://example.edu'

const corsApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.options('/echo', async (request, reply) => {
    const origin = request.headers.origin
    if (origin !== ALLOWED_ORIGIN) {
      reply.code(403)
      return { error: 'origin not allowed' }
    }

    reply.header('Access-Control-Allow-Origin', origin)
    reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    reply.header('Access-Control-Allow-Headers', 'content-type, authorization')
    reply.header('Access-Control-Max-Age', '600')
    reply.code(204)
    return ''
  })

  fastify.post('/echo', async (request, reply) => {
    const origin = request.headers.origin
    if (origin !== ALLOWED_ORIGIN) {
      reply.code(403)
      return { error: 'origin not allowed' }
    }

    reply.header('Access-Control-Allow-Origin', origin)
    reply.header('Vary', 'Origin')

    const parsed = ensureJsonBody(request)
    if (!parsed.ok) {
      reply.code(415)
      return { error: parsed.error }
    }

    return {
      station: 'cors',
      acceptedOrigin: origin,
      body: parsed.body
    }
  })
}

export default corsApi
