# Stations Notes

This folder can hold station-specific route modules. In this implementation,
station routes are currently registered from `src/routes/root.ts` so all demo
paths are easy to inspect in one place.

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
