const origin = window.location.origin

const originEl = document.getElementById('jwt-origin')
const loginEl = document.getElementById('curl-jwt-login')
const meEl = document.getElementById('curl-jwt-me')
const refreshEl = document.getElementById('curl-jwt-refresh')
const me2El = document.getElementById('curl-jwt-me2')
const replayEl = document.getElementById('curl-jwt-replay')
const logoutEl = document.getElementById('curl-jwt-logout')

if (originEl) {
  originEl.textContent = origin
}

if (loginEl) {
  loginEl.textContent = `LOGIN_JSON=$(curl -s -c jwt-cookies.txt -X POST ${origin}/api/jwt/login \\
  -H 'content-type: application/json' \\
  -d '{"username":"api-user"}')
echo "$LOGIN_JSON" | jq .
ACCESS=$(echo "$LOGIN_JSON" | jq -r '.accessToken')`
}

if (meEl) {
  meEl.textContent = `curl -i ${origin}/api/jwt/me \\
  -H "Authorization: Bearer $ACCESS"`
}

if (refreshEl) {
  refreshEl.textContent = `cp jwt-cookies.txt jwt-cookies-old.txt
REFRESH_JSON=$(curl -s -b jwt-cookies.txt -c jwt-cookies.txt -X POST ${origin}/api/jwt/refresh)
echo "$REFRESH_JSON" | jq .
NEW_ACCESS=$(echo "$REFRESH_JSON" | jq -r '.accessToken')`
}

if (me2El) {
  me2El.textContent = `curl -i ${origin}/api/jwt/me \\
  -H "Authorization: Bearer $NEW_ACCESS"`
}

if (replayEl) {
  replayEl.textContent = `curl -i -b jwt-cookies-old.txt -X POST ${origin}/api/jwt/refresh`
}

if (logoutEl) {
  logoutEl.textContent = `curl -i -b jwt-cookies.txt -X POST ${origin}/api/jwt/logout`
}
