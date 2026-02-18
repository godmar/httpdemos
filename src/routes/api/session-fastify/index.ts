import { FastifyPluginAsync } from 'fastify'
import fastifySession from '@fastify/session'
import fastifyCsrf from '@fastify/csrf-protection'
import { ensureJsonBody } from '../../../lib/http'

declare module 'fastify' {
  interface Session {
    username?: string
    loginAt?: number
  }
}

const sessionFastifyApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  await fastify.register(fastifySession, {
    secret: 'dev-fastify-session-secret-32chars!',
    cookieName: 'fastify_session_id',
    cookie: { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 3600_000, secure: false },
    saveUninitialized: false
  })

  await fastify.register(fastifyCsrf, {
    sessionPlugin: '@fastify/session'
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

    request.session.username = username
    request.session.loginAt = Date.now()
    const csrfToken = await reply.generateCsrf()

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

    const csrfToken = await reply.generateCsrf()

    return {
      station: 'session-fastify',
      authenticated: true,
      user: {
        username: request.session.username,
        loginAt: request.session.loginAt
      },
      csrfToken
    }
  })

  fastify.post('/protected-action', {
    preValidation: fastify.csrfProtection
  }, async (request, reply) => {
    if (!request.session.username) {
      reply.code(401)
      return { error: 'not authenticated' }
    }

    return { ok: true, message: 'state-changing action accepted' }
  })

  fastify.post('/logout', async (_request, reply) => {
    _request.session.destroy()
    return { loggedOut: true }
  })
}

export default sessionFastifyApi
