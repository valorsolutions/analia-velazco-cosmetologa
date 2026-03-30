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
