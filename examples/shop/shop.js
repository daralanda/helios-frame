/**
 * Mağaza listesi: istemci tarafı filtre/sıralama (ilerleyici geliştirme).
 * Ürün kartları HTML'de hazır gelir (SEO); bu betik yalnızca gösterir/gizler ve sıralar.
 * ?k=sensor gibi kategori parametresi sayfa açılışında filtreyi seçer; seçim URL'ye yazılır.
 */
import { ready } from '../../core/app.js';
import { $, $$, on } from '../../core/dom.js';

await ready;
const grid = $('[data-products]');
const cards = $$('.hf-product', grid);
const original = [...cards];
const aside = $('.shop-filters');
const sortSel = $('select[name="sort"]');
const collator = new Intl.Collator('tr');

const params = new URLSearchParams(location.search);
for (const k of params.getAll('k')) {
  const box = aside.querySelector(`input[name="k"][value="${CSS.escape(k)}"]`);
  if (box) box.checked = true;
}
if (params.get('stok') === '1') aside.querySelector('input[name="stock"]').checked = true;
if (params.get('sira')) sortSel.value = params.get('sira');

function apply() {
  const cats = $$('input[name="k"]:checked', aside).map((i) => i.value);
  const onlyStock = aside.querySelector('input[name="stock"]').checked;
  const sort = sortSel.value;

  let visible = 0;
  for (const c of cards) {
    const show = (!cats.length || cats.includes(c.dataset.cat)) && (!onlyStock || Number(c.dataset.stock) > 0);
    c.hidden = !show;
    if (show) visible++;
  }
  const sorted = sort ? [...cards].sort((a, b) => {
    if (sort === 'name') return collator.compare(a.dataset.name, b.dataset.name);
    const d = Number(a.dataset.price) - Number(b.dataset.price);
    return sort === 'price-asc' ? d : -d;
  }) : original;
  grid.append(...sorted);
  $('[data-count]').textContent = String(visible);
  $('[data-empty]').hidden = visible > 0;

  // Filtre durumunu URL'ye yaz (paylaşılabilir bağlantı); sayfa yenilenmez
  const q = new URLSearchParams();
  cats.forEach((k) => q.append('k', k));
  if (onlyStock) q.set('stok', '1');
  if (sort) q.set('sira', sort);
  history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}`);
}

on(aside, 'change', 'input', apply);
sortSel.addEventListener('change', apply);
apply();
