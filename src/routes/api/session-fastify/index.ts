import { randomBytes } from 'node:crypto'
import { FastifyPluginAsync } from 'fastify'
import fastifySession from '@fastify/session'
import { ensureJsonBody } from '../../../lib/http'

declare module 'fastify' {
  interface Session {
    username?: string
    loginAt?: number
    csrfToken?: string
  }
}

const sessionFastifyApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  await fastify.register(fastifySession, {
    secret: 'dev-fastify-session-secret-32chars!',
    cookieName: 'fastify_session_id',
    cookie: { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 3600_000, secure: false },
    saveUninitialized: false
  })

  fastify.post('/login', async (request, reply) => {
    let username = 'anonymous'

    const parsed = ensureJsonBody(request)
    if (parsed.ok && typeof parsed.body.username === 'string' && parsed.body.username.trim() !== '') {
      username = parsed.body.username.trim()
    } else if (!parsed.ok) {
      const body = (request.body ?? {}) as Record<string, unknown>
      if (typeof body.username === 'string' && body.username.trim() !== '') {
        username = body.username.trim()
      }
    }

    const csrfToken = randomBytes(12).toString('hex')
    request.session.username = username
    request.session.loginAt = Date.now()
    request.session.csrfToken = csrfToken

    return {
      station: 'session-fastify',
      username,
      csrfToken
    }
  })

  fastify.get('/me', async (request, reply) => {
    if (!request.session.username) {
      reply.code(401)
      return { error: 'not authenticated' }
    }

    return {
      station: 'session-fastify',
      authenticated: true,
      user: {
        username: request.session.username,
        loginAt: request.session.loginAt
      },
      csrfToken: request.session.csrfToken
    }
  })

  fastify.post('/protected-action', async (request, reply) => {
    if (!request.session.username) {
      reply.code(401)
      return { error: 'not authenticated' }
    }

    if (request.headers['x-csrf-token'] !== request.session.csrfToken) {
      reply.code(403)
      return { error: 'csrf token invalid' }
    }

    return { ok: true, message: 'state-changing action accepted' }
  })

  fastify.post('/logout', async (request, reply) => {
    request.session.destroy()
    return { loggedOut: true }
  })
}

export default sessionFastifyApi
