/** Bağımsız (UI kütüphanesinden bağımsız) toast bildirimi. Stiller assets/css/helios.css içinde. */
export function createToaster() {
  let box = null;

  const container = () => {
    if (!box) {
      box = document.createElement('div');
      box.className = 'hf-toasts';
      box.setAttribute('aria-live', 'polite');
      document.body.append(box);
    }
    return box;
  };

  const show = (message, type = 'info', ms = 3000) => {
    const el = document.createElement('div');
    el.className = `hf-toast hf-toast-${type}`;
    el.setAttribute('role', 'status');
    el.textContent = message;
    container().append(el);
    setTimeout(() => {
      el.classList.add('hf-toast-out');
      setTimeout(() => el.remove(), 250);
    }, ms);
  };

  return {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error', 5000),
    info: (m) => show(m, 'info'),
  };
}
