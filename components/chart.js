/**
 * <hd-chart type="line|bar" height="220" label="Aylık satış"
 *           data='[{"label":"Oca","value":120},{"label":"Şub","value":180}]'></hd-chart>
 *
 * Kütüphanesiz, SVG tabanlı hafif grafik. DOM'a createElementNS ile yazar (innerHTML yok).
 * Renkler tema değişkenlerinden gelir; koyu temada otomatik uyum sağlar.
 * Erişilebilirlik: role="img" + aria-label + her nokta için <title>.
 */
import { app, define, jsonAttr, HdElement } from './base.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}, text) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  if (text != null) n.textContent = text;
  return n;
};

/** Okunabilir eksen üst sınırı: 87 -> 100, 1430 -> 1500 */
export function niceMax(v) {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  const step = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 3 ? 3 : f <= 5 ? 5 : f <= 7.5 ? 7.5 : 10;
  return step * exp;
}

class HdChart extends HdElement {
  set data(v) { this._data = v; this.draw(); }
  get data() { return this._data ?? jsonAttr(this, 'data', []); }

  connectedCallback() {
    this.draw();
    this._ro = new ResizeObserver(() => {
      const w = Math.round(this.clientWidth);
      if (w && w !== this._w) { this._w = w; this.draw(); }
    });
    this._ro.observe(this);
  }
  disconnectedCallback() { this._ro?.disconnect(); }

  draw() {
    if (!this.isConnected) return;
    const a = app();
    const data = (this.data || []).map((d) => ({ label: String(d.label), value: Number(d.value) || 0 }));
    const W = Math.max(this.clientWidth || 600, 240);
    const H = Number(this.getAttribute('height')) || 220;
    const pad = { t: 12, r: 8, b: 26, l: 44 };
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const max = niceMax(Math.max(...data.map((d) => d.value), 0));
    const type = this.getAttribute('type') === 'bar' ? 'bar' : 'line';
    const fmt = (v) => (this.getAttribute('format') === 'money' ? a.fmt.money(v) : a.fmt.number(v));

    const svg = el('svg', { class: 'hf-chart', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': this.getAttribute('label') || 'Grafik' });
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const y = pad.t + ih - (ih * i) / ticks;
      svg.append(el('line', { class: 'hf-chart__grid', x1: pad.l, x2: W - pad.r, y1: y, y2: y }));
      svg.append(el('text', { class: 'hf-chart__axis', x: pad.l - 8, y: y + 4, 'text-anchor': 'end' }, a.fmt.compact((max * i) / ticks)));
    }
    if (!data.length) { this.replaceChildren(svg); return; }

    const step = iw / data.length;
    const yOf = (v) => pad.t + ih - (v / max) * ih;
    const every = Math.ceil(data.length / Math.max(1, Math.floor(iw / 48))); // etiket sıklığı
    data.forEach((d, i) => {
      if (i % every === 0) {
        svg.append(el('text', { class: 'hf-chart__axis', x: pad.l + step * i + step / 2, y: H - 8, 'text-anchor': 'middle' }, d.label));
      }
    });

    if (type === 'bar') {
      const g = el('g');
      const bw = Math.max(4, Math.min(42, step * 0.6));
      data.forEach((d, i) => {
        const x = pad.l + step * i + (step - bw) / 2;
        const y = yOf(d.value);
        const r = el('rect', { class: 'hf-chart__bar', x, y, width: bw, height: Math.max(0, pad.t + ih - y), rx: Math.min(6, bw / 3) });
        r.append(el('title', {}, `${d.label}: ${fmt(d.value)}`));
        g.append(r);
      });
      svg.append(g);
    } else {
      const pts = data.map((d, i) => [pad.l + step * i + step / 2, yOf(d.value)]);
      const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      const base = pad.t + ih;
      svg.append(el('path', { class: 'hf-chart__area', d: `${line} L${pts.at(-1)[0].toFixed(1)},${base} L${pts[0][0].toFixed(1)},${base} Z` }));
      svg.append(el('path', { class: 'hf-chart__line', d: line }));
      pts.forEach((p, i) => {
        const c = el('circle', { class: 'hf-chart__dot', cx: p[0], cy: p[1], r: 3.5 });
        c.append(el('title', {}, `${data[i].label}: ${fmt(data[i].value)}`));
        svg.append(c);
      });
    }
    this.replaceChildren(svg);
  }
}

define('hd-chart', HdChart);
