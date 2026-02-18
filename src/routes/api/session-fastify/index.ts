import { FastifyPluginAsync } from 'fastify'
import fastifySession from '@fastify/session'
import fastifyCsrf from '@fastify/csrf-protection'

declare module 'fastify' {
  interface Session {
    username?: string
    loginAt?: number
  }
}

const sessionFastifyApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  await fastify.register(fastifySession, {
    secret: 'dev-fastify-session-secret-32chars!', // min 32 chars; used to sign the cookie value
    cookieName: 'fastify_session_id',               // distinct from the hand-rolled demo_session_id
    cookie: {
      path: '/',
      httpOnly: true,                // not accessible via document.cookie
      sameSite: 'lax',               // sent on same-site and top-level cross-site navigations
      maxAge: 3600_000,              // milliseconds (unlike @fastify/cookie which uses seconds)
      secure: false                  // allow HTTP in dev; set true behind HTTPS in production
    },
    saveUninitialized: false         // don't persist a session until something is written to it
  })

  await fastify.register(fastifyCsrf, {
    sessionPlugin: '@fastify/session' // store the CSRF secret in request.session._csrf rather than a separate cookie
  })

  fastify.post('/login', async (request, reply) => {
    let username = 'anonymous'

    const body = (request.body ?? {}) as Record<string, unknown>
    if (typeof body.username === 'string' && body.username.trim() !== '') {
      username = body.username.trim()
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
