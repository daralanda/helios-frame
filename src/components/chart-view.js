import { Component } from '../core/component.js';
import { html } from '../core/dom.js';

/**
 * Chart.js sarmalayıcısı. Kütüphane bileşen tarafından tembel yüklenir (static libs).
 * props: { type, data, options?, height? }
 */
export class ChartView extends Component {
  static libs = ['chartjs'];

  render() {
    return html`<div class="hf-chart" style="height:${this.props.height ?? 280}px"><canvas></canvas></div>`;
  }

  afterMount() {
    const { type, data, options = {} } = this.props;
    this.chart = new window.Chart(this.$('canvas'), {
      type,
      data,
      options: { responsive: true, maintainAspectRatio: false, ...options },
    });
  }

  beforeUnmount() {
    this.chart?.destroy(); // canvas/olay sızıntısını önle
  }
}
