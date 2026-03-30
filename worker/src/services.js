// worker/src/services.js

export async function getServices(env) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM services WHERE active = 1
     ORDER BY category, sort_order, id`
  ).all()
  return {
    analia: results.filter(s => s.category === 'analia'),
    karina: results.filter(s => s.category === 'karina')
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
  if (!['analia', 'karina'].includes(category)) {
    throw new Error('category debe ser analia o karina')
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
  if (!['analia', 'karina'].includes(category)) {
    throw new Error('category debe ser analia o karina')
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
