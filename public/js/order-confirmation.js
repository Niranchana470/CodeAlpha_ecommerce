import { setCartCountOnPage } from './cart-store.js';

setCartCountOnPage();

const params = new URLSearchParams(window.location.search);
const orderId = params.get('orderId');

const orderIdEl = document.getElementById('orderId');
const metaEl = document.getElementById('orderMeta');
const itemsEl = document.getElementById('items');
const paidTotalEl = document.getElementById('paidTotal');

function formatMoney(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

async function load() {
  if (!orderId) return;

  const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
  const data = await res.json();
  if (!res.ok) return;

  const order = data.order;
  orderIdEl.textContent = order.id;
  metaEl.textContent = `Placed on ${new Date(order.createdAt).toLocaleString()}. Status: ${order.status}`;

  itemsEl.innerHTML = '';
  for (const it of order.items) {
    const div = document.createElement('div');
    div.className = 'li';
    div.innerHTML = `
      <div>
        <div style="font-weight:900">${it.name}</div>
        <div class="muted">Qty: ${it.quantity} × ${formatMoney(it.unitPrice)}</div>
      </div>
      <div style="font-weight:900; color:#bfe3ff">${formatMoney(it.lineTotal)}</div>
    `;
    itemsEl.appendChild(div);
  }

  paidTotalEl.textContent = formatMoney(order.totals.total);
}

load();

