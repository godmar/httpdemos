import { FastifyPluginAsync } from 'fastify'
import QRCode from 'qrcode'

const metaApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/qr.svg', async (request, reply) => {
    const query = request.query as { text?: string }
    const text = typeof query.text === 'string' && query.text.trim() !== ''
      ? query.text.trim()
      : `${request.protocol}://${request.hostname}`

    const svg = await QRCode.toString(text, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240
    })

    reply.type('image/svg+xml; charset=utf-8')
    reply.header('Cache-Control', 'no-store')
    return svg
  })
}

export default metaApi
