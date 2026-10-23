/**
 * Form doğrulama yardımcıları.
 *
 *   const errors = validate(values, {
 *     email: ['required', 'email'],
 *     name:  ['required', minLength(3)],
 *   });
 *   // errors => { email: 'Geçerli bir e-posta girin' } (alan başına ilk hata)
 */
export const rules = {
  required: (v) => (String(v ?? '').trim() ? null : 'Bu alan zorunludur'),
  email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : 'Geçerli bir e-posta girin'),
  phone: (v) => (!v || /^\+?[0-9\s()-]{10,16}$/.test(v) ? null : 'Geçerli bir telefon numarası girin'),
  taxNo: (v) => (!v || /^\d{10,11}$/.test(v) ? null : 'Vergi/TC kimlik no 10 veya 11 haneli olmalıdır'),
};

export const minLength = (n) => (v) =>
  !v || String(v).trim().length >= n ? null : `En az ${n} karakter girin`;

export function validate(values, schema) {
  const errors = {};
  for (const [field, checks] of Object.entries(schema)) {
    for (const check of checks) {
      const fn = typeof check === 'function' ? check : rules[check];
      const message = fn(values[field], values);
      if (message) { errors[field] = message; break; }
    }
  }
  return errors;
}

export const formValues = (form) => Object.fromEntries(new FormData(form));
