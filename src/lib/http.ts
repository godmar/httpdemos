import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { FastifyReply, FastifyRequest } from 'fastify'

type Json = Record<string, unknown>

export function htmlPage (title: string, body: string): string {
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
    ${body}
  </main>
</body>
</html>`
}

export function escapeHtml (value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function parseCookieHeader (cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {}
  const out: Record<string, string> = {}
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (!rawKey || rest.length === 0) continue
    const value = rest.join('=')
    out[decodeURIComponent(rawKey)] = decodeURIComponent(value)
  }
  return out
}

export function setCookie (
  reply: FastifyReply,
  name: string,
  value: string,
  opts: {
    httpOnly?: boolean
    path?: string
    sameSite?: 'Lax' | 'Strict' | 'None'
    maxAgeSec?: number
  } = {}
): void {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`]
  parts.push(`Path=${opts.path ?? '/'}`)
  if (opts.httpOnly !== false) parts.push('HttpOnly')
  parts.push(`SameSite=${opts.sameSite ?? 'Lax'}`)
  if (opts.maxAgeSec !== undefined) parts.push(`Max-Age=${opts.maxAgeSec}`)
  reply.header('Set-Cookie', parts.join('; '))
}

export function clearCookie (reply: FastifyReply, name: string): void {
  reply.header('Set-Cookie', `${encodeURIComponent(name)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

export async function parseFormBody (request: FastifyRequest): Promise<Record<string, string>> {
  const anyReq = request as FastifyRequest & { body?: unknown }
  if (typeof anyReq.body === 'string') {
    return parseFormEncoded(anyReq.body)
  }
  if (typeof anyReq.body === 'object' && anyReq.body !== null) {
    const result: Record<string, string> = {}
    for (const [k, v] of Object.entries(anyReq.body as Record<string, unknown>)) {
      result[k] = String(v)
    }
    return result
  }

  const raw = await readRawBody(request)
  return parseFormEncoded(raw)
}

async function readRawBody (request: FastifyRequest): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    request.raw.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.raw.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.raw.on('error', reject)
  })
}

function parseFormEncoded (body: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const pair of body.split('&')) {
    if (!pair) continue
    const [k, v = ''] = pair.split('=')
    out[decodeURIComponent(k.replace(/\+/g, ' '))] = decodeURIComponent(v.replace(/\+/g, ' '))
  }
  return out
}

function b64url (input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function b64urlDecode (input: string): Buffer {
  const normalized = input
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(input.length / 4) * 4, '=')
  return Buffer.from(normalized, 'base64')
}

export type JwtPayload = {
  sub: string
  scope: string[]
  iat: number
  exp: number
  jti: string
  typ: 'access' | 'refresh'
}

export function randomTokenId (): string {
  return randomBytes(16).toString('hex')
}

export function signJwt (payload: JwtPayload, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = b64url(JSON.stringify(header))
  const encodedPayload = b64url(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac('sha256', secret).update(signingInput).digest()
  return `${signingInput}.${b64url(signature)}`
}

export function verifyJwt (token: string, secret: string): { ok: true; payload: JwtPayload } | { ok: false; error: string } {
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, error: 'invalid token format' }
  const [head, body, sig] = parts
  const signingInput = `${head}.${body}`
  const expectedSig = createHmac('sha256', secret).update(signingInput).digest()

  let providedSig: Buffer
  try {
    providedSig = b64urlDecode(sig)
  } catch {
    return { ok: false, error: 'invalid signature encoding' }
  }

  if (providedSig.length !== expectedSig.length || !timingSafeEqual(providedSig, expectedSig)) {
    return { ok: false, error: 'signature mismatch' }
  }

  let payload: JwtPayload
  try {
    payload = JSON.parse(b64urlDecode(body).toString('utf8')) as JwtPayload
  } catch {
    return { ok: false, error: 'invalid payload encoding' }
  }

  if (typeof payload.exp !== 'number' || Date.now() >= payload.exp * 1000) {
    return { ok: false, error: 'token expired' }
  }

  return { ok: true, payload }
}

export function ensureJsonBody (request: FastifyRequest): { ok: true; body: Json } | { ok: false; error: string } {
  const contentType = (request.headers['content-type'] ?? '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return { ok: false, error: 'content-type must be application/json' }
  }

  const body = (request as FastifyRequest & { body?: unknown }).body
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'body must be a JSON object' }
  }

  return { ok: true, body: body as Json }
}
