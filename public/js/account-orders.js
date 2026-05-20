import { setCartCountOnPage, getMe } from './auth-ui.js';

setCartCountOnPage();

const notLoggedInEl = document.getElementById('notLoggedIn');
const ordersListEl = document.getElementById('ordersList');
const ordersEl = document.getElementById('orders');
const msgEl = document.getElementById('msg');

async function render() {
  const me = await getMe();
  if (!me) {
    notLoggedInEl.style.display = 'block';
    ordersListEl.style.display = 'none';
    return;
  }

  document.getElementById('btnLogout').style.display = 'inline-block';

  const res = await fetch('/api/orders/me');
  const data = await res.json();
  if (!res.ok) {
    msgEl.textContent = data?.error || 'Failed to load orders.';
    return;
  }

  const orders = data.orders || [];
  if (orders.length === 0) {
    msgEl.textContent = 'No orders yet.';
    ordersListEl.style.display = 'block';
    return;
  }

  ordersEl.innerHTML = '';
  for (const o of orders) {
    const div = document.createElement('div');
    div.className = 'li';
    div.innerHTML = `
      <div>
        <div style="font-weight:900">${o.id}</div>
        <div class="muted" style="margin-top:3px">${new Date(o.createdAt).toLocaleString()}</div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px">
        <div style="font-weight:900">${o.money?.total || ''}</div>
        <a class="link" href="/order-confirmation?orderId=${encodeURIComponent(o.id)}">View</a>
      </div>
    `;
    ordersEl.appendChild(div);
  }

  ordersListEl.style.display = 'block';
}

render();

