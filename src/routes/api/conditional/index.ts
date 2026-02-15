import { createHash } from 'node:crypto'
import { FastifyPluginAsync } from 'fastify'

const conditionalApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/resource', async (request, reply) => {
    const payload = {
      name: 'http-stations-resource',
      value: 'stable demo payload',
      version: 1
    }

    const raw = JSON.stringify(payload)
    const etag = `"${createHash('sha1').update(raw).digest('hex')}"`

    reply.header('ETag', etag)
    reply.header('Cache-Control', 'private, max-age=0, must-revalidate')

    if (request.headers['if-none-match'] === etag) {
      reply.code(304)
      return
    }

    return payload
  })
}

export default conditionalApi
