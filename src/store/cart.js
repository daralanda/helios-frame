/** Sepet seçicileri ve eylemleri. Tüm eylemler immutable güncelleme yapar. */
import { config } from '../config.js';

// ---- Seçiciler (saf fonksiyonlar) ----
export const cartCount = (s) => s.cart.items.reduce((n, i) => n + i.qty, 0);
export const qtyInCart = (s, id) => s.cart.items.find((i) => i.id === id)?.qty ?? 0;

export function cartTotals(s, shop = config.shop) {
  const subtotal = s.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= shop.freeShippingThreshold ? 0 : shop.shippingFee;
  return { count: cartCount(s), subtotal, shipping, total: subtotal + shipping };
}

// ---- Eylemler ----
export function addItem(store, product, qty = 1) {
  store.set((s) => {
    const items = [...s.cart.items];
    const i = items.findIndex((x) => x.id === product.id);
    if (i >= 0) {
      items[i] = { ...items[i], qty: Math.min(items[i].qty + qty, 99) };
    } else {
      const { id, slug, name, price, emoji } = product;
      items.push({ id, slug, name, price, emoji, qty });
    }
    return { cart: { ...s.cart, items } };
  });
}

export function setQty(store, id, qty) {
  store.set((s) => ({
    cart: {
      ...s.cart,
      items: s.cart.items
        .map((i) => (i.id === id ? { ...i, qty: Math.min(qty, 99) } : i))
        .filter((i) => i.qty > 0),
    },
  }));
}

export const removeItem = (store, id) => setQty(store, id, 0);
export const clearCart = (store) => store.set({ cart: { items: [] } });
