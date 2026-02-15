# Stations Notes

Each station has its own Fastify route plugin under this folder:

- `src/routes/stations/<station>/index.ts` for station page routes
- `src/routes/api/<topic>/index.ts` for protocol API endpoints

Static assets are served from `src/public/` through `@fastify/static`:

- `src/public/stations/*.html` for pages
- `src/public/js/*.js` for browser logic
- `src/public/styles.css` for shared styling

Topics covered:

- HTML forms (`GET` and `POST`)
- JSON API calls with `fetch`
- `PUT` idempotency
- Cache headers and revalidation
- Chunked transfer streaming
- Server-Sent Events
- Session cookie auth + CSRF token
- JWT access + rotating refresh token
- Conditional requests (`ETag`, `If-None-Match`)
- CORS preflight and origin allow-listing
