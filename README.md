# HTTP Protocol Stations (Fastify + TypeScript)

This project is an educational showcase of HTTP behavior using small, focused stations.
It intentionally avoids heavy frontend frameworks and keeps styling minimal so protocol mechanics are the focus.

## Run

```bash
npm run dev
```

Open: <http://localhost:3000>

## Project Structure

- `src/routes/stations/*`: station page route plugins
- `src/routes/api/*`: API route plugins for protocol behaviors
- `src/public/*`: static HTML/CSS/JS assets served under `/public/*`
- `src/plugins/static.ts`: static asset plugin registration

## Stations

1. `GET /stations/forms` - HTML GET/POST form submission
2. `GET /stations/fetch-json` - `fetch()` JSON POST
3. `GET /stations/rest-put` - idempotent `PUT` mini REST API
4. `GET /stations/cache` - `Cache-Control` response policies
5. `GET /stations/chunked` - chunked transfer stream
6. `GET /stations/sse` - Server-Sent Events (`text/event-stream`)
7. `GET /stations/session-auth` - session cookie auth + CSRF protection
8. `GET /stations/jwt-auth` - JWT access token + rotating refresh token
9. `GET /stations/conditional` - `ETag` / `If-None-Match` (`304`)
10. `GET /stations/cors` - CORS preflight (`OPTIONS`) and origin checks

## Useful API Endpoints

- `POST /api/fetch-json/echo`
- `PUT|GET|DELETE /api/todos/:id`
- `GET /api/cache/public|private|no-store`
- `GET /api/chunked/time`
- `GET /api/sse/clock`
- `POST /api/session/login`
- `GET /api/session/me`
- `POST /api/session/protected-action`
- `POST /api/session/logout`
- `POST /api/jwt/login`
- `GET /api/jwt/me`
- `POST /api/jwt/refresh`
- `POST /api/jwt/logout`
- `GET /api/conditional/resource`
- `OPTIONS|POST /api/cors/echo`

## Quick curl examples

```bash
curl -i http://localhost:3000/api/cache/public
curl -i -X PUT http://localhost:3000/api/todos/42 -H 'content-type: application/json' -d '{"title":"Read RFC 9110","done":false}'
curl -i http://localhost:3000/api/chunked/time?count=3\&intervalMs=200
curl -i http://localhost:3000/api/sse/clock?count=3\&intervalMs=200
```

## Notes

- Data is in-memory only; restart clears todos/sessions/tokens.
- JWT signing/verification uses the `jsonwebtoken` package.
