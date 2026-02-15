import { FastifyPluginAsync } from 'fastify'

const formsStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/forms.html')
  })

  fastify.get('/search', async (request) => {
    return {
      station: 'forms-get',
      method: request.method,
      url: request.url,
      query: request.query
    }
  })

  fastify.post('/login', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>
    const fields: Record<string, string> = {}

    for (const [key, value] of Object.entries(body)) {
      fields[key] = String(value)
    }

    reply.type('application/json; charset=utf-8')
    return {
      station: 'forms-post',
      method: request.method,
      contentType: request.headers['content-type'],
      fields
    }
  })
}

export default formsStation
