const origin = window.location.origin

const originEl = document.getElementById('sf-origin')
const loginEl = document.getElementById('sf-curl-login')
const meEl = document.getElementById('sf-curl-me')
const deniedEl = document.getElementById('sf-curl-denied')
const csrfEl = document.getElementById('sf-curl-csrf')
const logoutEl = document.getElementById('sf-curl-logout')

if (originEl) {
  originEl.textContent = origin
}

if (loginEl) {
  loginEl.textContent = `curl -i -c cookies.txt -X POST ${origin}/api/session-fastify/login \\
  -H 'content-type: application/json' \\
  -d '{"username":"student"}'`
}

if (meEl) {
  meEl.textContent = `curl -i -b cookies.txt ${origin}/api/session-fastify/me`
}

if (deniedEl) {
  deniedEl.textContent = `curl -i -b cookies.txt -X POST ${origin}/api/session-fastify/protected-action`
}

if (csrfEl) {
  csrfEl.textContent = `CSRF=$(curl -s -b cookies.txt ${origin}/api/session-fastify/me | jq -r '.csrfToken')\ncurl -i -b cookies.txt -X POST ${origin}/api/session-fastify/protected-action \\
  -H "x-csrf-token: $CSRF"`
}

if (logoutEl) {
  logoutEl.textContent = `curl -i -b cookies.txt -X POST ${origin}/api/session-fastify/logout`
}
