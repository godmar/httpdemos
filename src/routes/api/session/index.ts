import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { ensureJsonBody } from '../../../lib/http'
import { store } from '../../../lib/stores'

const SESSION_COOKIE = 'demo_session_id'

type SessionRequest = FastifyRequest & {
  cookies: Record<string, string | undefined>
}

function getSession (request: FastifyRequest) {
  const typed = request as SessionRequest
  const sessionId = typed.cookies?.[SESSION_COOKIE]
  if (!sessionId) return undefined
  return store.getSession(sessionId)
}

const sessionApi: FastifyPluginAsync = async (fastify): Promise<void> => {
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

    const session = store.createSession(username)
    reply.setCookie(SESSION_COOKIE, session.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600
    })

    return {
      station: 'session-auth',
      username: session.user.username,
      csrfToken: session.csrfToken
    }
  })

  fastify.get('/me', async (request, reply) => {
    const session = getSession(request)
    if (!session) {
      reply.code(401)
      return { error: 'not authenticated' }
    }

    return {
      station: 'session-auth',
      authenticated: true,
      user: session.user,
      csrfToken: session.csrfToken
    }
  })

  fastify.post('/protected-action', async (request, reply) => {
    const session = getSession(request)
    if (!session) {
      reply.code(401)
      return { error: 'not authenticated' }
    }

    if (request.headers['x-csrf-token'] !== session.csrfToken) {
      reply.code(403)
      return { error: 'csrf token invalid' }
    }

    return { ok: true, message: 'state-changing action accepted' }
  })

  fastify.post('/logout', async (request, reply) => {
    const typed = request as SessionRequest
    const sessionId = typed.cookies?.[SESSION_COOKIE]
    if (sessionId) {
      store.deleteSession(sessionId)
    }

    reply.clearCookie(SESSION_COOKIE, {
      path: '/'
    })

    return { loggedOut: true }
  })
}

export default sessionApi
