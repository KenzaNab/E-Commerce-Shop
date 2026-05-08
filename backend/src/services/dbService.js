const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/ecommerce.db';
let db;

function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, role TEXT DEFAULT 'user', created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, price REAL NOT NULL,
      stock INTEGER DEFAULT 0, category TEXT, image_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, total REAL NOT NULL,
      status TEXT DEFAULT 'pending', shipping_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL, unit_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // Seed products
  const count = db.prepare('SELECT COUNT(*) as n FROM products').get();
  if (count.n === 0) {
    const { v4: uuid } = require('uuid');
    const products = [
      ['MacBook Pro 14"', 'Powerful laptop for professionals', 1999.99, 10, 'Electronics'],
      ['iPhone 15 Pro', 'Latest Apple smartphone', 1299.99, 25, 'Electronics'],
      ['Sony WH-1000XM5', 'Premium noise-canceling headphones', 349.99, 50, 'Electronics'],
      ['Nike Air Max', 'Comfortable running shoes', 129.99, 100, 'Shoes'],
      ['Levi\'s 501 Jeans', 'Classic straight fit jeans', 79.99, 75, 'Clothing'],
      ['The Clean Coder', 'A Code of Conduct for Professional Programmers', 34.99, 200, 'Books'],
    ];
    const stmt = db.prepare('INSERT INTO products (id, name, description, price, stock, category) VALUES (?,?,?,?,?,?)');
    products.forEach(p => stmt.run(uuid(), ...p));
  }
  console.log('✅ E-Commerce DB ready');
}

function getDB() { return db; }
module.exports = { initDB, getDB };
