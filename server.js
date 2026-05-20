import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import db from './db.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie + Session for auth
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-please-change',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// =====================
// Money (INR)
// =====================
function money(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(Number(n) || 0);
}

// =====================
// Seed products once
// =====================
async function seedProductsOnce() {
  const countRow = await db.get('SELECT COUNT(*) as c FROM products');
  const count = countRow?.c || 0;
  if (count > 0) return;

  const seed = [
    {
      id: 'p1',
      name: 'Aurora Wireless Headphones',
      description:
        'Experience rich bass and crystal-clear highs with 40mm drivers and ultra-low-latency Bluetooth.',
      price: 8999,
      image: 'images/headphones.jpg',
      stock: 25
    },
    {
      id: 'p2',
      name: 'Nimbus Smart Watch',
      description:
        'Track workouts, monitor heart rate, and get notifications with a bright always-on display.',
      price: 12999,
      image: 'images/watch.jpg',
      stock: 18
    },
    {
      id: 'p3',
      name: 'Pulse Fitness Band',
      description:
        'Lightweight tracking for steps, sleep, and activity—built for everyday momentum.',
      price: 4999,
      image: 'images/band.jpg',
      stock: 42
    },
    {
      id: 'p4',
      name: 'Orbit USB-C Charging Station',
      description:
        'Charge up to 3 devices with smart power allocation and fast USB-C output.',
      price: 3999,
      image: 'images/charger.jpg',
      stock: 33
    }
  ];

  for (const p of seed) {
    await db.run(
      'INSERT INTO products (id, name, description, price, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
      [p.id, p.name, p.description, p.price, p.image, p.stock]
    );
  }
}

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}

// =====================
// Pages (static)
// =====================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/products', (req, res) => res.sendFile(path.join(__dirname, 'public', 'products.html')));
app.get('/product/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'product.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cart.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));
app.get('/order-confirmation', (req, res) => res.sendFile(path.join(__dirname, 'public', 'order-confirmation.html')));
app.get('/account-orders', (req, res) => res.sendFile(path.join(__dirname, 'public', 'account-orders.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

// =====================
// Products API (SQLite)
// =====================
app.get('/api/products', async (req, res) => {
  const products = await db.all('SELECT * FROM products ORDER BY id');
  res.json({ products });
});

app.get('/api/products/:id', async (req, res) => {
  const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
});

// =====================
// Auth API
// =====================
app.get('/api/auth/me', (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Not logged in' });

  return db
    .get('SELECT id, email, name FROM users WHERE id = ?', [userId])
    .then((user) => res.json({ user }));
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name/email/password' });
  }

  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = bcrypt.hashSync(String(password), 10);
  const createdAt = new Date().toISOString();

  await db.run(
    'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)',
    [email, passwordHash, name, createdAt]
  );

  // fetch last inserted row by querying by email
  const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  res.json({ userId: user.id });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email/password' });
  }

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(String(password), user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.userId = user.id;
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

// =====================
// Orders API
// =====================
app.get('/api/orders/me', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  const rows = await db.all(
    'SELECT id, created_at as createdAt, status, total, subtotal, tax, shipping FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  const orders = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    money: {
      total: money(r.total),
      subtotal: money(r.subtotal),
      tax: money(r.tax),
      shipping: money(r.shipping)
    }
  }));

  res.json({ orders });
});

app.get('/api/orders/:id', async (req, res) => {
  const row = await db.get(
    'SELECT id, created_at as createdAt, status, total, subtotal, tax, shipping FROM orders WHERE id = ?',
    [req.params.id]
  );

  if (!row) return res.status(404).json({ error: 'Order not found' });

  const items = await db.all(
    'SELECT product_id as productId, name, unit_price as unitPrice, quantity, line_total as lineTotal FROM order_items WHERE order_id = ? ORDER BY id ASC',
    [req.params.id]
  );

  res.json({
    order: {
      id: row.id,
      createdAt: row.createdAt,
      status: row.status,
      totals: {
        subtotal: money(row.subtotal),
        tax: money(row.tax),
        shipping: money(row.shipping),
        total: money(row.total)
      },
      money: {
        subtotal: money(row.subtotal),
        tax: money(row.tax),
        shipping: money(row.shipping),
        total: money(row.total)
      },
      items
    }
  });
});

app.post('/api/orders', requireAuth, async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const userId = req.session.userId;

  const user = await db.get('SELECT id, name, email FROM users WHERE id = ?', [userId]);
  if (!user) return res.status(401).json({ error: 'Not logged in' });

  const normalized = items.map((it) => {
    const productId = it?.productId;
    const quantity = Number(it?.quantity);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) return null;
    return { productId, quantity };
  });

  if (normalized.some((x) => !x)) {
    return res.status(400).json({ error: 'Invalid cart items' });
  }

  let subtotal = 0;
  const orderItems = [];

  for (const it of normalized) {
    const p = await db.get('SELECT id, name, price, stock FROM products WHERE id = ?', [it.productId]);
    if (!p) return res.status(400).json({ error: `Invalid product: ${it.productId}` });

    if (it.quantity > p.stock) {
      return res.status(409).json({ error: `Insufficient stock for ${p.name}` });
    }

    subtotal += p.price * it.quantity;
    orderItems.push({
      productId: p.id,
      name: p.name,
      unitPrice: p.price,
      quantity: it.quantity,
      lineTotal: p.price * it.quantity
    });
  }

  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const shipping = subtotal >= 10000 ? 0 : 79.99;
  const total = subtotal + tax + shipping;

  const orderId = `ORD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
  const customerAddress = String(items?.address || '');

  try {
    // Reserve stock best-effort
    for (const oi of orderItems) {
      const ok = await db.run(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [oi.quantity, oi.productId, oi.quantity]
      );
      if (!ok.changes) throw new Error('stock');
    }

    await db.run(
      'INSERT INTO orders (id, user_id, created_at, status, customer_name, customer_email, customer_address, subtotal, tax, shipping, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        orderId,
        userId,
        new Date().toISOString(),
        'confirmed',
        user.name,
        user.email,
        customerAddress,
        subtotal,
        tax,
        shipping,
        total
      ]
    );

    for (const oi of orderItems) {
      await db.run(
        'INSERT INTO order_items (order_id, product_id, name, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, oi.productId, oi.name, oi.unitPrice, oi.quantity, oi.lineTotal]
      );
    }
  } catch {
    return res.status(409).json({ error: 'Could not place order (stock changed). Please try again.' });
  }

  res.json({ order: { id: orderId } });
});

const PORT = process.env.PORT || 3000;

seedProductsOnce()
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Startup error:', err);
    process.exit(1);
  });

