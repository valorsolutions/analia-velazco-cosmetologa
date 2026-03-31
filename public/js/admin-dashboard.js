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

// ============================================================
// UI UTILS (MODALS & TOASTS)
// ============================================================

function openModal(id) {
  const modal = document.getElementById(id)
  if (!modal) return
  modal.classList.add('active')
  document.body.style.overflow = 'hidden'
}

function closeModal(id) {
  const modal = document.getElementById(id)
  if (!modal) return
  modal.classList.remove('active')
  document.body.style.overflow = ''
}

// Close modals on clicking overlay or cancel buttons
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal(e.target.id)
  }
  if (e.target.classList.contains('btn-close-modal')) {
    const modal = e.target.closest('.modal-overlay')
    if (modal) closeModal(modal.id)
  }
})

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container')
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close">&times;</button>
  `
  container.appendChild(toast)
  
  // Animate in
  setTimeout(() => toast.classList.add('active'), 10)
  
  const close = () => {
    toast.classList.remove('active')
    setTimeout(() => toast.remove(), 400)
  }
  
  toast.querySelector('.toast-close').onclick = close
  setTimeout(close, 4000)
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

document.getElementById('add-servicio-btn').addEventListener('click', () => {
  document.getElementById('servicio-form-title').textContent = 'Nuevo servicio'
  document.getElementById('servicio-id').value = ''
  document.getElementById('servicio-form').reset()
  document.getElementById('servicio-error').hidden = true
  openModal('modal-servicio')
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
  document.getElementById('servicio-error').hidden = true
  openModal('modal-servicio')
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
    
    closeModal('modal-servicio')
    showToast(id ? 'Servicio actualizado' : 'Servicio creado con éxito')
    await loadServicios()
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.hidden = false
  }
})

window.toggleServicio = async function(id) {
  await fetch(`${WORKER_URL}/api/services/${id}/toggle`, { method: 'PATCH', headers: authHeaders() })
  showToast('Estado cambiado')
  await loadServicios()
}

window.deleteServicio = async function(id) {
  const s = servicios.find(x => x.id === id)
  if (!confirm(`¿Eliminar "${s?.name}"?`)) return
  await fetch(`${WORKER_URL}/api/services/${id}`, { method: 'DELETE', headers: authHeaders() })
  showToast('Servicio eliminado', 'error')
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
  document.getElementById('promo-error').hidden = true
  openModal('modal-promo')
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
  document.getElementById('promo-error').hidden = true
  openModal('modal-promo')
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
    
    closeModal('modal-promo')
    showToast(id ? 'Promoción actualizada' : 'Promoción creada')
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
  showToast('Estado de promoción cambiado')
  await loadPromos()
}

window.deletePromo = async function(id) {
  const p = promos.find(x => x.id === id)
  if (!confirm(`¿Eliminar "${p?.title}"?`)) return
  await fetch(`${WORKER_URL}/api/promotions/${id}`, { method: 'DELETE', headers: authHeaders() })
  showToast('Promoción eliminada', 'error')
  await loadPromos()
}

// ============================================================
// GIFT CARDS
// ============================================================
let giftcards = []

async function loadGiftCards() {
  const res = await fetch(`${WORKER_URL}/api/admin/giftcards`, { headers: authHeaders() })
  giftcards = await res.json()
  renderGiftCardsTable()
}

function renderGiftCardsTable() {
  const tbody = document.getElementById('giftcards-tbody')
  if (!giftcards.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Sin Gift Cards.</td></tr>'
    return
  }
  tbody.innerHTML = giftcards.map(gc => `
    <tr>
      <td>
        <div class="card-name">${gc.title}</div>
        ${gc.description ? `<div class="card-desc">${gc.description}</div>` : ''}
      </td>
      <td style="display:none"></td>
      <td style="display:none"></td>
      <td style="display:none"></td>
      <td style="display:block; padding:0">
        <div class="card-meta">
          <span class="card-price">${formatPrice(gc.price)}</span>
          <span class="${gc.active ? 'badge-active' : 'badge-inactive'}">${gc.active ? 'Publicado' : 'Borrador'}</span>
        </div>
        <div style="display:flex; gap:8px; padding:12px 16px; flex-wrap:wrap">
          <button class="btn-edit" onclick="editGiftCard(${gc.id})">Editar</button>
          <button class="btn-toggle" onclick="toggleGiftCard(${gc.id})">${gc.active ? 'Ocultar' : 'Mostrar'}</button>
          <button class="btn-delete" onclick="deleteGiftCard(${gc.id})">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('')
}

document.getElementById('add-giftcard-btn').addEventListener('click', () => {
  document.getElementById('giftcard-form-title').textContent = 'Nueva Gift Card'
  document.getElementById('giftcard-id').value = ''
  document.getElementById('giftcard-form').reset()
  document.getElementById('giftcard-error').hidden = true
  openModal('modal-giftcard')
})

window.editGiftCard = function(id) {
  const gc = giftcards.find(x => x.id === id)
  if (!gc) return
  document.getElementById('giftcard-form-title').textContent = 'Editar Gift Card'
  document.getElementById('giftcard-id').value = gc.id
  document.getElementById('gc-title').value = gc.title
  document.getElementById('gc-price').value = gc.price
  document.getElementById('gc-description').value = gc.description || ''
  document.getElementById('giftcard-error').hidden = true
  openModal('modal-giftcard')
}

document.getElementById('giftcard-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const errorEl = document.getElementById('giftcard-error')
  errorEl.hidden = true

  const id = document.getElementById('giftcard-id').value
  const body = {
    title: document.getElementById('gc-title').value.trim(),
    price: parseInt(document.getElementById('gc-price').value),
    description: document.getElementById('gc-description').value.trim()
  }

  try {
    const url = id ? `${WORKER_URL}/api/giftcards/${id}` : `${WORKER_URL}/api/giftcards`
    const method = id ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    closeModal('modal-giftcard')
    showToast(id ? 'Gift Card actualizada' : 'Gift Card creada')
    await loadGiftCards()
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.hidden = false
  }
})

window.toggleGiftCard = async function(id) {
  await fetch(`${WORKER_URL}/api/giftcards/${id}/toggle`, { method: 'PATCH', headers: authHeaders() })
  showToast('Estado de Gift Card cambiado')
  await loadGiftCards()
}

window.deleteGiftCard = async function(id) {
  const gc = giftcards.find(x => x.id === id)
  if (!confirm(`¿Eliminar "${gc?.title}"?`)) return
  await fetch(`${WORKER_URL}/api/giftcards/${id}`, { method: 'DELETE', headers: authHeaders() })
  showToast('Gift Card eliminada', 'error')
  await loadGiftCards()
}

// --- Init ---
loadServicios()
loadPromos()
loadGiftCards()
