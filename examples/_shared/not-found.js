import { html } from '../../core/dom.js';
import { icon } from '../../components/base.js';

export default {
  title: 'Sayfa bulunamadı',
  render: () => html`<div class="hf-empty">${icon('alert')}<h1 class="hf-page__title">Sayfa bulunamadı</h1>
    <p>Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.</p><a class="hf-btn hf-btn--primary" href="#/">Özete dön</a></div>`,
};
