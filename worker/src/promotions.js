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
