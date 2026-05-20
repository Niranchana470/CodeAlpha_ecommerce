import { syncAuthUI, setCartCountOnPage } from './auth-ui.js';

setCartCountOnPage();
await syncAuthUI();

const form = document.getElementById('registerForm');
const msg = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = 'Creating account...';

  const fd = new FormData(form);
  const payload = {
    name: fd.get('name'),
    email: fd.get('email'),
    password: fd.get('password')
  };

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    msg.textContent = data?.error || 'Register failed';
    return;
  }

  window.location.href = '/login';
});

