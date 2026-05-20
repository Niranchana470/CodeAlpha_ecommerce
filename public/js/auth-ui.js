import { cartCount, formatMoney } from './cart-store.js';

export function setCartCountOnPage() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = String(cartCount());
}

export async function getMe() {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export async function syncAuthUI() {
  const me = await getMe();

  const btnLogout = document.getElementById('btnLogout');
  const linkOrders = document.getElementById('linkOrders');
  const linkLogin = document.getElementById('linkLogin');
  const linkRegister = document.getElementById('linkRegister');

  if (me) {
    if (btnLogout) btnLogout.style.display = 'inline-block';
    if (linkOrders) linkOrders.style.display = 'inline-block';
    if (linkLogin) linkLogin.style.display = 'none';
    if (linkRegister) linkRegister.style.display = 'none';

    if (btnLogout) {
      btnLogout.addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      });
    }
  } else {
    if (btnLogout) btnLogout.style.display = 'none';
    if (linkOrders) linkOrders.style.display = 'none';
    if (linkLogin) linkLogin.style.display = 'inline-block';
    if (linkRegister) linkRegister.style.display = 'inline-block';
  }
}

