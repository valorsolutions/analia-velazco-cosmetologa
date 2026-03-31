// worker/src/giftcards.js

export async function getGiftCards(env) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM gift_cards WHERE active = 1
     ORDER BY sort_order, id`
  ).all()
  return results
}

export async function getAllGiftCards(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM gift_cards ORDER BY sort_order, id'
  ).all()
  return results
}

export async function createGiftCard(body, env) {
  const { title, description = '', price, sort_order = 0 } = body
  if (!title || !price) {
    throw new Error('title y price son requeridos')
  }
  const { meta } = await env.DB.prepare(
    `INSERT INTO gift_cards (title, description, price, sort_order)
     VALUES (?, ?, ?, ?)`
  ).bind(title, description, price, sort_order).run()
  return { id: meta.last_row_id, title, description, price, sort_order, active: 1 }
}

export async function updateGiftCard(id, body, env) {
  const { title, description = '', price, sort_order = 0 } = body
  if (!title || !price) {
    throw new Error('title y price son requeridos')
  }
  await env.DB.prepare(
    `UPDATE gift_cards
     SET title = ?, description = ?, price = ?, sort_order = ?
     WHERE id = ?`
  ).bind(title, description, price, sort_order, id).run()
  return { id, title, description, price, sort_order }
}

export async function deleteGiftCard(id, env) {
  await env.DB.prepare('DELETE FROM gift_cards WHERE id = ?').bind(id).run()
  return { deleted: true, id }
}

export async function toggleGiftCard(id, env) {
  await env.DB.prepare(
    'UPDATE gift_cards SET active = 1 - active WHERE id = ?'
  ).bind(id).run()
  return env.DB.prepare('SELECT * FROM gift_cards WHERE id = ?').bind(id).first()
}
