const origin = window.location.origin

const originEl = document.getElementById('session-origin')
const loginEl = document.getElementById('curl-session-login')
const meEl = document.getElementById('curl-session-me')
const deniedEl = document.getElementById('curl-session-denied')
const csrfEl = document.getElementById('curl-session-csrf')
const logoutEl = document.getElementById('curl-session-logout')

if (originEl) {
  originEl.textContent = origin
}

if (loginEl) {
  loginEl.textContent = `curl -i -c cookies.txt -X POST ${origin}/api/session/login \\
  -H 'content-type: application/json' \\
  -d '{"username":"student"}'`
}

if (meEl) {
  meEl.textContent = `curl -i -b cookies.txt ${origin}/api/session/me`
}

if (deniedEl) {
  deniedEl.textContent = `curl -i -b cookies.txt -X POST ${origin}/api/session/protected-action`
}

if (csrfEl) {
  csrfEl.textContent = `CSRF=$(curl -s -b cookies.txt ${origin}/api/session/me | jq -r '.csrfToken')\ncurl -i -b cookies.txt -X POST ${origin}/api/session/protected-action \\
  -H "x-csrf-token: $CSRF"`
}

if (logoutEl) {
  logoutEl.textContent = `curl -i -b cookies.txt -X POST ${origin}/api/session/logout`
}
