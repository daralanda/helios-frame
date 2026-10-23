import { Component } from './component.js';

/**
 * Layout: sayfalar arasında kalıcı kabuk (header, sidebar, footer).
 * render() içinde sayfanın yerleşeceği bir `data-outlet` elementi bulunmalıdır.
 *
 * ÖNEMLİ: Layout kendi içinde setState/update çağırmamalıdır; aksi halde outlet
 * (ve içindeki sayfa) silinir. Dinamik parçaları (sepet rozeti vb.) alt bileşen
 * olarak mountChild() ile bağlayın.
 */
export class Layout extends Component {
  get outlet() {
    return this.$('[data-outlet]');
  }
}
