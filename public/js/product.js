import { addToCart, setCartCountOnPage, getCart } from './cart-store.js';

setCartCountOnPage();

const productId = window.location.pathname.split('/').pop();

const imgEl = document.getElementById('productImage');
const nameEl = document.getElementById('productName');
const descEl = document.getElementById('productDescription');
const priceEl = document.getElementById('productPrice');
const stockEl = document.getElementById('stockNote');
const form = document.getElementById('addToCartForm');
const qtyEl = document.getElementById('quantity');
const msgEl = document.getElementById('msg');

function formatMoney(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

async function load() {
  const res = await fetch(`/api/products/${productId}`);
  if (!res.ok) {
    msgEl.textContent = 'Product not found.';
    return;
  }
  const { product } = await res.json();

  imgEl.src = `/${product.image}`;
  imgEl.alt = product.name;
  nameEl.textContent = product.name;
  descEl.textContent = product.description;
  priceEl.textContent = formatMoney(product.price);

  if (product.stock > 0) stockEl.textContent = `In stock: ${product.stock}`;
  else stockEl.textContent = 'Out of stock';
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const qty = Math.max(1, Number(qtyEl.value || 1));

  addToCart(productId, qty);
  setCartCountOnPage();

  const cart = getCart();
  msgEl.textContent = `Added to cart. Cart items: ${Object.keys(cart).length} product types.`;
});

load();

