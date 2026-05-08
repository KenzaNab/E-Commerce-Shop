const express = require('express');
const { v4: uuid } = require('uuid');
const { getDB } = require('../services/dbService');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);

router.post('/', (req, res) => {
  const { shipping_address } = req.body;
  const db = getDB();
  const cartItems = db.prepare(`
    SELECT c.quantity, p.id as product_id, p.price, p.stock, p.name
    FROM cart_items c JOIN products p ON c.product_id=p.id WHERE c.user_id=?
  `).all(req.userId);
  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty.' });

  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const orderId = uuid();

  const createOrder = db.transaction(() => {
    db.prepare('INSERT INTO orders (id,user_id,total,shipping_address) VALUES (?,?,?,?)').run(orderId, req.userId, total, shipping_address || null);
    cartItems.forEach(i => {
      db.prepare('INSERT INTO order_items (id,order_id,product_id,quantity,unit_price) VALUES (?,?,?,?,?)').run(uuid(), orderId, i.product_id, i.quantity, i.price);
      db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(i.quantity, i.product_id);
    });
    db.prepare('DELETE FROM cart_items WHERE user_id=?').run(req.userId);
  });
  createOrder();
  res.status(201).json({ id: orderId, total, status: 'pending' });
});

router.get('/', (req, res) => {
  const orders = getDB().prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(req.userId);
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.id, req.userId);
  if (!order) return res.status(404).json({ error: 'Not found.' });
  const items = db.prepare('SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id=p.id WHERE oi.order_id=?').all(req.params.id);
  res.json({ ...order, items });
});

module.exports = router;
