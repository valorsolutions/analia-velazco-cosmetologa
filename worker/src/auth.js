// worker/src/auth.js
const ALG = { name: 'HMAC', hash: 'SHA-256' }

async function importKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALG,
    false,
    ['sign', 'verify']
  )
}

export async function createToken(secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 // 24 horas
  }))
  const data = `${header}.${payload}`
  const key = await importKey(secret)
  const sig = await crypto.subtle.sign(ALG.name, key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `${data}.${sigB64}`
}

export async function verifyToken(token, secret) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, sig] = parts
  const data = `${header}.${payload}`
  const padding = '=='.slice(0, (4 - sig.length % 4) % 4)
  try {
    const key = await importKey(secret)
    const sigBytes = Uint8Array.from(
      atob(sig.replace(/-/g, '+').replace(/_/g, '/') + padding),
      c => c.charCodeAt(0)
    )
    const valid = await crypto.subtle.verify(ALG.name, key, sigBytes, new TextEncoder().encode(data))
    if (!valid) return null
    const claims = JSON.parse(atob(payload))
    if (claims.exp < Math.floor(Date.now() / 1000)) return null
    return claims
  } catch {
    return null
  }
}

export async function authenticate(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyToken(auth.slice(7), env.JWT_SECRET)
}
