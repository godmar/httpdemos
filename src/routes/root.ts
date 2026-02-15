import { createHash } from 'node:crypto'
import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import {
  clearCookie,
  ensureJsonBody,
  escapeHtml,
  htmlPage,
  parseCookieHeader,
  parseFormBody,
  randomTokenId,
  setCookie,
  signJwt,
  verifyJwt
} from '../lib/http'
import { store } from '../lib/stores'

const ACCESS_SECRET = process.env.DEMO_JWT_ACCESS_SECRET ?? 'dev-access-secret'
const REFRESH_SECRET = process.env.DEMO_JWT_REFRESH_SECRET ?? 'dev-refresh-secret'
const SESSION_COOKIE = 'demo_session_id'
const REFRESH_COOKIE = 'demo_refresh_token'

function sessionFromRequest (request: FastifyRequest) {
  const cookies = parseCookieHeader(request.headers.cookie)
  const sessionId = cookies[SESSION_COOKIE]
  if (!sessionId) return undefined
  return store.getSession(sessionId)
}

function parsePositiveInt (value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  if (!fastify.hasContentTypeParser(/^application\/x-www-form-urlencoded/)) {
    fastify.addContentTypeParser(
      /^application\/x-www-form-urlencoded/,
      { parseAs: 'string' },
      (_request, body, done) => done(null, body)
    )
  }

  fastify.get('/public/styles.css', async (_request, reply) => {
    reply.type('text/css; charset=utf-8')
    return `
:root {
  --bg: #f7f6f2;
  --panel: #ffffff;
  --ink: #13233a;
  --muted: #4d5f76;
  --line: #ced8e3;
  --accent: #1f6feb;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  background: linear-gradient(180deg, #eef4fb 0%, var(--bg) 55%, #f8f2e8 100%);
  color: var(--ink);
}
main {
  max-width: 980px;
  margin: 2rem auto;
  padding: 0 1rem;
}
section, article, form, pre {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
}
section, article { padding: 1rem 1.2rem; margin-bottom: 1rem; }
pre { padding: 0.8rem; overflow-x: auto; }
a { color: var(--accent); }
label { display: block; margin: 0.5rem 0; }
input, button, textarea {
  font: inherit;
  border: 1px solid #8ca1bb;
  border-radius: 6px;
  padding: 0.45rem 0.55rem;
}
button { background: #e7eef8; cursor: pointer; }
code { background: #eef2f6; padding: 0.1rem 0.3rem; border-radius: 4px; }
.small { color: var(--muted); font-size: 0.92rem; }
.grid { display: grid; gap: 0.7rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
`
  })

  fastify.get('/', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'HTTP Protocol Stations',
      `
      <h1>HTTP Protocol Stations</h1>
      <p>Minimal demos focused on request methods, headers, auth, and streaming behavior.</p>
      <section>
        <h2>Stations</h2>
        <div class="grid">
          <article><a href="/stations/forms">1) HTML GET/POST forms</a></article>
          <article><a href="/stations/fetch-json">2) fetch JSON POST</a></article>
          <article><a href="/stations/rest-put">3) PUT mini REST API</a></article>
          <article><a href="/stations/cache">4) Cache-Control headers</a></article>
          <article><a href="/stations/chunked">5) Chunked transfer</a></article>
          <article><a href="/stations/sse">6) Server-Sent Events</a></article>
          <article><a href="/stations/session-auth">7) Session auth + CSRF</a></article>
          <article><a href="/stations/jwt-auth">8) JWT + rotating refresh</a></article>
          <article><a href="/stations/conditional">9) Conditional requests (ETag)</a></article>
          <article><a href="/stations/cors">10) CORS preflight</a></article>
        </div>
      </section>
      <section>
        <h2>Try with curl</h2>
        <pre>curl -i http://localhost:3000/api/cache/public</pre>
        <pre>curl -i -X PUT http://localhost:3000/api/todos/42 -H 'content-type: application/json' -d '{"title":"Learn PUT","done":false}'</pre>
      </section>
      `
    )
  })

  fastify.get('/stations/forms', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'Forms Station',
      `
      <h1>HTML GET/POST Forms</h1>
      <p class="small">Demonstrates browser form encoding and query string behavior.</p>
      <section>
        <h2>GET form (query string)</h2>
        <form method="get" action="/stations/forms/search">
          <label>Search term: <input name="q" value="http headers" /></label>
          <button type="submit">Submit GET</button>
        </form>
      </section>
      <section>
        <h2>POST form (urlencoded)</h2>
        <form method="post" action="/stations/forms/login">
          <label>Username: <input name="username" value="alice" /></label>
          <label>Password: <input type="password" name="password" value="secret" /></label>
          <button type="submit">Submit POST</button>
        </form>
      </section>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.get('/stations/forms/search', async (request) => {
    return {
      station: 'forms-get',
      method: request.method,
      url: request.url,
      query: request.query
    }
  })

  fastify.post('/stations/forms/login', async (request, reply) => {
    const fields = await parseFormBody(request)
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'Form POST Result',
      `
      <h1>Form POST Received</h1>
      <pre>${escapeHtml(JSON.stringify({
        method: request.method,
        contentType: request.headers['content-type'],
        fields
      }, null, 2))}</pre>
      <p><a href="/stations/forms">Back to forms</a></p>
      `
    )
  })

  fastify.get('/stations/fetch-json', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'Fetch JSON Station',
      `
      <h1>fetch + JSON POST</h1>
      <p class="small">Open devtools network tab, then click send.</p>
      <section>
        <label>Message: <input id="msg" value="hello over json" /></label>
        <button id="send">Send JSON</button>
        <pre id="out">(waiting)</pre>
      </section>
      <script>
        document.getElementById('send').addEventListener('click', async () => {
          const message = document.getElementById('msg').value;
          const res = await fetch('/api/fetch-json/echo', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ message })
          });
          document.getElementById('out').textContent = JSON.stringify(await res.json(), null, 2);
        });
      </script>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.post('/api/fetch-json/echo', async (request, reply) => {
    const parsed = ensureJsonBody(request)
    if (!parsed.ok) {
      reply.code(415)
      return { error: parsed.error }
    }

    return {
      station: 'fetch-json',
      received: parsed.body,
      serverTime: new Date().toISOString()
    }
  })

  fastify.get('/stations/rest-put', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'PUT REST Station',
      `
      <h1>PUT Mini REST API</h1>
      <p>Use the API endpoints to observe idempotent PUT behavior.</p>
      <pre>PUT /api/todos/:id
GET /api/todos/:id
DELETE /api/todos/:id</pre>
      <p class="small">Example: <code>curl -i -X PUT http://localhost:3000/api/todos/1 -H 'content-type: application/json' -d '{"title":"Read RFC","done":false}'</code></p>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.put('/api/todos/:id', async (request, reply) => {
    const parsed = ensureJsonBody(request)
    if (!parsed.ok) {
      reply.code(415)
      return { error: parsed.error }
    }

    const id = (request.params as { id?: string }).id
    if (!id) {
      reply.code(400)
      return { error: 'missing id' }
    }

    const title = parsed.body.title
    const done = parsed.body.done
    if (typeof title !== 'string' || typeof done !== 'boolean') {
      reply.code(400)
      return { error: 'title must be string and done must be boolean' }
    }

    const todo = store.upsertTodo(id, title, done)
    reply.header('X-Idempotent-Method', 'PUT')
    return { todo }
  })

  fastify.get('/api/todos/:id', async (request, reply) => {
    const id = (request.params as { id?: string }).id
    if (!id) {
      reply.code(400)
      return { error: 'missing id' }
    }

    const todo = store.getTodo(id)
    if (!todo) {
      reply.code(404)
      return { error: 'todo not found' }
    }

    return { todo }
  })

  fastify.delete('/api/todos/:id', async (request, reply) => {
    const id = (request.params as { id?: string }).id
    if (!id) {
      reply.code(400)
      return { error: 'missing id' }
    }

    const deleted = store.deleteTodo(id)
    return { deleted }
  })

  fastify.get('/stations/cache', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'Cache Station',
      `
      <h1>Cache-Control Station</h1>
      <pre>
GET /api/cache/public   -> Cache-Control: public, max-age=60
GET /api/cache/private  -> Cache-Control: private, max-age=30
GET /api/cache/no-store -> Cache-Control: no-store
      </pre>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.get('/api/cache/public', async (_request, reply) => {
    reply.header('Cache-Control', 'public, max-age=60')
    reply.header('Expires', new Date(Date.now() + 60_000).toUTCString())
    return { station: 'cache', policy: 'public', at: new Date().toISOString() }
  })

  fastify.get('/api/cache/private', async (_request, reply) => {
    reply.header('Cache-Control', 'private, max-age=30')
    return { station: 'cache', policy: 'private', at: new Date().toISOString() }
  })

  fastify.get('/api/cache/no-store', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store')
    return { station: 'cache', policy: 'no-store', at: new Date().toISOString() }
  })

  fastify.get('/stations/chunked', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'Chunked Transfer Station',
      `
      <h1>Chunked Transfer Encoding</h1>
      <p>Call the endpoint and observe incremental chunks.</p>
      <pre>curl -i http://localhost:3000/api/chunked/time</pre>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.get('/api/chunked/time', async (request, reply) => {
    const query = request.query as { count?: string; intervalMs?: string }
    const count = parsePositiveInt(query.count, 4)
    const intervalMs = parsePositiveInt(query.intervalMs, 250)

    reply.hijack()
    reply.raw.statusCode = 200
    reply.raw.setHeader('Content-Type', 'text/plain; charset=utf-8')
    reply.raw.setHeader('Cache-Control', 'no-store')
    reply.raw.setHeader('X-Station', 'chunked')

    let sent = 0
    const timer = setInterval(() => {
      sent += 1
      reply.raw.write(`chunk ${sent}: ${new Date().toISOString()}\n`)
      if (sent >= count) {
        clearInterval(timer)
        reply.raw.end('done\n')
      }
    }, intervalMs)

    reply.raw.on('close', () => clearInterval(timer))
  })

  fastify.get('/stations/sse', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'SSE Station',
      `
      <h1>Server-Sent Events</h1>
      <section>
        <button id="open">Open Stream</button>
        <pre id="out">(no events yet)</pre>
      </section>
      <script>
        document.getElementById('open').addEventListener('click', () => {
          const out = document.getElementById('out');
          out.textContent = '';
          const es = new EventSource('/api/sse/clock?count=6&intervalMs=700');
          es.addEventListener('tick', (event) => {
            out.textContent += event.data + '\n';
          });
          es.addEventListener('done', () => {
            out.textContent += '[stream closed]';
            es.close();
          });
        });
      </script>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.get('/api/sse/clock', async (request, reply) => {
    const query = request.query as { count?: string; intervalMs?: string }
    const count = parsePositiveInt(query.count, 5)
    const intervalMs = parsePositiveInt(query.intervalMs, 1000)

    reply.hijack()
    reply.raw.statusCode = 200
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')

    let sent = 0
    const timer = setInterval(() => {
      sent += 1
      reply.raw.write(`event: tick\n`)
      reply.raw.write(`data: ${JSON.stringify({ index: sent, at: new Date().toISOString() })}\n\n`)
      if (sent >= count) {
        clearInterval(timer)
        reply.raw.write('event: done\ndata: complete\n\n')
        reply.raw.end()
      }
    }, intervalMs)

    reply.raw.on('close', () => clearInterval(timer))
  })

  fastify.get('/stations/session-auth', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'Session Auth Station',
      `
      <h1>Session Cookie Auth + CSRF</h1>
      <section>
        <label>Username: <input id="u" value="student" /></label>
        <button id="login">Login</button>
        <button id="me">Who am I?</button>
        <button id="mutate">POST with CSRF</button>
        <button id="logout">Logout</button>
        <pre id="out">(waiting)</pre>
      </section>
      <script>
        let csrf = '';
        const out = document.getElementById('out');
        async function show(res) {
          const text = await res.text();
          out.textContent = res.status + '\n' + text;
        }
        document.getElementById('login').onclick = async () => {
          const username = document.getElementById('u').value;
          const res = await fetch('/api/session/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username })
          });
          const data = await res.json();
          csrf = data.csrfToken || '';
          out.textContent = JSON.stringify(data, null, 2);
        };
        document.getElementById('me').onclick = async () => {
          const res = await fetch('/api/session/me', { credentials: 'include' });
          await show(res);
        };
        document.getElementById('mutate').onclick = async () => {
          const res = await fetch('/api/session/protected-action', {
            method: 'POST',
            headers: { 'x-csrf-token': csrf },
            credentials: 'include'
          });
          await show(res);
        };
        document.getElementById('logout').onclick = async () => {
          const res = await fetch('/api/session/logout', { method: 'POST', credentials: 'include' });
          await show(res);
        };
      </script>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.post('/api/session/login', async (request, reply) => {
    let username = 'anonymous'
    const parsed = ensureJsonBody(request)
    if (parsed.ok && typeof parsed.body.username === 'string' && parsed.body.username.trim() !== '') {
      username = parsed.body.username.trim()
    } else if (!parsed.ok && (request.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded')) {
      const form = await parseFormBody(request)
      if (form.username && form.username.trim() !== '') username = form.username.trim()
    }

    const session = store.createSession(username)
    setCookie(reply, SESSION_COOKIE, session.id, { httpOnly: true, sameSite: 'Lax', path: '/', maxAgeSec: 3600 })
    return {
      station: 'session-auth',
      username: session.user.username,
      csrfToken: session.csrfToken
    }
  })

  fastify.get('/api/session/me', async (request, reply) => {
    const session = sessionFromRequest(request)
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

  fastify.post('/api/session/protected-action', async (request, reply) => {
    const session = sessionFromRequest(request)
    if (!session) {
      reply.code(401)
      return { error: 'not authenticated' }
    }

    const csrfHeader = request.headers['x-csrf-token']
    if (csrfHeader !== session.csrfToken) {
      reply.code(403)
      return { error: 'csrf token invalid' }
    }

    return { ok: true, message: 'state-changing action accepted' }
  })

  fastify.post('/api/session/logout', async (request, reply) => {
    const cookies = parseCookieHeader(request.headers.cookie)
    const sid = cookies[SESSION_COOKIE]
    if (sid) store.deleteSession(sid)
    clearCookie(reply, SESSION_COOKIE)
    return { loggedOut: true }
  })

  fastify.get('/stations/jwt-auth', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'JWT Auth Station',
      `
      <h1>JWT Access + Rotating Refresh</h1>
      <section>
        <label>Username: <input id="user" value="api-user" /></label>
        <button id="login">Login</button>
        <button id="me">GET /me</button>
        <button id="refresh">Refresh</button>
        <button id="logout">Logout</button>
        <pre id="out">(waiting)</pre>
      </section>
      <script>
        let access = '';
        const out = document.getElementById('out');
        async function show(res) {
          const text = await res.text();
          out.textContent = res.status + '\n' + text;
        }
        document.getElementById('login').onclick = async () => {
          const username = document.getElementById('user').value;
          const res = await fetch('/api/jwt/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username })
          });
          const data = await res.json();
          access = data.accessToken || '';
          out.textContent = JSON.stringify(data, null, 2);
        };
        document.getElementById('me').onclick = async () => {
          const res = await fetch('/api/jwt/me', {
            headers: { authorization: 'Bearer ' + access }
          });
          await show(res);
        };
        document.getElementById('refresh').onclick = async () => {
          const res = await fetch('/api/jwt/refresh', {
            method: 'POST',
            credentials: 'include'
          });
          const data = await res.json();
          if (data.accessToken) access = data.accessToken;
          out.textContent = JSON.stringify(data, null, 2);
        };
        document.getElementById('logout').onclick = async () => {
          const res = await fetch('/api/jwt/logout', { method: 'POST', credentials: 'include' });
          await show(res);
        };
      </script>
      <p class="small">Note: this offline build uses native crypto JWT signing to avoid external package downloads.</p>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.post('/api/jwt/login', async (request, reply) => {
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

    setCookie(reply, REFRESH_COOKIE, refreshToken, { httpOnly: true, path: '/', sameSite: 'Lax', maxAgeSec: 3600 })

    return {
      station: 'jwt-auth',
      accessToken,
      accessExpiresInSec: 120,
      refreshExpiresInSec: 3600
    }
  })

  fastify.get('/api/jwt/me', async (request, reply) => {
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

  fastify.post('/api/jwt/refresh', async (request, reply) => {
    const cookies = parseCookieHeader(request.headers.cookie)
    const refreshToken = cookies[REFRESH_COOKIE]
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

    setCookie(reply, REFRESH_COOKIE, nextRefreshToken, { httpOnly: true, path: '/', sameSite: 'Lax', maxAgeSec: 3600 })

    return {
      rotated: true,
      accessToken,
      accessExpiresInSec: 120
    }
  })

  fastify.post('/api/jwt/logout', async (request, reply) => {
    const cookies = parseCookieHeader(request.headers.cookie)
    const refreshToken = cookies[REFRESH_COOKIE]
    if (refreshToken) {
      const verified = verifyJwt(refreshToken, REFRESH_SECRET)
      if (verified.ok) {
        store.revokeRefreshToken(verified.payload.jti)
      }
    }

    clearCookie(reply, REFRESH_COOKIE)
    return { loggedOut: true }
  })

  fastify.get('/stations/conditional', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'Conditional Request Station',
      `
      <h1>Conditional Requests (ETag / If-None-Match)</h1>
      <pre>curl -i http://localhost:3000/api/conditional/resource</pre>
      <pre>curl -i http://localhost:3000/api/conditional/resource -H 'If-None-Match: "...etag..."'</pre>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.get('/api/conditional/resource', async (request, reply) => {
    const payload = {
      name: 'http-stations-resource',
      value: 'stable demo payload',
      version: 1
    }
    const raw = JSON.stringify(payload)
    const etag = `"${createHash('sha1').update(raw).digest('hex')}"`
    reply.header('ETag', etag)
    reply.header('Cache-Control', 'private, max-age=0, must-revalidate')

    if (request.headers['if-none-match'] === etag) {
      reply.code(304)
      return
    }

    return payload
  })

  fastify.get('/stations/cors', async (_request, reply) => {
    reply.type('text/html; charset=utf-8')
    return htmlPage(
      'CORS Station',
      `
      <h1>CORS + Preflight</h1>
      <p class="small">Demo endpoint expects <code>Origin: https://example.edu</code>.</p>
      <pre>curl -i -X OPTIONS http://localhost:3000/api/cors/echo \\
  -H 'Origin: https://example.edu' \\
  -H 'Access-Control-Request-Method: POST' \\
  -H 'Access-Control-Request-Headers: content-type'</pre>
      <p><a href="/">Back</a></p>
      `
    )
  })

  fastify.options('/api/cors/echo', async (request, reply) => {
    const origin = request.headers.origin
    if (origin !== 'https://example.edu') {
      reply.code(403)
      return { error: 'origin not allowed' }
    }

    reply.header('Access-Control-Allow-Origin', origin)
    reply.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    reply.header('Access-Control-Allow-Headers', 'content-type, authorization')
    reply.header('Access-Control-Max-Age', '600')
    reply.code(204)
    return ''
  })

  fastify.post('/api/cors/echo', async (request, reply) => {
    const origin = request.headers.origin
    if (origin !== 'https://example.edu') {
      reply.code(403)
      return { error: 'origin not allowed' }
    }

    reply.header('Access-Control-Allow-Origin', origin)
    reply.header('Vary', 'Origin')

    const parsed = ensureJsonBody(request)
    if (!parsed.ok) {
      reply.code(415)
      return { error: parsed.error }
    }

    return {
      station: 'cors',
      acceptedOrigin: origin,
      body: parsed.body
    }
  })
}

export default root
