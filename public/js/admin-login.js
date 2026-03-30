// public/js/admin-login.js

// Redirigir al dashboard si ya está logueado
if (localStorage.getItem('admin_token')) {
  window.location.href = 'dashboard.html'
}

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
