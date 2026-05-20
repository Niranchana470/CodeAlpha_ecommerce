import { setCartCountOnPage, getCart, toApiItems, clearCart, formatMoney } from './cart-store.js';

setCartCountOnPage();

const cart = getCart();
const hasItems = Object.keys(cart).length > 0;

const form = document.getElementById('checkoutForm');
const formMsg = document.getElementById('formMsg');

const sumSubtotal = document.getElementById('sumSubtotal');
const sumTax = document.getElementById('sumTax');
const sumShipping = document.getElementById('sumShipping');
const sumTotal = document.getElementById('sumTotal');

function calcTotals(subtotal) {
  const tax = subtotal * 0.08;
  const shipping = subtotal >= 100 ? 0 : subtotal > 0 ? 7.99 : 0;
  const total = subtotal + tax + shipping;
  return { tax, shipping, total };
}



async function hydrateSummary() {
  if (!hasItems) return;

  const res = await fetch('/api/products');
  const { products } = await res.json();
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  for (const [id, qty] of Object.entries(cart)) {
    const p = byId.get(id);
    if (!p) continue;
    subtotal += p.price * qty;
  }

  const { tax, shipping, total } = calcTotals(subtotal);

  sumSubtotal.textContent = formatMoney(subtotal);
  sumTax.textContent = formatMoney(tax);
  sumShipping.textContent = formatMoney(shipping);
  sumTotal.textContent = formatMoney(total);
}


if (!hasItems) {
  formMsg.textContent = 'Your cart is empty.';
} else {
  hydrateSummary();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMsg.textContent = 'Placing order...';

  const fd = new FormData(form);
  const customer = {
    name: fd.get('name'),
    email: fd.get('email'),
    address: fd.get('address')
  };

  const items = toApiItems();

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer, items })
    });

    const data = await res.json();
    if (!res.ok) {
      formMsg.textContent = data?.error || 'Checkout failed.';
      return;
    }

    clearCart();
    setCartCountOnPage();

    // Navigate to confirmation with query parameter
    const orderId = data.order.id;
    window.location.href = `/order-confirmation?orderId=${encodeURIComponent(orderId)}`;
  } catch (err) {
    formMsg.textContent = 'Network error.';
  }
});

