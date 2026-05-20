import { setCartCountOnPage, formatMoney, addToCart } from './cart-store.js';

setCartCountOnPage();

const grid = document.getElementById('productsGrid');

async function load() {
  const res = await fetch('/api/products');
  const { products } = await res.json();

  grid.innerHTML = '';

  for (const p of products) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="/${p.image}" alt="${p.name}" />
      <div class="card-body">
        <div class="card-title">${p.name}</div>
        <div class="card-price">${formatMoney(p.price)}</div>
        <div class="muted">In stock: ${p.stock}</div>
        <div class="card-actions">
          <a class="button" href="/product/${p.id}" style="padding:10px 12px;">Details</a>
          <button class="smallAdd" data-id="${p.id}" title="Add to cart" style="padding:10px 12px; border-radius:10px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); color:#e8eefc; font-weight:900; cursor:pointer;">Add</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  }
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const btn = t.closest('button.smallAdd[data-id]');
  if (!btn) return;

  const id = btn.getAttribute('data-id');
  addToCart(id, 1);
  setCartCountOnPage();
});

load();

