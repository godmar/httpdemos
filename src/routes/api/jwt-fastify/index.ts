import { FastifyPluginAsync } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import { store } from '../../../lib/stores'

const ACCESS_SECRET = process.env.DEMO_JWT_ACCESS_SECRET ?? 'dev-access-secret'
const REFRESH_SECRET = process.env.DEMO_JWT_REFRESH_SECRET ?? 'dev-refresh-secret'
const REFRESH_COOKIE = 'demo_refresh_token'

// With namespace registrations, @fastify/jwt stores sub-instances on fastify.jwt[namespace].
// Extend the JWT interface so TypeScript knows about fastify.jwt.access and fastify.jwt.refresh.
declare module '@fastify/jwt' {
  interface JWT {
    access: JWT
    refresh: JWT
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    // Added by the 'access' namespace registration below; reads the Bearer header.
    accessVerify<T extends object = object>(): Promise<T>
  }
}

type AccessPayload = { sub: string; scope: string[]; iat: number; exp: number }
type RefreshPayload = { sub: string; jti: string; scope: string[]; iat: number; exp: number }

const jwtFastifyApi: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Primary instance: signs/verifies access tokens.
  // Stored at fastify.jwt.access; request.accessVerify() reads Authorization: Bearer automatically.
  await fastify.register(fastifyJwt, {
    secret: ACCESS_SECRET,
    namespace: 'access',        // fastify.jwt.access = JWT instance
    jwtVerify: 'accessVerify',  // renames request.jwtVerify → request.accessVerify
    sign: { expiresIn: '2m' }   // default expiry for tokens signed via fastify.jwt.access
  })

  // Secondary instance: signs/verifies refresh tokens with a different secret.
  // Stored at fastify.jwt.refresh; we verify refresh tokens explicitly from the cookie.
  await fastify.register(fastifyJwt, {
    secret: REFRESH_SECRET,
    namespace: 'refresh',       // fastify.jwt.refresh = JWT instance
    sign: { expiresIn: '1h' }   // default expiry for tokens signed via fastify.jwt.refresh
  })

  fastify.post('/login', async (request, reply) => {
    const body = (request.body ?? {}) as Record<string, unknown>
    const username = typeof body.username === 'string' && body.username.trim() !== ''
      ? body.username.trim()
      : 'api-user'

    const refreshRecord = store.issueRefreshToken(username, 3600)

    // fastify.jwt.access.sign / fastify.jwt.refresh.sign are synchronous (fast-jwt under the hood).
    // Access tokens have no jti — they're short-lived and not individually revocable.
    const accessToken = fastify.jwt.access.sign({ sub: username, scope: ['read:profile'] })
    // Refresh tokens carry a jti (JWT ID, RFC 7519) that links the signed token the client
    // holds to a server-side record in the store, giving the server a handle to revoke it.
    const refreshToken = fastify.jwt.refresh.sign({ sub: username, jti: refreshRecord.tokenId, scope: ['refresh:token'] })

    reply.setCookie(REFRESH_COOKIE, refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600
    })

    return {
      station: 'jwt-fastify',
      accessToken,
      accessExpiresInSec: 120,
      refreshExpiresInSec: 3600
    }
  })

  fastify.get('/me', async (request, reply) => {
    let decoded: AccessPayload
    try {
      // Reads Authorization: Bearer <token>, verifies against ACCESS_SECRET, returns payload
      decoded = await request.accessVerify<AccessPayload>()
    } catch (_e) {
      reply.code(401)
      return { error: 'missing or invalid bearer token' }
    }

    return { authenticated: true, claims: decoded }
  })

  // Clients call /refresh when the short-lived access token expires (or is about to).
  // Either reactively (got a 401, refresh, retry) or proactively (check exp claim, refresh
  // before it expires). The refresh token's lifetime (1 h) is the real session duration.
  fastify.post('/refresh', async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE]
    if (!token) {
      reply.code(401)
      return { error: 'missing refresh cookie' }
    }

    let decoded: RefreshPayload
    try {
      decoded = fastify.jwt.refresh.verify<RefreshPayload>(token)
    } catch (_e) {
      reply.code(401)
      return { error: 'invalid refresh token' }
    }

    const oldRecord = store.getRefreshToken(decoded.jti)
    if (!oldRecord || oldRecord.revoked || oldRecord.expiresAt <= Math.floor(Date.now() / 1000)) {
      reply.code(401)
      return { error: 'refresh token invalid or revoked' }
    }

    // Revoke old token before issuing new one (rotation — replay of old cookie → 401)
    store.revokeRefreshToken(oldRecord.tokenId)
    const nextRecord = store.issueRefreshToken(oldRecord.userId, 3600, oldRecord.tokenId)

    const accessToken = fastify.jwt.access.sign({ sub: oldRecord.userId, scope: ['read:profile'] })
    const nextRefreshToken = fastify.jwt.refresh.sign({ sub: oldRecord.userId, jti: nextRecord.tokenId, scope: ['refresh:token'] })

    reply.setCookie(REFRESH_COOKIE, nextRefreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600
    })

    return { rotated: true, accessToken, accessExpiresInSec: 120 }
  })

  fastify.post('/logout', async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE]
    if (token) {
      try {
        const decoded = fastify.jwt.refresh.verify<RefreshPayload>(token)
        store.revokeRefreshToken(decoded.jti)
      } catch (_e) {
        // ignore invalid tokens on logout
      }
    }

    reply.clearCookie(REFRESH_COOKIE, { path: '/' })
    return { loggedOut: true }
  })
}

export default jwtFastifyApi
