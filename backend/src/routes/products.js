const express = require('express');
const { v4: uuid } = require('uuid');
const { getDB } = require('../services/dbService');
const router = express.Router();

router.get('/', (req, res) => {
  const { category, search } = req.query;
  let q = 'SELECT * FROM products';
  const params = [];
  if (category) { q += ' WHERE category=?'; params.push(category); }
  else if (search) { q += ' WHERE name LIKE ? OR description LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
  q += ' ORDER BY created_at DESC';
  res.json(getDB().prepare(q).all(...params));
});

router.get('/:id', (req, res) => {
  const p = getDB().prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found.' });
  res.json(p);
});

router.get('/categories/all', (req, res) => {
  const cats = getDB().prepare('SELECT DISTINCT category FROM products WHERE category IS NOT NULL').all();
  res.json(cats.map(c => c.category));
});

module.exports = router;
