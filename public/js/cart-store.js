const KEY = 'miniShop.cart.v1';

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function setCart(next) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function cartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((a, b) => a + Number(b || 0), 0);
}

export function addToCart(productId, qty = 1) {
  const cart = getCart();
  cart[productId] = (cart[productId] || 0) + qty;
  setCart(cart);
}

export function clearCart() {
  localStorage.removeItem(KEY);
}

export function toApiItems() {
  const cart = getCart();
  return Object.entries(cart)
    .map(([productId, quantity]) => ({ productId, quantity }))
    .filter((it) => Number(it.quantity) > 0);
}

export function formatMoney(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

export function setCartCountOnPage() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = String(cartCount());
}

