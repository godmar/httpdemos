const origin = window.location.origin
const originEl = document.getElementById('cors-origin')
const allowedOptionsEl = document.getElementById('curl-cors-options-allowed')
const deniedOptionsEl = document.getElementById('curl-cors-options-denied')
const allowedPostEl = document.getElementById('curl-cors-post-allowed')

if (originEl) {
  originEl.textContent = origin
}

if (allowedOptionsEl) {
  allowedOptionsEl.textContent = `curl -i -X OPTIONS ${origin}/api/cors/echo \\
  -H 'Origin: https://example.edu' \\
  -H 'Access-Control-Request-Method: POST' \\
  -H 'Access-Control-Request-Headers: content-type'`
}

if (deniedOptionsEl) {
  deniedOptionsEl.textContent = `curl -i -X OPTIONS ${origin}/api/cors/echo \\
  -H 'Origin: https://evil.example' \\
  -H 'Access-Control-Request-Method: POST' \\
  -H 'Access-Control-Request-Headers: content-type'`
}

if (allowedPostEl) {
  allowedPostEl.textContent = `curl -i -X POST ${origin}/api/cors/echo \\
  -H 'Origin: https://example.edu' \\
  -H 'content-type: application/json' \\
  -d '{"hello":"cors"}'`
}
