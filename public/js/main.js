// public/js/main.js
// WORKER_URL está definido en index.html como variable global

const CATEGORY_LABELS = {
  analia: 'Servicios de Analía (Piel, Cejas y Pestañas)',
  karina: 'Servicios de Karina (Manicura, Estética de pies y Masajes)',
}

function formatPrice(price, label) {
  if (label) return label
  return '$' + Number(price).toLocaleString('es-AR')
}

function renderGiftCards(giftcards) {
  const container = document.getElementById('giftcards-container')
  if (!giftcards || !giftcards.length) {
    container.innerHTML = '<p class="loading">Próximamente... Gift Cards disponibles para regalar.</p>'
    return
  }

  container.innerHTML = giftcards.map(gc => {
    const message = encodeURIComponent(`Hola Analía! Quiero comprar la "${gc.title}" ($${gc.price.toLocaleString('es-AR')}) para regalar. Me podrías pasar los datos para el pago?`)
    const waUrl = `https://wa.me/5493413873766?text=${message}`
    
    return `
      <div class="giftcard-card">
        <div class="giftcard-icon">🎁</div>
        <h3>${gc.title}</h3>
        <div class="giftcard-price">${formatPrice(gc.price)}</div>
        ${gc.description ? `<p class="giftcard-desc">${gc.description}</p>` : ''}
        <a href="${waUrl}" target="_blank" class="btn-primary">Comprar para regalar</a>
      </div>
    `
  }).join('')
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
  const order = ['analia', 'karina']
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
    const [promos, servicios, giftcards] = await Promise.all([
      fetch(`${WORKER_URL}/api/promotions`).then(r => r.json()),
      fetch(`${WORKER_URL}/api/services`).then(r => r.json()),
      fetch(`${WORKER_URL}/api/giftcards`).then(r => r.json())
    ])
    renderPromos(promos)
    renderServicios(servicios)
    renderGiftCards(giftcards)
  } catch (e) {
    console.error('Error cargando datos:', e)
    document.getElementById('promos-grid').innerHTML =
      '<p class="loading">Error al cargar promociones.</p>'
    document.getElementById('servicios-container').innerHTML =
      '<p class="loading">Error al cargar servicios.</p>'
    document.getElementById('giftcards-container').innerHTML =
      '<p class="loading">Error al cargar Gift Cards.</p>'
  }
}

// Interacciones del Header
function initHeader() {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-link');
  const header = document.getElementById('main-header');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
  }

  // Efecto de scroll en header
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.style.padding = '10px 0';
      header.style.background = 'rgba(253, 248, 245, 0.95)';
    } else {
      header.style.padding = '0';
      header.style.background = 'rgba(253, 248, 245, 0.85)';
    }
  });
}

init()
initHeader()
