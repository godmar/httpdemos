import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper'

function firstCookie (setCookie: string | string[] | undefined): string {
  if (!setCookie) return ''
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie
  return raw.split(';')[0]
}

test('forms station handles GET query and POST urlencoded body', async (t) => {
  const app = await build(t)

  const getRes = await app.inject({
    method: 'GET',
    url: '/stations/forms/search?q=cache+control'
  })
  assert.equal(getRes.statusCode, 200)
  assert.equal(getRes.json().query.q, 'cache control')

  const postRes = await app.inject({
    method: 'POST',
    url: '/stations/forms/login',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: 'username=alice&password=secret'
  })
  assert.equal(postRes.statusCode, 200)
  assert.match(postRes.payload, /Form POST Received/)
  assert.match(postRes.payload, /alice/)
})

test('fetch-json station enforces json content-type', async (t) => {
  const app = await build(t)

  const okRes = await app.inject({
    method: 'POST',
    url: '/api/fetch-json/echo',
    headers: { 'content-type': 'application/json' },
    payload: { message: 'hello' }
  })
  assert.equal(okRes.statusCode, 200)
  assert.equal(okRes.json().received.message, 'hello')

  const badRes = await app.inject({
    method: 'POST',
    url: '/api/fetch-json/echo',
    headers: { 'content-type': 'text/plain' },
    payload: 'hello'
  })
  assert.equal(badRes.statusCode, 415)
})

test('PUT todo is idempotent and retrievable', async (t) => {
  const app = await build(t)

  const payload = { title: 'Read RFC 9110', done: false }
  const put1 = await app.inject({
    method: 'PUT',
    url: '/api/todos/42',
    headers: { 'content-type': 'application/json' },
    payload
  })
  const put2 = await app.inject({
    method: 'PUT',
    url: '/api/todos/42',
    headers: { 'content-type': 'application/json' },
    payload
  })

  assert.equal(put1.statusCode, 200)
  assert.equal(put2.statusCode, 200)
  assert.equal(put1.json().todo.title, put2.json().todo.title)
  assert.equal(put2.headers['x-idempotent-method'], 'PUT')

  const getRes = await app.inject({ method: 'GET', url: '/api/todos/42' })
  assert.equal(getRes.statusCode, 200)
  assert.equal(getRes.json().todo.id, '42')
})

test('cache station returns expected cache-control policies', async (t) => {
  const app = await build(t)

  const a = await app.inject({ method: 'GET', url: '/api/cache/public' })
  const b = await app.inject({ method: 'GET', url: '/api/cache/private' })
  const c = await app.inject({ method: 'GET', url: '/api/cache/no-store' })

  assert.equal(a.headers['cache-control'], 'public, max-age=60')
  assert.equal(b.headers['cache-control'], 'private, max-age=30')
  assert.equal(c.headers['cache-control'], 'no-store')
})

test('chunked endpoint streams multiple chunks', async (t) => {
  const app = await build(t)
  const res = await app.inject({ method: 'GET', url: '/api/chunked/time?count=2&intervalMs=1' })

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['x-station'], 'chunked')
  assert.match(res.payload, /chunk 1:/)
  assert.match(res.payload, /done/)
})

test('sse endpoint emits text/event-stream payload', async (t) => {
  const app = await build(t)
  const res = await app.inject({ method: 'GET', url: '/api/sse/clock?count=2&intervalMs=1' })

  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['content-type'], 'text/event-stream')
  assert.match(res.payload, /event: tick/)
  assert.match(res.payload, /event: done/)
})

test('session auth requires csrf token for state-changing action', async (t) => {
  const app = await build(t)

  const login = await app.inject({
    method: 'POST',
    url: '/api/session/login',
    headers: { 'content-type': 'application/json' },
    payload: { username: 'student' }
  })
  assert.equal(login.statusCode, 200)
  const cookie = firstCookie(login.headers['set-cookie'])
  const csrf = login.json().csrfToken as string
  assert.ok(cookie.includes('demo_session_id='))
  assert.ok(csrf.length > 10)

  const me = await app.inject({
    method: 'GET',
    url: '/api/session/me',
    headers: { cookie }
  })
  assert.equal(me.statusCode, 200)
  assert.equal(me.json().authenticated, true)

  const blocked = await app.inject({
    method: 'POST',
    url: '/api/session/protected-action',
    headers: { cookie }
  })
  assert.equal(blocked.statusCode, 403)

  const allowed = await app.inject({
    method: 'POST',
    url: '/api/session/protected-action',
    headers: { cookie, 'x-csrf-token': csrf }
  })
  assert.equal(allowed.statusCode, 200)
})

test('jwt auth supports login, bearer access, and rotating refresh token', async (t) => {
  const app = await build(t)

  const login = await app.inject({
    method: 'POST',
    url: '/api/jwt/login',
    headers: { 'content-type': 'application/json' },
    payload: { username: 'api-user' }
  })
  assert.equal(login.statusCode, 200)
  const access = login.json().accessToken as string
  const refreshCookie = firstCookie(login.headers['set-cookie'])
  assert.ok(access.length > 20)
  assert.ok(refreshCookie.includes('demo_refresh_token='))

  const me = await app.inject({
    method: 'GET',
    url: '/api/jwt/me',
    headers: { authorization: `Bearer ${access}` }
  })
  assert.equal(me.statusCode, 200)
  assert.equal(me.json().authenticated, true)

  const rotate = await app.inject({
    method: 'POST',
    url: '/api/jwt/refresh',
    headers: { cookie: refreshCookie }
  })
  assert.equal(rotate.statusCode, 200)
  assert.equal(rotate.json().rotated, true)

  const replayOld = await app.inject({
    method: 'POST',
    url: '/api/jwt/refresh',
    headers: { cookie: refreshCookie }
  })
  assert.equal(replayOld.statusCode, 401)
})

test('conditional endpoint returns 304 with matching ETag', async (t) => {
  const app = await build(t)

  const first = await app.inject({ method: 'GET', url: '/api/conditional/resource' })
  assert.equal(first.statusCode, 200)
  const etag = first.headers.etag as string
  assert.ok(etag)

  const second = await app.inject({
    method: 'GET',
    url: '/api/conditional/resource',
    headers: { 'if-none-match': etag }
  })
  assert.equal(second.statusCode, 304)
})

test('cors preflight and allowed origin behavior', async (t) => {
  const app = await build(t)

  const preflight = await app.inject({
    method: 'OPTIONS',
    url: '/api/cors/echo',
    headers: {
      origin: 'https://example.edu',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type'
    }
  })

  assert.equal(preflight.statusCode, 204)
  assert.equal(preflight.headers['access-control-allow-origin'], 'https://example.edu')

  const postAllowed = await app.inject({
    method: 'POST',
    url: '/api/cors/echo',
    headers: {
      origin: 'https://example.edu',
      'content-type': 'application/json'
    },
    payload: { hello: 'cors' }
  })

  assert.equal(postAllowed.statusCode, 200)
  assert.equal(postAllowed.headers['access-control-allow-origin'], 'https://example.edu')

  const blocked = await app.inject({
    method: 'POST',
    url: '/api/cors/echo',
    headers: {
      origin: 'https://evil.example',
      'content-type': 'application/json'
    },
    payload: { hello: 'nope' }
  })

  assert.equal(blocked.statusCode, 403)
})
