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

  const LABELS = { analia: 'Analía', karina: 'Karina' }

  tbody.innerHTML = filtered.map(s => `
    <tr>
      <td>
        <div class="card-name">${s.name}</div>
        ${s.description ? `<div class="card-desc">${s.description}</div>` : ''}
      </td>
      <td style="display:none"></td>
      <td style="display:none"></td>
      <td style="display:none"></td>
      <td style="display:block; padding: 0">
        <div class="card-meta">
          <span class="card-price">${s.price_label || formatPrice(s.price)}</span>
          <span class="${s.active ? 'badge-active' : 'badge-inactive'}">${s.active ? 'Publicado' : 'Borrador'}</span>
        </div>
        <div style="display:flex; gap:8px; padding:12px 16px; flex-wrap:wrap">
          <button class="btn-edit" onclick="editServicio(${s.id})">Editar</button>
          <button class="btn-toggle" onclick="toggleServicio(${s.id})">${s.active ? 'Ocultar' : 'Mostrar'}</button>
          <button class="btn-delete" onclick="deleteServicio(${s.id})">Eliminar</button>
        </div>
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
      <td>
        <div class="card-name">${p.title}</div>
        ${p.description ? `<div class="card-desc">${p.description}</div>` : ''}
      </td>
      <td style="display:none"></td>
      <td style="display:none"></td>
      <td style="display:none"></td>
      <td style="display:block; padding:0">
        <div class="card-meta">
          <div>
            <span class="card-price">${formatPrice(p.promo_price)}</span>
            ${p.original_price ? `<span style="font-size:0.8rem;color:#999;text-decoration:line-through;margin-left:8px">${formatPrice(p.original_price)}</span>` : ''}
          </div>
          <span class="${p.active ? 'badge-active' : 'badge-inactive'}">${p.active ? 'Publicado' : 'Borrador'}</span>
        </div>
        <div style="display:flex; gap:8px; padding:12px 16px; flex-wrap:wrap">
          <button class="btn-edit" onclick="editPromo(${p.id})">Editar</button>
          <button class="btn-toggle" onclick="togglePromo(${p.id})">${p.active ? 'Ocultar' : 'Mostrar'}</button>
          <button class="btn-delete" onclick="deletePromo(${p.id})">Eliminar</button>
        </div>
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
