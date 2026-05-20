import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// In-memory product catalog (hardcoded)
const products = [
  {
    id: 'p1',
    name: 'Aurora Wireless Headphones',
    description:
      'Experience rich bass and crystal-clear highs with 40mm drivers and ultra-low-latency Bluetooth.',
    price: 89.99,
    image: 'images/headphones.jpg',
    stock: 25
  },
  {
    id: 'p2',
    name: 'Nimbus Smart Watch',
    description:
      'Track workouts, monitor heart rate, and get notifications with a bright always-on display.',
    price: 129.0,
    image: 'images/watch.jpg',
    stock: 18
  },
  {
    id: 'p3',
    name: 'Pulse Fitness Band',
    description:
      'Lightweight tracking for steps, sleep, and activity—built for everyday momentum.',
    price: 49.5,
    image: 'images/band.jpg',
    stock: 42
  },
  {
    id: 'p4',
    name: 'Orbit USB-C Charging Station',
    description:
      'Charge up to 3 devices with smart power allocation and fast USB-C output.',
    price: 39.99,
    image: 'images/charger.jpg',
    stock: 33
  }
];

const productById = new Map(products.map((p) => [p.id, p]));

// In-memory orders store
const orders = [];

function money(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(n);
}

// Page routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/order-confirmation', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-confirmation.html'));
});

// API
app.get('/api/products', (req, res) => {
  res.json({ products });
});

app.get('/api/products/:id', (req, res) => {
  const p = productById.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: p });
});

// Cart is sent from the frontend; backend validates stock
app.post('/api/orders', (req, res) => {
  const { customer, items } = req.body || {};

  if (!customer || typeof customer !== 'object') {
    return res.status(400).json({ error: 'Missing customer' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Validate and compute totals
  const orderItems = [];
  let subtotal = 0;

  for (const it of items) {
    const { productId, quantity } = it || {};
    const product = productById.get(productId);

    if (!product) {
      return res.status(400).json({ error: `Invalid product: ${productId}` });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: `Invalid quantity for ${productId}` });
    }

    if (qty > product.stock) {
      return res.status(409).json({ error: `Insufficient stock for ${product.name}` });
    }

    subtotal += product.price * qty;
    orderItems.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: qty,
      lineTotal: product.price * qty
    });
  }

  // Simple flat tax + shipping model for demo
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const shipping = subtotal >= 100 ? 0 : 7.99;
  const total = subtotal + tax + shipping;

  // Reserve stock (in-memory)
  for (const oi of orderItems) {
    const p = productById.get(oi.productId);
    p.stock -= oi.quantity;
  }

  const orderId = `ORD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    customer: {
      name: customer.name,
      email: customer.email,
      address: customer.address
    },
    totals: {
      subtotal,
      tax,
      shipping,
      total
    },
    items: orderItems
  };

  orders.push(order);

  res.json({ order: { ...order, money: { subtotal: money(subtotal), tax: money(tax), shipping: money(shipping), total: money(total) } } });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

