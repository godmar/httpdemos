import { FastifyPluginAsync } from 'fastify'

function parsePositiveInt (value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const sseApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/clock', async (request, reply) => {
    const query = request.query as { count?: string; intervalMs?: string }
    const count = parsePositiveInt(query.count, 5)
    const intervalMs = parsePositiveInt(query.intervalMs, 1000)

    reply.hijack()
    reply.raw.statusCode = 200
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')

    let sent = 0
    const timer = setInterval(() => {
      sent += 1
      reply.raw.write('event: tick\n')
      reply.raw.write(`data: ${JSON.stringify({ index: sent, at: new Date().toISOString() })}\n\n`)
      if (sent >= count) {
        clearInterval(timer)
        reply.raw.write('event: done\ndata: complete\n\n')
        reply.raw.end()
      }
    }, intervalMs)

    reply.raw.on('close', () => clearInterval(timer))
  })
}

export default sseApi
