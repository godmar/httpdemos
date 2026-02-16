import { FastifyPluginAsync } from 'fastify'

function parsePositiveInt (value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const chunkedApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/time', async (request, reply) => {
    const query = request.query as { count?: string; intervalMs?: string }
    const count = parsePositiveInt(query.count, 4)
    const intervalMs = parsePositiveInt(query.intervalMs, 1000)

    reply.hijack()
    reply.raw.statusCode = 200
    reply.raw.setHeader('Content-Type', 'text/plain; charset=utf-8')
    reply.raw.setHeader('Cache-Control', 'no-store')
    reply.raw.setHeader('X-Station', 'chunked')

    let sent = 0
    const timer = setInterval(() => {
      sent += 1
      reply.raw.write(`chunk ${sent}: ${new Date().toISOString()}\n`)
      if (sent >= count) {
        clearInterval(timer)
        reply.raw.end('done\n')
      }
    }, intervalMs)

    reply.raw.on('close', () => clearInterval(timer))
  })
}

export default chunkedApi
