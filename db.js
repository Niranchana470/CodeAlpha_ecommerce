import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./data.sqlite');

db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  image TEXT NOT NULL,
  stock INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  subtotal REAL NOT NULL,
  tax REAL NOT NULL,
  shipping REAL NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  unit_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  line_total REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
`);

export default { db, run, get, all };


