// worker/src/index.js
import { authenticate, createToken } from './auth.js'
import {
  getServices, getAllServices, createService, updateService, deleteService, toggleService
} from './services.js'
import {
  getPromotions, getAllPromotions, createPromotion, updatePromotion, deletePromotion, togglePromotion
} from './promotions.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    try {
      // --- Endpoints públicos ---
      if (path === '/api/services' && method === 'GET') {
        return json(await getServices(env))
      }
      if (path === '/api/promotions' && method === 'GET') {
        return json(await getPromotions(env))
      }

      // --- Auth ---
      if (path === '/api/auth/login' && method === 'POST') {
        const { username, password } = await request.json()
        if (username !== env.ADMIN_USER || password !== env.ADMIN_PASS) {
          return json({ error: 'Credenciales incorrectas' }, 401)
        }
        return json({ token: await createToken(env.JWT_SECRET) })
      }

      // --- Endpoints protegidos ---
      const user = await authenticate(request, env)
      if (!user) return json({ error: 'No autorizado' }, 401)

      // GET all services (admin, incluye inactivos)
      if (path === '/api/admin/services' && method === 'GET') {
        return json(await getAllServices(env))
      }
      if (path === '/api/admin/promotions' && method === 'GET') {
        return json(await getAllPromotions(env))
      }

      // Services CRUD
      if (path === '/api/services' && method === 'POST') {
        return json(await createService(await request.json(), env), 201)
      }
      const svcMatch = path.match(/^\/api\/services\/(\d+)(\/toggle)?$/)
      if (svcMatch) {
        const id = parseInt(svcMatch[1])
        if (svcMatch[2] === '/toggle' && method === 'PATCH') return json(await toggleService(id, env))
        if (method === 'PUT') return json(await updateService(id, await request.json(), env))
        if (method === 'DELETE') return json(await deleteService(id, env))
      }

      // Promotions CRUD
      if (path === '/api/promotions' && method === 'POST') {
        return json(await createPromotion(await request.json(), env), 201)
      }
      const promoMatch = path.match(/^\/api\/promotions\/(\d+)(\/toggle)?$/)
      if (promoMatch) {
        const id = parseInt(promoMatch[1])
        if (promoMatch[2] === '/toggle' && method === 'PATCH') return json(await togglePromotion(id, env))
        if (method === 'PUT') return json(await updatePromotion(id, await request.json(), env))
        if (method === 'DELETE') return json(await deletePromotion(id, env))
      }

      return json({ error: 'Not found' }, 404)
    } catch (e) {
      return json({ error: e.message }, 500)
    }
  }
}
