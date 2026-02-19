const origin = window.location.origin

const originEl = document.getElementById('jf-origin')
const loginEl = document.getElementById('jf-curl-login')
const meEl = document.getElementById('jf-curl-me')
const refreshEl = document.getElementById('jf-curl-refresh')
const me2El = document.getElementById('jf-curl-me2')
const replayEl = document.getElementById('jf-curl-replay')
const logoutEl = document.getElementById('jf-curl-logout')

if (originEl) {
  originEl.textContent = origin
}

if (loginEl) {
  loginEl.textContent = `LOGIN_JSON=$(curl -s -c jf-cookies.txt -X POST ${origin}/api/jwt-fastify/login \\
  -H 'content-type: application/json' \\
  -d '{"username":"api-user"}')
echo "$LOGIN_JSON" | jq .
ACCESS=$(echo "$LOGIN_JSON" | jq -r '.accessToken')`
}

if (meEl) {
  meEl.textContent = `curl -i ${origin}/api/jwt-fastify/me \\
  -H "Authorization: Bearer $ACCESS"`
}

if (refreshEl) {
  refreshEl.textContent = `cp jf-cookies.txt jf-cookies-old.txt
REFRESH_JSON=$(curl -s -b jf-cookies.txt -c jf-cookies.txt -X POST ${origin}/api/jwt-fastify/refresh)
echo "$REFRESH_JSON" | jq .
NEW_ACCESS=$(echo "$REFRESH_JSON" | jq -r '.accessToken')`
}

if (me2El) {
  me2El.textContent = `curl -i ${origin}/api/jwt-fastify/me \\
  -H "Authorization: Bearer $NEW_ACCESS"`
}

if (replayEl) {
  replayEl.textContent = `curl -i -b jf-cookies-old.txt -X POST ${origin}/api/jwt-fastify/refresh`
}

if (logoutEl) {
  logoutEl.textContent = `curl -i -b jf-cookies.txt -X POST ${origin}/api/jwt-fastify/logout`
}
