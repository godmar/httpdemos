import { randomBytes } from 'node:crypto'
import { FastifyRequest } from 'fastify'
import {
  JsonWebTokenError,
  NotBeforeError,
  TokenExpiredError,
  sign as jwtSign,
  verify as jwtVerify
} from 'jsonwebtoken'

type Json = Record<string, unknown>

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
  return jwtSign(payload, secret, {
    algorithm: 'HS256'
  })
}

export function verifyJwt (token: string, secret: string): { ok: true; payload: JwtPayload } | { ok: false; error: string } {
  try {
    const decoded = jwtVerify(token, secret, {
      algorithms: ['HS256']
    })

    if (typeof decoded === 'string' || decoded === null || typeof decoded !== 'object') {
      return { ok: false, error: 'invalid payload' }
    }

    const payload = decoded as Partial<JwtPayload>
    if (
      typeof payload.sub !== 'string' ||
      !Array.isArray(payload.scope) ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      typeof payload.jti !== 'string' ||
      (payload.typ !== 'access' && payload.typ !== 'refresh')
    ) {
      return { ok: false, error: 'token payload shape invalid' }
    }

    return {
      ok: true,
      payload: {
        sub: payload.sub,
        scope: payload.scope,
        iat: payload.iat,
        exp: payload.exp,
        jti: payload.jti,
        typ: payload.typ
      }
    }
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError) {
      return { ok: false, error: 'token expired' }
    }
    if (error instanceof NotBeforeError) {
      return { ok: false, error: 'token not active' }
    }
    if (error instanceof JsonWebTokenError) {
      return { ok: false, error: String(error.message) }
    }
    return { ok: false, error: 'token verification failed' }
  }
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
