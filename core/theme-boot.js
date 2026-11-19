/* Helios Frame · Tema ön yükleyici.
   <head> içinde, CSS'ten hemen sonra, defer/module OLMADAN yüklenir:
     <script src="/core/theme-boot.js"></script>
   İlk boyamadan önce koyu/açık modu ve projenin marka renklerini uygular (yanıp sönme olmaz).
   Satır içi (inline) script olmadığı için sıkı CSP ile uyumludur. */
(function () {
  var root = document.documentElement;
  try {
    var mode = localStorage.getItem('hf-theme-mode') || root.getAttribute('data-theme-default') || 'auto';
    var dark = mode === 'dark' || (mode === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    var vars = JSON.parse(localStorage.getItem('hf-theme-vars') || '{}');
    for (var k in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, k) && /^--hf-[a-z0-9-]+$/.test(k)) root.style.setProperty(k, vars[k]);
    }
  } catch (e) {
    root.setAttribute('data-theme', 'light');
  }
})();
