import { getCart, setCart, cartCount, formatMoney } from './cart-store.js';

const cartCountEl = document.getElementById('cartCount');
cartCountEl.textContent = cartCount();

const cartRowsEl = document.getElementById('cartRows');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartTableEl = document.getElementById('cartTable');
const totalsEl = document.getElementById('cartTotals');

const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const shippingEl = document.getElementById('shipping');
const totalEl = document.getElementById('total');

  const msgEl = document.getElementById('cartMsg');

  // Note: totals are computed in INR for display (pricing stored as INR).

function calcTotals(subtotal) {
  const tax = subtotal * 0.08;
  const shipping = subtotal >= 100 ? 0 : subtotal > 0 ? 7.99 : 0;
  const total = subtotal + tax + shipping;
  return { tax, shipping, total };
}

async function render() {
  const cart = getCart();
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    cartEmptyEl.style.display = 'block';
    cartTableEl.style.display = 'none';
    totalsEl.style.display = 'none';
    return;
  }

  const ids = entries.map(([id]) => id);

  const res = await fetch('/api/products');
  const { products } = await res.json();
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  cartRowsEl.innerHTML = '';

  for (const [productId, quantity] of entries) {
    const p = byId.get(productId);
    if (!p) continue;

    subtotal += p.price * quantity;

    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div>
        <div style="font-weight:800">${p.name}</div>
        <div class="muted" style="margin-top:3px">${p.id}</div>
      </div>
      <div style="font-weight:900; color:#bfe3ff">${formatMoney(p.price)}</div>
      <div>
        <div class="qty-controls">
          <button class="small-btn" data-action="dec" data-id="${p.id}">−</button>
          <div style="min-width: 28px; text-align:center; font-weight:900">${quantity}</div>
          <button class="small-btn" data-action="inc" data-id="${p.id}">+</button>
        </div>
      </div>
      <div style="font-weight:900">${formatMoney(p.price * quantity)}</div>
      <div>
        <button class="small-btn" data-action="remove" data-id="${p.id}" title="Remove">×</button>
      </div>
    `;
    cartRowsEl.appendChild(row);
  }

  const { tax, shipping, total } = calcTotals(subtotal);
  subtotalEl.textContent = formatMoney(subtotal);
  taxEl.textContent = formatMoney(tax);
  shippingEl.textContent = formatMoney(shipping);
  totalEl.textContent = formatMoney(total);

  cartEmptyEl.style.display = 'none';
  cartTableEl.style.display = 'block';
  totalsEl.style.display = 'block';

  msgEl.textContent = '';
}

function wireEvents() {
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest('button[data-action]');
    if (!btn) return;

    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');

    const cart = getCart();
    const current = cart[id] || 0;

    if (action === 'inc') cart[id] = current + 1;
    if (action === 'dec') {
      const next = current - 1;
      if (next <= 0) delete cart[id];
      else cart[id] = next;
    }
    if (action === 'remove') delete cart[id];

    setCart(cart);
    cartCountEl.textContent = cartCount();
    render();
  });
}

wireEvents();
render();

