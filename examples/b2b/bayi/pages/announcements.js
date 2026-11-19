import { html, render, $ } from '../../../../core/dom.js';
import { pageHead } from '../../../_shared/ui.js';

export default {
  title: 'Duyurular',
  render: () => html`${pageHead('Duyurular', 'Kampanya, ürün ve operasyon duyuruları.')}<div class="hf-stack" id="list"></div>`,
  async mount(el, app) {
    const items = await app.data.get('examples/data/b2b/announcements.json', { cache: 60000 });
    if (!$('#list', el)) return;
    render($('#list', el), html`${items.map((n) => html`<article class="hf-card"><div class="hf-card__body hf-stack hf-gap-2">
      <time class="hf-muted hf-text-xs" datetime="${n.date}">${app.fmt.date(n.date, 'long')}</time>
      <h2 class="hf-card__title">${n.title}</h2><p class="hf-muted">${n.body}</p></div></article>`)}`);
  },
};
