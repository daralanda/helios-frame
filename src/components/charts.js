import { Component } from '../core/component.js';
import { html } from '../core/dom.js';

const compact = new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 });

function niceMax(v) {
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/**
 * Kütüphanesiz SVG çizgi grafiği (alan dolgulu).
 * props: { labels: string[], values: number[], height?, color?, label?, format?: (n) => string }
 */
export class LineChart extends Component {
  render() {
    const { labels, values, height = 260, color = '#e67700', label = 'Grafik', format = (v) => compact.format(v) } = this.props;
    const W = 600;
    const H = height;
    const m = { t: 14, r: 16, b: 28, l: 52 };
    const iw = W - m.l - m.r;
    const ih = H - m.t - m.b;
    const max = niceMax(Math.max(...values, 1));
    const x = (i) => m.l + (values.length > 1 ? (i / (values.length - 1)) * iw : iw / 2);
    const y = (v) => m.t + ih - (v / max) * ih;
    const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const area = `M${x(0).toFixed(1)},${y(0).toFixed(1)} L${points.join(' L')} L${x(values.length - 1).toFixed(1)},${y(0).toFixed(1)} Z`;

    return html`
      <svg class="hf-chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
        ${[0, 0.25, 0.5, 0.75, 1].map((t) => html`
          <line x1="${m.l}" x2="${W - m.r}" y1="${y(max * t)}" y2="${y(max * t)}" stroke="currentColor" stroke-opacity=".12"/>
          <text x="${m.l - 8}" y="${y(max * t) + 4}" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">${compact.format(max * t)}</text>`)}
        <path d="${area}" fill="${color}" fill-opacity=".15"/>
        <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${values.map((v, i) => html`
          <circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="${color}"><title>${labels[i]}: ${format(v)}</title></circle>
          <text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".6">${labels[i]}</text>`)}
      </svg>`;
  }
}

/**
 * Kütüphanesiz halka (donut) grafiği + gösterge.
 * props: { items: [{ label, value, color }], size?, thickness? }
 */
export class DonutChart extends Component {
  render() {
    const { items, size = 180, thickness = 28 } = this.props;
    const total = items.reduce((sum, i) => sum + i.value, 0) || 1;
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    const mid = size / 2;
    let offset = 0;

    const arcs = items.map((item) => {
      const len = (item.value / total) * c;
      const arc = html`
        <circle cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="${item.color}" stroke-width="${thickness}"
                stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${mid} ${mid})">
          <title>${item.label}: ${item.value}</title>
        </circle>`;
      offset += len;
      return arc;
    });

    return html`
      <div class="d-flex flex-column align-items-center gap-3">
        <svg class="hf-chart-svg" viewBox="0 0 ${size} ${size}" style="max-width:${size}px" role="img" aria-label="Dağılım grafiği">
          ${arcs}
          <text x="${mid}" y="${mid + 6}" text-anchor="middle" font-size="22" font-weight="600" fill="currentColor">${total}</text>
        </svg>
        <ul class="list-unstyled small mb-0 w-100">
          ${items.map((i) => html`
            <li class="d-flex align-items-center gap-2">
              <span style="width:.7rem;height:.7rem;border-radius:50%;background:${i.color}" aria-hidden="true"></span>
              <span class="flex-grow-1">${i.label}</span><strong>${i.value}</strong>
            </li>`)}
        </ul>
      </div>`;
  }
}
