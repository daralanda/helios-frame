/** Uygulama başlangıç durumu. `persistKeys` (app.js) ile belirtilen anahtarlar localStorage'a yazılır. */
export const initialState = {
  cart: { items: [] },
  user: null,
  prefs: {},
};
