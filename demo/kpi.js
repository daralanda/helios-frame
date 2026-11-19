/** KPI (istatistik) kartı şablonu: { label, value, format: money|number, trend: 0.12, icon, invert } */
import { html } from '../core/dom.js';
import { icon } from '../components/base.js';

export function kpiCard(k, app) {
  const value = k.format === 'money' ? app.fmt.money(k.value) : app.fmt.number(k.value);
  const up = k.trend >= 0;
  const good = k.invert ? !up : up;
  return html`<article class="hf-card hf-stat"><div class="hf-card__body">
    <div class="hf-stat__top"><span class="hf-stat__label">${k.label}</span>
      ${k.icon ? html`<span class="hf-stat__icon">${icon(k.icon)}</span>` : ''}</div>
    <div class="hf-stat__value">${value}</div>
    <div class="hf-stat__foot">
      <span class="hf-trend ${good ? 'hf-trend--up' : 'hf-trend--down'}">${up ? '▲' : '▼'} ${app.fmt.percent(Math.abs(k.trend))}</span>
      <span>geçen aya göre</span>
    </div>
  </div></article>`;
}
