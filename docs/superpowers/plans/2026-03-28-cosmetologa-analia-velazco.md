# Cosmetóloga Analía Velazco — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Landing institucional + panel admin con auth para que Analía y Karina gestionen servicios y promociones sin depender del desarrollador.

**Architecture:** Cloudflare Pages sirve el frontend estático (`public/`). Un Cloudflare Worker separado maneja toda la API (`/api/*`). Cloudflare D1 almacena servicios y promociones, vinculada al Worker. La landing carga los datos dinámicamente desde la API. El panel admin en `/admin/` hace CRUD contra los endpoints protegidos con JWT.

**Tech Stack:** HTML/CSS/JS vanilla, Cloudflare Pages, Cloudflare Workers (ES modules), Cloudflare D1 (SQLite), JWT con Web Crypto API (sin dependencias externas).

**Spec:** `docs/superpowers/specs/2026-03-28-cosmetologa-analia-velazco-landing-design.md`

---

## Estructura de archivos

```
cosmetologa-analia-velazco/         ← nuevo directorio (sibling de valorsolutions/)
  public/                           ← Cloudflare Pages
    index.html                      ← landing (7 secciones)
    admin/
      index.html                    ← login page
      dashboard.html                ← panel admin (servicios + promos)
    css/
      style.css                     ← estilos landing
      admin.css                     ← estilos panel admin
    js/
      main.js                       ← landing: fetch + render servicios y promos
      admin-login.js                ← login: POST /api/auth/login, guardar token
      admin-dashboard.js            ← dashboard: CRUD servicios y promos
    img/                            ← vacío (fotos se agregan después)
  worker/
    src/
      index.js                      ← router principal + CORS
      auth.js                       ← JWT createToken/verifyToken/authenticate
      services.js                   ← handlers CRUD servicios
      promotions.js                 ← handlers CRUD promociones
    .dev.vars                       ← secrets locales (NO commitear)
    wrangler.toml                   ← config Worker + D1 binding
  db/
    schema.sql                      ← CREATE TABLE services + promotions
    seed.sql                        ← INSERT catálogo completo (~40 servicios)
  .gitignore
```

**Regla CORS:** el Worker responde con `Access-Control-Allow-Origin: *` en desarrollo. En producción, reemplazar `*` con la URL real del Pages project.

---

## Task 1: Project scaffolding

**Files:**
- Create: `cosmetologa-analia-velazco/.gitignore`
- Create: `cosmetologa-analia-velazco/worker/wrangler.toml`
- Create: `cosmetologa-analia-velazco/worker/.dev.vars` (no commitear)

- [ ] **Step 1: Crear directorio y git repo**

```bash
cd ~/Downloads
mkdir cosmetologa-analia-velazco
cd cosmetologa-analia-velazco
git init
```

- [ ] **Step 2: Crear estructura de directorios**

```bash
mkdir -p public/admin public/css public/js public/img
mkdir -p worker/src
mkdir -p db
```

- [ ] **Step 3: Crear .gitignore**

```
# cosmetologa-analia-velazco/.gitignore
node_modules/
.dev.vars
.wrangler/
*.DS_Store
```

- [ ] **Step 4: Crear worker/wrangler.toml**

```toml
name = "cosmetologa-analia-velazco-api"
main = "src/index.js"
compatibility_date = "2024-09-23"

[[d1_databases]]
binding = "DB"
database_name = "cosmetologa-analia-velazco"
database_id = "REPLACE_AFTER_D1_CREATION"
```

- [ ] **Step 5: Crear worker/.dev.vars (secrets locales, NO commitear)**

```
ADMIN_USER=analia
ADMIN_PASS=cambiar_por_password_real
JWT_SECRET=cambiar_por_secreto_aleatorio_largo
```

- [ ] **Step 6: Crear D1 database**

```bash
cd worker
npx wrangler d1 create cosmetologa-analia-velazco
```

Copiar el `database_id` que devuelve el comando y reemplazarlo en `wrangler.toml`.

- [ ] **Step 7: Commit inicial**

```bash
cd ..
git add .gitignore worker/wrangler.toml
git commit -m "chore: project scaffolding"
```

---

## Task 2: Schema de base de datos

**Files:**
- Create: `db/schema.sql`

- [ ] **Step 1: Crear db/schema.sql**

```sql
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL,
  price_label TEXT,
  category TEXT NOT NULL CHECK(category IN ('facial', 'corporal', 'servicios')),
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  original_price INTEGER,
  promo_price INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
```

- [ ] **Step 2: Aplicar schema a D1 local**

```bash
cd worker
npx wrangler d1 execute cosmetologa-analia-velazco --local --file=../db/schema.sql
```

Expected output: `🌀 Mapping SQL input into an approximate number of statements` seguido de `✅ Executed N queries.`

- [ ] **Step 3: Aplicar schema a D1 remoto**

```bash
npx wrangler d1 execute cosmetologa-analia-velazco --remote --file=../db/schema.sql
```

- [ ] **Step 4: Commit**

```bash
cd ..
git add db/schema.sql
git commit -m "db: schema services + promotions"
```

---

## Task 3: Seed data — catálogo completo

**Files:**
- Create: `db/seed.sql`

- [ ] **Step 1: Crear db/seed.sql con el catálogo completo**

```sql
-- Limpiar datos existentes (útil para re-seed)
DELETE FROM services;
DELETE FROM promotions;

-- TRATAMIENTOS FACIALES
-- Higiene Facial
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Limpieza Esencial', 'Limpieza facial con exfoliación + espátula ultrasónica + mascarilla específica según biotipo cutáneo', 35000, 'facial', 10),
  ('Limpieza Profunda', 'Extracción de puntos negros + espátula ultrasónica + punta de diamantes + alta frecuencia + ácido', 39000, 'facial', 20),
  ('Higiene Premium', 'Ídem Limpieza Profunda + terapia fotolumínica roja + electroporación con activos para resultados más visibles', 45000, 'facial', 30);

-- Peeling Renovador
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Peeling Clásico', 'Peeling profesional para unificar tono, suavizar líneas y mejorar textura', 29000, 'facial', 40),
  ('Peeling con Ácido', 'Higiene Profunda + tratamiento con ácido', 39000, 'facial', 50),
  ('Peeling con Electroporación', 'Higiene Profunda + peeling + electroporación', 43000, 'facial', 60),
  ('Peeling con Retinoico', 'Higiene + mascarilla de retinoico para suavizar líneas, afinar poros y rejuvenecer', 47000, 'facial', 70);

-- Radiofrecuencia
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Radiofrecuencia Base', 'Calor dérmico que estimula colágeno y elastina. Incluye Higiene Profunda + radiofrecuencia', 39000, 'facial', 80),
  ('Radiofrecuencia con Electroporador', 'Higiene Profunda + radiofrecuencia + electroporador', 43000, 'facial', 90);

-- Ritual
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Ritual Piel de Porcelana', 'Radiofrecuencia tensora + cristales de vitamina C + ácido renovador. Piel firme, luminosa y uniforme desde la primera sesión', 45000, 'facial', 100);

-- Dermaplaning
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Dermaplaning Clásico', 'Peeling con bisturí + activos específicos. Cada 25/28 días', 35000, 'facial', 110),
  ('Dermaplaning con Electroporación', 'Higiene Profunda + Dermaplaning + electroporación y/o ácido', 39000, 'facial', 120),
  ('Dermaplaning Completo', 'Dermaplaning + Peeling con ácidos (manchas, poros dilatados) + electroporación. Suavidad extrema, glow inmediato', 45000, 'facial', 130);

-- Microneedling / Dermapen
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Dermapen Base', 'Higiene Profunda + Dermapen. Estimula colágeno y elastina mediante microagujas', 39000, 'facial', 140),
  ('Dermapen con Peeling', 'Higiene Profunda + peeling + Dermapen', 45000, 'facial', 150),
  ('Meso Botox Cosmetológico', 'Microneedling + activos específicos + electroporación', 43000, 'facial', 160),
  ('Ritual Antiage Avanzado', 'Exosomas con efecto lifting y firmeza', 49000, 'facial', 170);

-- Add-on
INSERT INTO services (name, description, price, price_label, category, sort_order) VALUES
  ('Terapia LED Roja (Add-on)', 'Fotobiomoduladora. Optimiza recuperación cutánea y prolonga resultados. Se suma a cualquier tratamiento facial', 5900, '+$5.900', 'facial', 180);

-- TRATAMIENTOS CORPORALES
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Tratamiento Corporal — 1 sesión', 'Indicado para abdomen, celulitis, piernas cansadas y flacidez. Combina Ondas de Choque, Crio-Radiofrecuencia, Presoterapia y/o Maderoterapia según el caso. Incluye exfoliación + activos + cremas específicas', 31000, 'corporal', 10),
  ('Tratamiento Corporal — Pack 3 sesiones', 'Pack de 3 sesiones de tratamiento corporal. Los packs deben consumirse dentro de un mes', 80000, 'corporal', 20),
  ('Tratamiento Corporal — Pack 4 sesiones', 'Pack de 4 sesiones de tratamiento corporal. Los packs deben consumirse dentro de un mes', 95000, 'corporal', 30),
  ('Reflexología', 'Sesión de reflexología', 15000, 'corporal', 40),
  ('Masaje Relajante de Espalda', 'Masaje relajante focalizado en espalda', 25000, 'corporal', 50),
  ('Masaje Relajante Cuerpo Completo', 'Masaje relajante de cuerpo completo', 39000, 'corporal', 60),
  ('Bronceado Orgánico Made in EE.UU', 'Color dorado y duradero. 100% natural y libre de químicos. Producto importado, resultados inmediatos', 37000, 'corporal', 70);

-- SERVICIOS (Karina Ruiz Diaz)
INSERT INTO services (name, description, price, category, sort_order) VALUES
  ('Perfilado de cejas', 'Diseño personalizado de cejas', 25000, 'servicios', 10),
  ('Perfilado y sombreado de cejas', 'Diseño personalizado + sombreado para realzar el color y definir la mirada', 29000, 'servicios', 20),
  ('Perfilado, sombreado y alisado de cejas', 'Diseño completo con alisado para emprolijar', 35000, 'servicios', 30),
  ('Lifting de pestañas', 'Eleva y curva las pestañas naturales sin extensiones artificiales. Resalta la mirada con bajo mantenimiento', 33000, 'servicios', 40),
  ('Makeup profesional en el local', 'Maquillaje profesional. Técnica, precisión y estilo. Maquillaje personalizado', 65000, 'servicios', 50),
  ('Limpieza de cutis', 'Limpieza de cutis profesional', 35000, 'servicios', 60),
  ('Esmaltado Tradicional Manos', 'Esmaltado tradicional para manos', 15000, 'servicios', 70),
  ('Esmaltado Tradicional Pies', 'Esmaltado tradicional para pies', 17000, 'servicios', 80),
  ('Esmaltado Semipermanente Manos', 'Esmaltado semipermanente para manos', 21000, 'servicios', 90),
  ('Esmaltado Semipermanente Pies', 'Esmaltado semipermanente para pies', 23000, 'servicios', 100),
  ('Promo Manos + Pies Semipermanente', 'Combo esmaltado semipermanente manos y pies', 35000, 'servicios', 110),
  ('Promo Manos + Pies Tradicional', 'Combo esmaltado tradicional manos y pies', 25000, 'servicios', 120),
  ('Kapping + Semipermanente', 'Kapping más esmaltado semipermanente', 25000, 'servicios', 130),
  ('Diseño (adicional)', 'Adicional por diseño en uñas', 3000, 'servicios', 140),
  ('Retiro de Semipermanente', 'Retiro de esmaltado semipermanente', 9000, 'servicios', 150);
```

- [ ] **Step 2: Aplicar seed a D1 local**

```bash
cd worker
npx wrangler d1 execute cosmetologa-analia-velazco --local --file=../db/seed.sql
```

- [ ] **Step 3: Verificar datos**

```bash
npx wrangler d1 execute cosmetologa-analia-velazco --local --command="SELECT category, COUNT(*) as total FROM services GROUP BY category"
```

Expected:
```
┌───────────┬───────┐
│ category  │ total │
├───────────┼───────┤
│ corporal  │ 7     │
│ facial    │ 18    │
│ servicios │ 15    │
└───────────┴───────┘
```

- [ ] **Step 4: Aplicar seed a D1 remoto**

```bash
npx wrangler d1 execute cosmetologa-analia-velazco --remote --file=../db/seed.sql
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add db/seed.sql
git commit -m "db: seed catálogo completo 40 servicios"
```

---

## Task 4: Worker — módulo de autenticación

**Files:**
- Create: `worker/src/auth.js`

- [ ] **Step 1: Crear worker/src/auth.js**

```javascript
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
```

- [ ] **Step 2: Verificar sintaxis**

```bash
cd worker
node --input-type=module < src/auth.js 2>&1 || true
```

Expected: sin errores de sintaxis (puede haber error de runtime por `crypto` fuera de Workers, eso es esperado).

- [ ] **Step 3: Commit**

```bash
cd ..
git add worker/src/auth.js
git commit -m "feat: worker auth module JWT (Web Crypto)"
```

---

## Task 5: Worker — handlers de servicios

**Files:**
- Create: `worker/src/services.js`

- [ ] **Step 1: Crear worker/src/services.js**

```javascript
// worker/src/services.js

export async function getServices(env) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM services WHERE active = 1
     ORDER BY category, sort_order, id`
  ).all()
  return {
    facial: results.filter(s => s.category === 'facial'),
    corporal: results.filter(s => s.category === 'corporal'),
    servicios: results.filter(s => s.category === 'servicios')
  }
}

export async function getAllServices(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM services ORDER BY category, sort_order, id'
  ).all()
  return results
}

export async function createService(body, env) {
  const { name, description = '', price, price_label = null, category, sort_order = 0 } = body
  if (!name || !price || !category) {
    throw new Error('name, price y category son requeridos')
  }
  if (!['facial', 'corporal', 'servicios'].includes(category)) {
    throw new Error('category debe ser facial, corporal o servicios')
  }
  const { meta } = await env.DB.prepare(
    `INSERT INTO services (name, description, price, price_label, category, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(name, description, price, price_label, category, sort_order).run()
  return { id: meta.last_row_id, name, description, price, price_label, category, sort_order, active: 1 }
}

export async function updateService(id, body, env) {
  const { name, description = '', price, price_label = null, category, sort_order = 0 } = body
  if (!name || !price || !category) {
    throw new Error('name, price y category son requeridos')
  }
  if (!['facial', 'corporal', 'servicios'].includes(category)) {
    throw new Error('category debe ser facial, corporal o servicios')
  }
  await env.DB.prepare(
    `UPDATE services
     SET name = ?, description = ?, price = ?, price_label = ?, category = ?, sort_order = ?
     WHERE id = ?`
  ).bind(name, description, price, price_label, category, sort_order, id).run()
  return { id, name, description, price, price_label, category, sort_order }
}

export async function deleteService(id, env) {
  await env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run()
  return { deleted: true, id }
}

export async function toggleService(id, env) {
  await env.DB.prepare(
    'UPDATE services SET active = 1 - active WHERE id = ?'
  ).bind(id).run()
  return env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first()
}
```

- [ ] **Step 2: Commit**

```bash
git add worker/src/services.js
git commit -m "feat: worker services handlers (CRUD + toggle)"
```

---

## Task 6: Worker — handlers de promociones

**Files:**
- Create: `worker/src/promotions.js`

- [ ] **Step 1: Crear worker/src/promotions.js**

```javascript
// worker/src/promotions.js

export async function getPromotions(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM promotions WHERE active = 1 LIMIT 3'
  ).all()
  return results
}

export async function getAllPromotions(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM promotions ORDER BY id DESC'
  ).all()
  return results
}

async function countActive(env) {
  const row = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM promotions WHERE active = 1'
  ).first()
  return row.count
}

export async function createPromotion(body, env) {
  const { title, description = '', original_price = null, promo_price } = body
  if (!title || !promo_price) {
    throw new Error('title y promo_price son requeridos')
  }
  const active = await countActive(env)
  if (active >= 3) {
    throw new Error('Ya hay 3 promociones activas. Desactivá una antes de agregar otra.')
  }
  const { meta } = await env.DB.prepare(
    `INSERT INTO promotions (title, description, original_price, promo_price)
     VALUES (?, ?, ?, ?)`
  ).bind(title, description, original_price, promo_price).run()
  return { id: meta.last_row_id, title, description, original_price, promo_price, active: 1 }
}

export async function updatePromotion(id, body, env) {
  const { title, description = '', original_price = null, promo_price } = body
  if (!title || !promo_price) {
    throw new Error('title y promo_price son requeridos')
  }
  await env.DB.prepare(
    `UPDATE promotions
     SET title = ?, description = ?, original_price = ?, promo_price = ?
     WHERE id = ?`
  ).bind(title, description, original_price, promo_price, id).run()
  return { id, title, description, original_price, promo_price }
}

export async function deletePromotion(id, env) {
  await env.DB.prepare('DELETE FROM promotions WHERE id = ?').bind(id).run()
  return { deleted: true, id }
}

export async function togglePromotion(id, env) {
  const promo = await env.DB.prepare('SELECT * FROM promotions WHERE id = ?').bind(id).first()
  if (!promo) throw new Error('Promoción no encontrada')
  if (!promo.active) {
    const active = await countActive(env)
    if (active >= 3) throw new Error('Ya hay 3 promociones activas. Desactivá una antes de activar esta.')
  }
  await env.DB.prepare(
    'UPDATE promotions SET active = 1 - active WHERE id = ?'
  ).bind(id).run()
  return env.DB.prepare('SELECT * FROM promotions WHERE id = ?').bind(id).first()
}
```

- [ ] **Step 2: Commit**

```bash
git add worker/src/promotions.js
git commit -m "feat: worker promotions handlers (CRUD + toggle + límite 3)"
```

---

## Task 7: Worker — router principal y deploy

**Files:**
- Create: `worker/src/index.js`

- [ ] **Step 1: Crear worker/src/index.js**

```javascript
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
```

- [ ] **Step 2: Iniciar Worker en modo local y probar endpoints**

```bash
cd worker
npx wrangler dev --local
```

En otra terminal:

```bash
# Servicios públicos
curl http://localhost:8787/api/services
# Expected: { "facial": [...], "corporal": [...], "servicios": [...] }

# Promociones públicas (vacío inicialmente)
curl http://localhost:8787/api/promotions
# Expected: []

# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"analia","password":"cambiar_por_password_real"}'
# Expected: { "token": "eyJ..." }

# Guardar el token
TOKEN=$(curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"analia","password":"cambiar_por_password_real"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Crear promoción (con token)
curl -X POST http://localhost:8787/api/promotions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Promo Marzo","description":"Limpieza Profunda con descuento","original_price":39000,"promo_price":29000}'
# Expected: { "id": 1, "title": "Promo Marzo", ... }

# Verificar que aparece en endpoint público
curl http://localhost:8787/api/promotions
# Expected: [{ "id": 1, ... }]
```

- [ ] **Step 3: Configurar secrets en Cloudflare y deployar Worker**

```bash
npx wrangler secret put ADMIN_USER
# Ingresar: analia

npx wrangler secret put ADMIN_PASS
# Ingresar: (contraseña real elegida)

npx wrangler secret put JWT_SECRET
# Ingresar: (string aleatorio largo, ej: openssl rand -base64 32)

npx wrangler deploy
```

Anotar la URL del Worker desplegado (ej: `https://cosmetologa-analia-velazco-api.ACCOUNT.workers.dev`).

- [ ] **Step 4: Probar Worker remoto**

```bash
curl https://cosmetologa-analia-velazco-api.ACCOUNT.workers.dev/api/services
# Expected: { "facial": [...], ... } con los 40 servicios
```

- [ ] **Step 5: Commit**

```bash
cd ..
git add worker/src/index.js
git commit -m "feat: worker router completo + deploy"
```

---

## Task 8: Landing — HTML

**Files:**
- Create: `public/index.html`

Reemplazar `WORKER_URL` con la URL real del Worker desplegado en Task 7.

- [ ] **Step 1: Crear public/index.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cosmetóloga Analía Velazco | Rosario</title>
  <meta name="description" content="Cosmetóloga profesional en Rosario. Tratamientos faciales, corporales y servicios de belleza. San Lorenzo 865, Rosario Centro.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- HERO -->
  <section id="hero">
    <div class="hero-content">
      <p class="hero-eyebrow">Cosmetóloga Profesional</p>
      <h1>Analía Velazco</h1>
      <p class="hero-tagline">Cuidado de la piel con ciencia, precisión y amor por cada cliente</p>
      <div class="hero-ctas">
        <a href="https://wa.me/5493413873766" target="_blank" rel="noopener" class="btn btn-primary">
          Turno con Analía
        </a>
        <a href="https://wa.me/5493413888285" target="_blank" rel="noopener" class="btn btn-secondary">
          Turno con Karina
        </a>
      </div>
    </div>
  </section>

  <!-- PROMOCIONES DEL MES -->
  <section id="promociones">
    <div class="container">
      <h2>Promociones del mes</h2>
      <div id="promos-grid" class="promos-grid">
        <!-- Cargado dinámicamente desde JS -->
        <div class="loading">Cargando promociones...</div>
      </div>
    </div>
  </section>

  <!-- SERVICIOS -->
  <section id="servicios">
    <div class="container">
      <h2>Servicios</h2>
      <div id="servicios-container">
        <!-- Cargado dinámicamente desde JS -->
        <div class="loading">Cargando servicios...</div>
      </div>
    </div>
  </section>

  <!-- SOBRE MÍ -->
  <section id="sobre-mi">
    <div class="container sobre-mi-inner">
      <div class="sobre-mi-text">
        <h2>Sobre mí</h2>
        <p>Soy Analía Velazco, cosmetóloga profesional con pasión por el cuidado de la piel. Descubrí esta profesión y supe que era mi lugar en el mundo.</p>
        <p>Mi misión es que cada persona que llegue al consultorio se vaya sintiéndose mejor, no solo por fuera, sino por dentro también. Cada paciente es el amor de alguien.</p>
        <p>Trabajo con técnicas actualizadas y productos de alta calidad para ofrecerte tratamientos seguros y resultados reales desde la primera sesión.</p>
      </div>
      <div class="sobre-mi-img">
        <!-- Foto se agrega cuando esté disponible -->
        <div class="img-placeholder"></div>
      </div>
    </div>
  </section>

  <!-- UBICACIÓN -->
  <section id="ubicacion">
    <div class="container">
      <h2>Dónde encontrarnos</h2>
      <p class="ubicacion-address">San Lorenzo 865, Rosario Centro</p>
      <div class="mapa-wrapper">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.!2d-60.6505!3d-32.9477!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSan+Lorenzo+865%2C+Rosario!5e0!3m2!1ses!2sar!4v1"
          width="100%" height="400" style="border:0;" allowfullscreen loading="lazy"
          referrerpolicy="no-referrer-when-downgrade" title="Ubicación consultorio">
        </iframe>
      </div>
    </div>
  </section>

  <!-- CONTACTO -->
  <section id="contacto">
    <div class="container">
      <h2>Contacto</h2>
      <p class="contacto-horario">Lunes a sábado · Solo con turno previo</p>
      <div class="contacto-btns">
        <a href="https://wa.me/5493413873766" target="_blank" rel="noopener" class="btn btn-primary">
          WhatsApp Analía
        </a>
        <a href="https://wa.me/5493413888285" target="_blank" rel="noopener" class="btn btn-primary">
          WhatsApp Karina
        </a>
        <a href="https://instagram.com/cosmetologaanaliavelazco" target="_blank" rel="noopener" class="btn btn-secondary">
          Instagram
        </a>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer>
    <div class="container">
      <p>Cosmetóloga Analía Velazco · San Lorenzo 865, Rosario</p>
      <p>
        <a href="https://instagram.com/cosmetologaanaliavelazco" target="_blank" rel="noopener">@cosmetologaanaliavelazco</a>
      </p>
    </div>
  </footer>

  <script>
    const WORKER_URL = 'https://cosmetologa-analia-velazco-api.ACCOUNT.workers.dev'
  </script>
  <script src="js/main.js"></script>
</body>
</html>
```

**Nota:** El embed de Google Maps requiere que ajustes las coordenadas exactas. Buscá "San Lorenzo 865 Rosario" en Google Maps, copiá el iframe embed desde "Compartir → Insertar mapa" y reemplazá el `src` del iframe.

- [ ] **Step 2: Commit**

```bash
git add public/index.html
git commit -m "feat: landing HTML estructura completa 7 secciones"
```

---

## Task 9: Landing — CSS

**Files:**
- Create: `public/css/style.css`

- [ ] **Step 1: Crear public/css/style.css**

```css
/* =====================
   Variables y reset
   ===================== */
:root {
  --rosa: #D4A5B5;
  --rosa-claro: #F5EEF1;
  --negro: #1A1A1A;
  --gris: #6B6B6B;
  --blanco: #FFFFFF;
  --crema: #FDF8F5;
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --max-width: 1100px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: var(--font-sans);
  color: var(--negro);
  background: var(--blanco);
  line-height: 1.6;
}

/* =====================
   Utilidades
   ===================== */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
}

h2 {
  font-family: var(--font-serif);
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 400;
  margin-bottom: 48px;
  text-align: center;
}

.loading {
  text-align: center;
  color: var(--gris);
  padding: 48px 0;
  font-size: 0.9rem;
}

/* =====================
   Botones
   ===================== */
.btn {
  display: inline-block;
  padding: 14px 32px;
  border-radius: 2px;
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-decoration: none;
  text-transform: uppercase;
  transition: opacity 0.2s;
  cursor: pointer;
}
.btn:hover { opacity: 0.85; }

.btn-primary {
  background: var(--rosa);
  color: var(--blanco);
  border: 2px solid var(--rosa);
}
.btn-secondary {
  background: transparent;
  color: var(--negro);
  border: 2px solid var(--negro);
}

/* =====================
   Hero
   ===================== */
#hero {
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--crema);
  text-align: center;
  padding: 80px 24px;
}

.hero-eyebrow {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--rosa);
  margin-bottom: 16px;
}

#hero h1 {
  font-family: var(--font-serif);
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 400;
  line-height: 1.1;
  margin-bottom: 24px;
}

.hero-tagline {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: var(--gris);
  max-width: 500px;
  margin: 0 auto 40px;
  font-weight: 300;
}

.hero-ctas {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* =====================
   Promociones
   ===================== */
#promociones {
  padding: 100px 0;
  background: var(--blanco);
}

.promos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.promo-card {
  border: 1px solid #E8E0E4;
  padding: 32px;
  background: var(--rosa-claro);
  position: relative;
}

.promo-badge {
  position: absolute;
  top: -12px;
  left: 24px;
  background: var(--rosa);
  color: var(--blanco);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 12px;
}

.promo-card h3 {
  font-family: var(--font-serif);
  font-size: 1.3rem;
  font-weight: 400;
  margin-bottom: 12px;
}

.promo-card p {
  color: var(--gris);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.promo-precio {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.promo-precio .precio-nuevo {
  font-family: var(--font-serif);
  font-size: 1.8rem;
  color: var(--negro);
}

.promo-precio .precio-original {
  font-size: 0.85rem;
  color: var(--gris);
  text-decoration: line-through;
}

/* =====================
   Servicios
   ===================== */
#servicios {
  padding: 100px 0;
  background: var(--crema);
}

.categoria-bloque {
  margin-bottom: 64px;
}

.categoria-bloque:last-child { margin-bottom: 0; }

.categoria-titulo {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  font-weight: 400;
  font-style: italic;
  color: var(--rosa);
  border-bottom: 1px solid #E0D4DA;
  padding-bottom: 12px;
  margin-bottom: 24px;
}

.servicios-lista {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1px;
  background: #E0D4DA;
}

.servicio-item {
  background: var(--crema);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.servicio-info { flex: 1; }

.servicio-nombre {
  font-weight: 500;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.servicio-descripcion {
  font-size: 0.8rem;
  color: var(--gris);
  line-height: 1.4;
}

.servicio-precio {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  white-space: nowrap;
  flex-shrink: 0;
}

/* =====================
   Sobre mí
   ===================== */
#sobre-mi {
  padding: 100px 0;
  background: var(--blanco);
}

.sobre-mi-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}

.sobre-mi-text h2 { text-align: left; margin-bottom: 24px; }

.sobre-mi-text p {
  color: var(--gris);
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.img-placeholder {
  width: 100%;
  aspect-ratio: 3/4;
  background: var(--rosa-claro);
}

@media (max-width: 768px) {
  .sobre-mi-inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .sobre-mi-img { order: -1; }
  .img-placeholder { aspect-ratio: 4/3; }
}

/* =====================
   Ubicación
   ===================== */
#ubicacion {
  padding: 100px 0;
  background: var(--crema);
}

.ubicacion-address {
  text-align: center;
  font-family: var(--font-serif);
  font-size: 1.2rem;
  margin-bottom: 40px;
  color: var(--gris);
}

.mapa-wrapper {
  border: 1px solid #E0D4DA;
  overflow: hidden;
}

/* =====================
   Contacto
   ===================== */
#contacto {
  padding: 100px 0;
  background: var(--negro);
  text-align: center;
}

#contacto h2 {
  color: var(--blanco);
  margin-bottom: 16px;
}

.contacto-horario {
  color: var(--rosa);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 48px;
}

.contacto-btns {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

#contacto .btn-primary {
  background: var(--rosa);
  border-color: var(--rosa);
}

#contacto .btn-secondary {
  color: var(--blanco);
  border-color: var(--blanco);
}

/* =====================
   Footer
   ===================== */
footer {
  background: var(--negro);
  border-top: 1px solid #2A2A2A;
  padding: 32px 0;
  text-align: center;
}

footer p {
  font-size: 0.8rem;
  color: var(--gris);
  margin-bottom: 4px;
}

footer a {
  color: var(--rosa);
  text-decoration: none;
}

/* =====================
   Responsive
   ===================== */
@media (max-width: 600px) {
  .hero-ctas { flex-direction: column; align-items: center; }
  .contacto-btns { flex-direction: column; align-items: center; }
  .servicios-lista { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Verificar preview local**

```bash
cd ..
python3 -m http.server 8080 --directory public
```

Abrir http://localhost:8080 y verificar: hero visible, secciones con espacio, paleta de colores rosa/blanco/negro correcta.

- [ ] **Step 3: Commit**

```bash
git add public/css/style.css
git commit -m "feat: landing CSS — paleta rosa, tipografía serif, responsive"
```

---

## Task 10: Landing — JavaScript (carga dinámica)

**Files:**
- Create: `public/js/main.js`

- [ ] **Step 1: Crear public/js/main.js**

```javascript
// public/js/main.js
// WORKER_URL está definido en index.html como variable global

const CATEGORY_LABELS = {
  facial: 'Tratamientos Faciales',
  corporal: 'Tratamientos Corporales',
  servicios: 'Servicios'
}

function formatPrice(price, label) {
  if (label) return label
  return '$' + price.toLocaleString('es-AR')
}

function renderPromos(promos) {
  const grid = document.getElementById('promos-grid')
  if (!promos.length) {
    grid.innerHTML = '<p class="loading">Sin promociones activas este mes.</p>'
    return
  }
  grid.innerHTML = promos.map(p => `
    <div class="promo-card">
      <span class="promo-badge">Promo del mes</span>
      <h3>${p.title}</h3>
      <p>${p.description || ''}</p>
      <div class="promo-precio">
        <span class="precio-nuevo">${formatPrice(p.promo_price)}</span>
        ${p.original_price ? `<span class="precio-original">${formatPrice(p.original_price)}</span>` : ''}
      </div>
    </div>
  `).join('')
}

function renderServicios(data) {
  const container = document.getElementById('servicios-container')
  const order = ['facial', 'corporal', 'servicios']
  container.innerHTML = order
    .filter(cat => data[cat]?.length)
    .map(cat => `
      <div class="categoria-bloque">
        <h3 class="categoria-titulo">${CATEGORY_LABELS[cat]}</h3>
        <div class="servicios-lista">
          ${data[cat].map(s => `
            <div class="servicio-item">
              <div class="servicio-info">
                <div class="servicio-nombre">${s.name}</div>
                ${s.description ? `<div class="servicio-descripcion">${s.description}</div>` : ''}
              </div>
              <div class="servicio-precio">${formatPrice(s.price, s.price_label)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')
}

async function init() {
  try {
    const [promos, servicios] = await Promise.all([
      fetch(`${WORKER_URL}/api/promotions`).then(r => r.json()),
      fetch(`${WORKER_URL}/api/services`).then(r => r.json())
    ])
    renderPromos(promos)
    renderServicios(servicios)
  } catch (e) {
    console.error('Error cargando datos:', e)
    document.getElementById('promos-grid').innerHTML =
      '<p class="loading">Error al cargar promociones.</p>'
    document.getElementById('servicios-container').innerHTML =
      '<p class="loading">Error al cargar servicios.</p>'
  }
}

init()
```

- [ ] **Step 2: Actualizar WORKER_URL en index.html con la URL real**

Editar `public/index.html`, reemplazar:
```html
<script>
  const WORKER_URL = 'https://cosmetologa-analia-velazco-api.ACCOUNT.workers.dev'
</script>
```
Con la URL real del Worker desplegado en Task 7.

- [ ] **Step 3: Verificar en el navegador con Worker corriendo**

```bash
cd worker && npx wrangler dev --local
# En otra terminal:
python3 -m http.server 8080 --directory ../public
```

Abrir http://localhost:8080, verificar que las secciones de servicios y promociones cargan correctamente.

- [ ] **Step 4: Commit**

```bash
cd ..
git add public/js/main.js public/index.html
git commit -m "feat: landing JS — carga dinámica servicios y promos desde API"
```

---

## Task 11: Admin — HTML y CSS

**Files:**
- Create: `public/admin/index.html` (login)
- Create: `public/admin/dashboard.html` (panel)
- Create: `public/css/admin.css`

- [ ] **Step 1: Crear public/admin/index.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Cosmetóloga Analía Velazco</title>
  <link rel="stylesheet" href="../css/admin.css">
</head>
<body class="login-page">
  <div class="login-card">
    <h1>Panel Admin</h1>
    <p class="login-subtitle">Cosmetóloga Analía Velazco</p>
    <form id="login-form">
      <div class="field">
        <label for="username">Usuario</label>
        <input type="text" id="username" name="username" autocomplete="username" required>
      </div>
      <div class="field">
        <label for="password">Contraseña</label>
        <input type="password" id="password" name="password" autocomplete="current-password" required>
      </div>
      <div id="error-msg" class="error-msg" hidden></div>
      <button type="submit" class="btn-admin">Ingresar</button>
    </form>
  </div>
  <script>
    const WORKER_URL = 'https://cosmetologa-analia-velazco-api.ACCOUNT.workers.dev'
  </script>
  <script src="../js/admin-login.js"></script>
</body>
</html>
```

- [ ] **Step 2: Crear public/admin/dashboard.html**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard — Admin</title>
  <link rel="stylesheet" href="../css/admin.css">
</head>
<body>
  <header class="admin-header">
    <h1>Panel Admin</h1>
    <button id="logout-btn" class="btn-logout">Cerrar sesión</button>
  </header>

  <main class="admin-main">
    <!-- TABS -->
    <div class="tabs">
      <button class="tab active" data-tab="servicios">Servicios</button>
      <button class="tab" data-tab="promociones">Promociones</button>
    </div>

    <!-- TAB SERVICIOS -->
    <div id="tab-servicios" class="tab-content active">
      <div class="section-header">
        <h2>Servicios</h2>
        <button id="add-servicio-btn" class="btn-admin">+ Nuevo servicio</button>
      </div>

      <div class="filter-bar">
        <label>Filtrar:
          <select id="filtro-categoria">
            <option value="">Todas las categorías</option>
            <option value="facial">Tratamientos Faciales</option>
            <option value="corporal">Tratamientos Corporales</option>
            <option value="servicios">Servicios</option>
          </select>
        </label>
      </div>

      <div id="servicios-form-container" class="form-container" hidden>
        <h3 id="servicio-form-title">Nuevo servicio</h3>
        <form id="servicio-form">
          <input type="hidden" id="servicio-id">
          <div class="form-grid">
            <div class="field">
              <label>Nombre *</label>
              <input type="text" id="s-name" required>
            </div>
            <div class="field">
              <label>Categoría *</label>
              <select id="s-category" required>
                <option value="">Seleccionar</option>
                <option value="facial">Tratamientos Faciales</option>
                <option value="corporal">Tratamientos Corporales</option>
                <option value="servicios">Servicios</option>
              </select>
            </div>
            <div class="field">
              <label>Precio (en pesos, sin puntos) *</label>
              <input type="number" id="s-price" min="0" required>
            </div>
            <div class="field">
              <label>Etiqueta de precio (opcional, ej: "desde $35.000")</label>
              <input type="text" id="s-price-label" placeholder="Dejar vacío para mostrar el precio automáticamente">
            </div>
            <div class="field field-full">
              <label>Descripción</label>
              <textarea id="s-description" rows="3"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-admin">Guardar</button>
            <button type="button" id="cancel-servicio" class="btn-cancel">Cancelar</button>
          </div>
          <div id="servicio-error" class="error-msg" hidden></div>
        </form>
      </div>

      <table id="servicios-table" class="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="servicios-tbody">
          <tr><td colspan="5" class="loading">Cargando...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- TAB PROMOCIONES -->
    <div id="tab-promociones" class="tab-content">
      <div class="section-header">
        <h2>Promociones</h2>
        <button id="add-promo-btn" class="btn-admin">+ Nueva promoción</button>
      </div>

      <div id="promos-form-container" class="form-container" hidden>
        <h3 id="promo-form-title">Nueva promoción</h3>
        <form id="promo-form">
          <input type="hidden" id="promo-id">
          <div class="form-grid">
            <div class="field">
              <label>Título *</label>
              <input type="text" id="p-title" required>
            </div>
            <div class="field">
              <label>Precio promocional (en pesos) *</label>
              <input type="number" id="p-promo-price" min="0" required>
            </div>
            <div class="field">
              <label>Precio original (opcional)</label>
              <input type="number" id="p-original-price" min="0">
            </div>
            <div class="field field-full">
              <label>Descripción</label>
              <textarea id="p-description" rows="3"></textarea>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-admin">Guardar</button>
            <button type="button" id="cancel-promo" class="btn-cancel">Cancelar</button>
          </div>
          <div id="promo-error" class="error-msg" hidden></div>
        </form>
      </div>

      <div id="promos-limit-warning" class="warning-msg" hidden>
        ⚠️ Hay 3 promociones activas. Desactivá una antes de activar otra.
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Precio promo</th>
            <th>Precio original</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="promos-tbody">
          <tr><td colspan="5" class="loading">Cargando...</td></tr>
        </tbody>
      </table>
    </div>
  </main>

  <script>
    const WORKER_URL = 'https://cosmetologa-analia-velazco-api.ACCOUNT.workers.dev'
  </script>
  <script src="../js/admin-dashboard.js"></script>
</body>
</html>
```

- [ ] **Step 3: Crear public/css/admin.css**

```css
/* admin.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, sans-serif;
  font-size: 14px;
  color: #1A1A1A;
  background: #F5F5F5;
}

/* Login */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background: white;
  padding: 40px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.login-card h1 { font-size: 1.4rem; margin-bottom: 4px; }
.login-subtitle { color: #888; margin-bottom: 28px; font-size: 0.85rem; }

/* Admin layout */
.admin-header {
  background: #1A1A1A;
  color: white;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.admin-header h1 { font-size: 1rem; font-weight: 500; }

.admin-main { max-width: 1200px; margin: 0 auto; padding: 24px; }

/* Tabs */
.tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 2px solid #E0E0E0; }

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  color: #888;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab.active { color: #D4A5B5; border-bottom-color: #D4A5B5; font-weight: 500; }

.tab-content { display: none; }
.tab-content.active { display: block; }

/* Section header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-header h2 { font-size: 1.1rem; font-weight: 600; }

/* Filter bar */
.filter-bar { margin-bottom: 16px; }
.filter-bar select { margin-left: 8px; padding: 4px 8px; }

/* Forms */
.form-container {
  background: white;
  border: 1px solid #E0E0E0;
  padding: 24px;
  margin-bottom: 20px;
}

.form-container h3 { font-size: 0.95rem; margin-bottom: 20px; color: #555; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.field-full { grid-column: 1 / -1; }

.field { display: flex; flex-direction: column; gap: 6px; }

.field label { font-size: 0.8rem; color: #555; font-weight: 500; }

.field input, .field select, .field textarea {
  padding: 8px 12px;
  border: 1px solid #D0D0D0;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
}

.field input:focus, .field select:focus, .field textarea:focus {
  border-color: #D4A5B5;
}

.form-actions { display: flex; gap: 12px; }

/* Buttons */
.btn-admin {
  padding: 8px 20px;
  background: #D4A5B5;
  color: white;
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
}
.btn-admin:hover { background: #C4859A; }

.btn-cancel {
  padding: 8px 20px;
  background: none;
  border: 1px solid #D0D0D0;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-logout {
  padding: 6px 14px;
  background: none;
  border: 1px solid #555;
  color: #CCC;
  font-size: 0.8rem;
  cursor: pointer;
}

/* Table */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.admin-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  border-bottom: 2px solid #E0E0E0;
}

.admin-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #F0F0F0;
  vertical-align: middle;
}

.admin-table tr:hover td { background: #FAFAFA; }

/* Status badges */
.badge-active { color: #2E7D32; font-size: 0.75rem; font-weight: 500; }
.badge-inactive { color: #999; font-size: 0.75rem; }

/* Action buttons */
.btn-edit { color: #555; background: none; border: 1px solid #CCC; padding: 4px 10px; cursor: pointer; font-size: 0.8rem; margin-right: 4px; }
.btn-toggle { color: #555; background: none; border: 1px solid #CCC; padding: 4px 10px; cursor: pointer; font-size: 0.8rem; margin-right: 4px; }
.btn-delete { color: #C62828; background: none; border: 1px solid #FFCDD2; padding: 4px 10px; cursor: pointer; font-size: 0.8rem; }

/* Messages */
.error-msg { color: #C62828; font-size: 0.85rem; margin-top: 12px; padding: 8px 12px; background: #FFEBEE; }
.warning-msg { color: #E65100; background: #FFF3E0; padding: 10px 16px; margin-bottom: 16px; font-size: 0.85rem; }
.loading { color: #888; text-align: center; padding: 24px; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 4: Commit**

```bash
git add public/admin/ public/css/admin.css
git commit -m "feat: admin HTML (login + dashboard) y CSS"
```

---

## Task 12: Admin — JavaScript login y servicios

**Files:**
- Create: `public/js/admin-login.js`
- Create: `public/js/admin-dashboard.js` (servicios tab)

- [ ] **Step 1: Crear public/js/admin-login.js**

```javascript
// public/js/admin-login.js
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const errorEl = document.getElementById('error-msg')
  errorEl.hidden = true

  const username = document.getElementById('username').value.trim()
  const password = document.getElementById('password').value

  try {
    const res = await fetch(`${WORKER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
    localStorage.setItem('admin_token', data.token)
    window.location.href = 'dashboard.html'
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.hidden = false
  }
})

// Redirigir al dashboard si ya está logueado
if (localStorage.getItem('admin_token')) {
  window.location.href = 'dashboard.html'
}
```

- [ ] **Step 2: Crear public/js/admin-dashboard.js**

```javascript
// public/js/admin-dashboard.js

// --- Auth guard ---
const token = localStorage.getItem('admin_token')
if (!token) window.location.href = 'index.html'

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
}

function formatPrice(price) {
  return '$' + Number(price).toLocaleString('es-AR')
}

// --- Logout ---
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('admin_token')
  window.location.href = 'index.html'
})

// --- Tabs ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active')
  })
})

// ============================================================
// SERVICIOS
// ============================================================
let servicios = []

async function loadServicios() {
  const res = await fetch(`${WORKER_URL}/api/admin/services`, { headers: authHeaders() })
  if (res.status === 401) { localStorage.removeItem('admin_token'); window.location.href = 'index.html'; return }
  servicios = await res.json()
  renderServiciosTable()
}

function renderServiciosTable() {
  const filtro = document.getElementById('filtro-categoria').value
  const tbody = document.getElementById('servicios-tbody')
  const filtered = filtro ? servicios.filter(s => s.category === filtro) : servicios

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Sin servicios.</td></tr>'
    return
  }

  const LABELS = { facial: 'Facial', corporal: 'Corporal', servicios: 'Servicios' }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td>${s.name}${s.description ? `<br><small style="color:#888">${s.description.substring(0, 60)}${s.description.length > 60 ? '…' : ''}</small>` : ''}</td>
      <td>${LABELS[s.category] || s.category}</td>
      <td>${s.price_label || formatPrice(s.price)}</td>
      <td><span class="${s.active ? 'badge-active' : 'badge-inactive'}">${s.active ? 'Visible' : 'Oculto'}</span></td>
      <td>
        <button class="btn-edit" onclick="editServicio(${s.id})">Editar</button>
        <button class="btn-toggle" onclick="toggleServicio(${s.id})">${s.active ? 'Ocultar' : 'Mostrar'}</button>
        <button class="btn-delete" onclick="deleteServicio(${s.id})">Eliminar</button>
      </td>
    </tr>
  `).join('')
}

document.getElementById('filtro-categoria').addEventListener('change', renderServiciosTable)

// Formulario nuevo servicio
document.getElementById('add-servicio-btn').addEventListener('click', () => {
  document.getElementById('servicio-form-title').textContent = 'Nuevo servicio'
  document.getElementById('servicio-id').value = ''
  document.getElementById('servicio-form').reset()
  document.getElementById('servicios-form-container').hidden = false
  document.getElementById('servicios-form-container').scrollIntoView({ behavior: 'smooth' })
})

document.getElementById('cancel-servicio').addEventListener('click', () => {
  document.getElementById('servicios-form-container').hidden = true
})

window.editServicio = function(id) {
  const s = servicios.find(x => x.id === id)
  if (!s) return
  document.getElementById('servicio-form-title').textContent = 'Editar servicio'
  document.getElementById('servicio-id').value = s.id
  document.getElementById('s-name').value = s.name
  document.getElementById('s-category').value = s.category
  document.getElementById('s-price').value = s.price
  document.getElementById('s-price-label').value = s.price_label || ''
  document.getElementById('s-description').value = s.description || ''
  document.getElementById('servicios-form-container').hidden = false
  document.getElementById('servicios-form-container').scrollIntoView({ behavior: 'smooth' })
}

document.getElementById('servicio-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const errorEl = document.getElementById('servicio-error')
  errorEl.hidden = true

  const id = document.getElementById('servicio-id').value
  const body = {
    name: document.getElementById('s-name').value.trim(),
    category: document.getElementById('s-category').value,
    price: parseInt(document.getElementById('s-price').value),
    price_label: document.getElementById('s-price-label').value.trim() || null,
    description: document.getElementById('s-description').value.trim()
  }

  try {
    const url = id ? `${WORKER_URL}/api/services/${id}` : `${WORKER_URL}/api/services`
    const method = id ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    document.getElementById('servicios-form-container').hidden = true
    await loadServicios()
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.hidden = false
  }
})

window.toggleServicio = async function(id) {
  await fetch(`${WORKER_URL}/api/services/${id}/toggle`, { method: 'PATCH', headers: authHeaders() })
  await loadServicios()
}

window.deleteServicio = async function(id) {
  const s = servicios.find(x => x.id === id)
  if (!confirm(`¿Eliminar "${s?.name}"? Esta acción no se puede deshacer.`)) return
  await fetch(`${WORKER_URL}/api/services/${id}`, { method: 'DELETE', headers: authHeaders() })
  await loadServicios()
}

// ============================================================
// PROMOCIONES
// ============================================================
let promos = []

async function loadPromos() {
  const res = await fetch(`${WORKER_URL}/api/admin/promotions`, { headers: authHeaders() })
  promos = await res.json()
  renderPromosTable()
}

function renderPromosTable() {
  const activeCount = promos.filter(p => p.active).length
  document.getElementById('promos-limit-warning').hidden = activeCount < 3

  const tbody = document.getElementById('promos-tbody')
  if (!promos.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Sin promociones.</td></tr>'
    return
  }
  tbody.innerHTML = promos.map(p => `
    <tr>
      <td>${p.title}${p.description ? `<br><small style="color:#888">${p.description.substring(0, 60)}${p.description.length > 60 ? '…' : ''}</small>` : ''}</td>
      <td>${formatPrice(p.promo_price)}</td>
      <td>${p.original_price ? formatPrice(p.original_price) : '—'}</td>
      <td><span class="${p.active ? 'badge-active' : 'badge-inactive'}">${p.active ? 'Activa' : 'Inactiva'}</span></td>
      <td>
        <button class="btn-edit" onclick="editPromo(${p.id})">Editar</button>
        <button class="btn-toggle" onclick="togglePromo(${p.id})">${p.active ? 'Desactivar' : 'Activar'}</button>
        <button class="btn-delete" onclick="deletePromo(${p.id})">Eliminar</button>
      </td>
    </tr>
  `).join('')
}

document.getElementById('add-promo-btn').addEventListener('click', () => {
  document.getElementById('promo-form-title').textContent = 'Nueva promoción'
  document.getElementById('promo-id').value = ''
  document.getElementById('promo-form').reset()
  document.getElementById('promos-form-container').hidden = false
  document.getElementById('promos-form-container').scrollIntoView({ behavior: 'smooth' })
})

document.getElementById('cancel-promo').addEventListener('click', () => {
  document.getElementById('promos-form-container').hidden = true
})

window.editPromo = function(id) {
  const p = promos.find(x => x.id === id)
  if (!p) return
  document.getElementById('promo-form-title').textContent = 'Editar promoción'
  document.getElementById('promo-id').value = p.id
  document.getElementById('p-title').value = p.title
  document.getElementById('p-promo-price').value = p.promo_price
  document.getElementById('p-original-price').value = p.original_price || ''
  document.getElementById('p-description').value = p.description || ''
  document.getElementById('promos-form-container').hidden = false
  document.getElementById('promos-form-container').scrollIntoView({ behavior: 'smooth' })
}

document.getElementById('promo-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const errorEl = document.getElementById('promo-error')
  errorEl.hidden = true

  const id = document.getElementById('promo-id').value
  const originalPrice = document.getElementById('p-original-price').value
  const body = {
    title: document.getElementById('p-title').value.trim(),
    promo_price: parseInt(document.getElementById('p-promo-price').value),
    original_price: originalPrice ? parseInt(originalPrice) : null,
    description: document.getElementById('p-description').value.trim()
  }

  try {
    const url = id ? `${WORKER_URL}/api/promotions/${id}` : `${WORKER_URL}/api/promotions`
    const method = id ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    document.getElementById('promos-form-container').hidden = true
    await loadPromos()
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.hidden = false
  }
})

window.togglePromo = async function(id) {
  const res = await fetch(`${WORKER_URL}/api/promotions/${id}/toggle`, { method: 'PATCH', headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) { alert(data.error); return }
  await loadPromos()
}

window.deletePromo = async function(id) {
  const p = promos.find(x => x.id === id)
  if (!confirm(`¿Eliminar "${p?.title}"?`)) return
  await fetch(`${WORKER_URL}/api/promotions/${id}`, { method: 'DELETE', headers: authHeaders() })
  await loadPromos()
}

// --- Init ---
loadServicios()
loadPromos()
```

- [ ] **Step 3: Actualizar WORKER_URL en admin/index.html y admin/dashboard.html** con la URL real del Worker.

- [ ] **Step 4: Probar flujo completo del admin**

```bash
# Con wrangler dev corriendo en worker/ y http.server en public/
# 1. Ir a http://localhost:8080/admin/
# 2. Ingresar credenciales de .dev.vars
# 3. Verificar que redirige a dashboard.html
# 4. En tab Servicios: crear un servicio nuevo, editarlo, ocultarlo
# 5. En tab Promociones: crear 3 promos, verificar warning al intentar crear la 4ta
# 6. Cerrar sesión, verificar que redirige al login
```

- [ ] **Step 5: Commit**

```bash
git add public/js/admin-login.js public/js/admin-dashboard.js
git commit -m "feat: admin JS — login, CRUD servicios y promos con auth"
```

---

## Task 13: Deploy final y smoke test

- [ ] **Step 1: Aplicar seed a D1 remoto (si no se hizo en Task 3)**

```bash
cd worker
npx wrangler d1 execute cosmetologa-analia-velazco --remote --file=../db/seed.sql
```

- [ ] **Step 2: Verificar que el Worker remoto responde con los servicios**

```bash
curl https://cosmetologa-analia-velazco-api.ACCOUNT.workers.dev/api/services | python3 -m json.tool | head -30
```

Expected: JSON con las tres categorías y sus servicios.

- [ ] **Step 3: Crear proyecto en Cloudflare Pages y deployar**

```bash
cd ..
wrangler pages deploy public --project-name cosmetologa-analia-velazco --commit-dirty=true
```

La primera vez pedirá crear el proyecto. Anotar la URL resultante (ej: `https://cosmetologa-analia-velazco.pages.dev`).

- [ ] **Step 4: Actualizar WORKER_URL en los 3 archivos HTML con la URL de producción**

Editar los `<script>` al final de:
- `public/index.html`
- `public/admin/index.html`
- `public/admin/dashboard.html`

Reemplazar `ACCOUNT` con el valor real del Worker URL.

- [ ] **Step 5: Deploy final con URLs correctas**

```bash
wrangler pages deploy public --project-name cosmetologa-analia-velazco --commit-dirty=true
```

- [ ] **Step 6: Smoke test completo en producción**

```
□ Landing carga con servicios agrupados por categoría
□ Sección promociones visible (puede estar vacía o con promos de prueba)
□ Mapa de Google Maps visible (ajustar embed si es necesario)
□ Botón "Turno con Analía" abre WhatsApp con el número correcto
□ Botón "Turno con Karina" abre WhatsApp con el número correcto
□ Link Instagram abre @cosmetologaanaliavelazco
□ /admin/ redirige al login
□ Login con credenciales correctas lleva al dashboard
□ Login con credenciales incorrectas muestra error
□ Crear, editar y ocultar un servicio en el dashboard
□ Crear una promoción y verificar que aparece en la landing
□ Cerrar sesión
```

- [ ] **Step 7: Commit final**

```bash
git add .
git commit -m "feat: deploy producción — landing + admin cosmetóloga Analía Velazco"
```

---

## Notas post-deploy

- **Mapa Google Maps:** buscar "San Lorenzo 865 Rosario" en Google Maps → Compartir → Insertar mapa → copiar el `src` del iframe y reemplazar el placeholder en `index.html`.
- **Foto de Analía:** cuando esté disponible, agregar en `public/img/`, reemplazar `.img-placeholder` en `index.html` con `<img src="img/foto-analia.jpg" alt="Analía Velazco">` y ajustar el CSS.
- **Dominio custom:** si Analía tiene dominio, configurar en Cloudflare Pages → Custom domains. Actualizar luego el WORKER_URL en los HTML si el Worker también tiene dominio custom, y reemplazar `Access-Control-Allow-Origin: *` con el dominio específico.
- **CORS en producción:** para mayor seguridad, reemplazar `'*'` en el Worker por la URL exacta del Pages project.
