import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { ensureJsonBody, randomTokenId, signJwt, verifyJwt } from '../../../lib/http'
import { store } from '../../../lib/stores'

const ACCESS_SECRET = process.env.DEMO_JWT_ACCESS_SECRET ?? 'dev-access-secret'
const REFRESH_SECRET = process.env.DEMO_JWT_REFRESH_SECRET ?? 'dev-refresh-secret'
const REFRESH_COOKIE = 'demo_refresh_token'

type JwtRequest = FastifyRequest & {
  cookies: Record<string, string | undefined>
}

const jwtApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post('/login', async (request, reply) => {
    const parsed = ensureJsonBody(request)
    if (!parsed.ok) {
      reply.code(415)
      return { error: parsed.error }
    }

    const username = typeof parsed.body.username === 'string' && parsed.body.username.trim() !== ''
      ? parsed.body.username.trim()
      : 'api-user'

    const now = Math.floor(Date.now() / 1000)
    const refreshRecord = store.issueRefreshToken(username, 3600)

    const accessToken = signJwt({
      sub: username,
      scope: ['read:profile'],
      iat: now,
      exp: now + 120,
      jti: randomTokenId(),
      typ: 'access'
    }, ACCESS_SECRET)

    const refreshToken = signJwt({
      sub: username,
      scope: ['refresh:token'],
      iat: now,
      exp: refreshRecord.expiresAt,
      jti: refreshRecord.tokenId,
      typ: 'refresh'
    }, REFRESH_SECRET)

    reply.setCookie(REFRESH_COOKIE, refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600
    })

    return {
      station: 'jwt-auth',
      accessToken,
      accessExpiresInSec: 120,
      refreshExpiresInSec: 3600
    }
  })

  fastify.get('/me', async (request, reply) => {
    const auth = request.headers.authorization
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      reply.code(401)
      return { error: 'missing bearer token' }
    }

    const token = auth.slice('Bearer '.length)
    const verified = verifyJwt(token, ACCESS_SECRET)
    if (!verified.ok || verified.payload.typ !== 'access') {
      reply.code(401)
      return { error: verified.ok ? 'wrong token type' : verified.error }
    }

    return {
      authenticated: true,
      claims: verified.payload
    }
  })

  fastify.post('/refresh', async (request, reply) => {
    const typed = request as JwtRequest
    const refreshToken = typed.cookies?.[REFRESH_COOKIE]
    if (!refreshToken) {
      reply.code(401)
      return { error: 'missing refresh cookie' }
    }

    const verified = verifyJwt(refreshToken, REFRESH_SECRET)
    if (!verified.ok || verified.payload.typ !== 'refresh') {
      reply.code(401)
      return { error: verified.ok ? 'wrong token type' : verified.error }
    }

    const oldRecord = store.getRefreshToken(verified.payload.jti)
    if (!oldRecord || oldRecord.revoked || oldRecord.expiresAt <= Math.floor(Date.now() / 1000)) {
      reply.code(401)
      return { error: 'refresh token invalid or revoked' }
    }

    store.revokeRefreshToken(oldRecord.tokenId)

    const now = Math.floor(Date.now() / 1000)
    const nextRecord = store.issueRefreshToken(oldRecord.userId, 3600, oldRecord.tokenId)

    const accessToken = signJwt({
      sub: oldRecord.userId,
      scope: ['read:profile'],
      iat: now,
      exp: now + 120,
      jti: randomTokenId(),
      typ: 'access'
    }, ACCESS_SECRET)

    const nextRefreshToken = signJwt({
      sub: oldRecord.userId,
      scope: ['refresh:token'],
      iat: now,
      exp: nextRecord.expiresAt,
      jti: nextRecord.tokenId,
      typ: 'refresh'
    }, REFRESH_SECRET)

    reply.setCookie(REFRESH_COOKIE, nextRefreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600
    })

    return {
      rotated: true,
      accessToken,
      accessExpiresInSec: 120
    }
  })

  fastify.post('/logout', async (request, reply) => {
    const typed = request as JwtRequest
    const refreshToken = typed.cookies?.[REFRESH_COOKIE]
    if (refreshToken) {
      const verified = verifyJwt(refreshToken, REFRESH_SECRET)
      if (verified.ok) {
        store.revokeRefreshToken(verified.payload.jti)
      }
    }

    reply.clearCookie(REFRESH_COOKIE, {
      path: '/'
    })

    return { loggedOut: true }
  })
}

export default jwtApi
