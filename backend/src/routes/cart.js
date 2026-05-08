const express = require('express');
const { v4: uuid } = require('uuid');
const { getDB } = require('../services/dbService');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);

router.get('/', (req, res) => {
  const items = getDB().prepare(`
    SELECT c.id, c.quantity, p.id as product_id, p.name, p.price, p.image_url, p.stock
    FROM cart_items c JOIN products p ON c.product_id=p.id
    WHERE c.user_id=?
  `).all(req.userId);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ items, total: Math.round(total * 100) / 100 });
});

router.post('/', (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required.' });
  const db = getDB();
  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id=? AND product_id=?').get(req.userId, product_id);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity=quantity+? WHERE id=?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (id,user_id,product_id,quantity) VALUES (?,?,?,?)').run(uuid(), req.userId, product_id, quantity);
  }
  res.status(201).json({ message: 'Added to cart.' });
});

router.put('/:id', (req, res) => {
  const { quantity } = req.body;
  if (quantity <= 0) { getDB().prepare('DELETE FROM cart_items WHERE id=? AND user_id=?').run(req.params.id, req.userId); }
  else { getDB().prepare('UPDATE cart_items SET quantity=? WHERE id=? AND user_id=?').run(quantity, req.params.id, req.userId); }
  res.json({ message: 'Updated.' });
});

router.delete('/:id', (req, res) => {
  getDB().prepare('DELETE FROM cart_items WHERE id=? AND user_id=?').run(req.params.id, req.userId);
  res.status(204).send();
});

router.delete('/', (req, res) => {
  getDB().prepare('DELETE FROM cart_items WHERE user_id=?').run(req.userId);
  res.status(204).send();
});

module.exports = router;
