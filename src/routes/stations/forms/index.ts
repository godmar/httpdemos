import { FastifyPluginAsync } from 'fastify'

function escapeHtml (value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderResultPage (title: string, payload: unknown): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/public/styles.css" />
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
    <p><a href="/stations/forms">Back to forms</a></p>
  </main>
</body>
</html>`
}

const formsStation: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async (_request, reply) => {
    return reply.sendFile('stations/forms.html')
  })

  fastify.get('/search', async (request, reply) => {
    reply.type('text/html; charset=utf-8')
    return renderResultPage('GET Form Result', {
      station: 'forms-get',
      method: request.method,
      url: request.url,
      query: request.query
    })
  })

  fastify.post('/login', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>
    const fields: Record<string, string> = {}

    for (const [key, value] of Object.entries(body)) {
      fields[key] = String(value)
    }

    reply.type('text/html; charset=utf-8')
    return renderResultPage('POST Form Result', {
      station: 'forms-post',
      method: request.method,
      contentType: request.headers['content-type'],
      fields
    })
  })
}

export default formsStation
