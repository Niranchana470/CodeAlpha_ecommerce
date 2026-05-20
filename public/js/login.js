import { syncAuthUI, setCartCountOnPage } from './auth-ui.js';

setCartCountOnPage();
await syncAuthUI();

const form = document.getElementById('loginForm');
const msg = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = 'Logging in...';

  const fd = new FormData(form);
  const payload = {
    email: fd.get('email'),
    password: fd.get('password')
  };

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    msg.textContent = data?.error || 'Login failed';
    return;
  }

  window.location.href = '/account-orders';
});

