import { Component } from '../core/component.js';
import { html } from '../core/dom.js';

const TR = {
  search: 'Ara:',
  lengthMenu: 'Sayfada _MENU_ kayıt',
  info: '_TOTAL_ kayıttan _START_ - _END_ arası',
  infoEmpty: 'Kayıt yok',
  infoFiltered: '(_MAX_ kayıt içinden filtrelendi)',
  emptyTable: 'Gösterilecek veri yok',
  zeroRecords: 'Eşleşen kayıt bulunamadı',
  paginate: { first: 'İlk', last: 'Son', next: 'Sonraki', previous: 'Önceki' },
};

/**
 * DataTables sarmalayıcısı (Bootstrap 5 teması). Kütüphane tembel yüklenir.
 * props: { columns, data, options? }
 *
 * Not: DataTables `render` fonksiyonları çıktıyı HAM HTML olarak basar -> kullanıcı verisini
 * mutlaka escapeHtml() ile geçirin. Satır eylemleri için düğmelere data-* ekleyin ve
 * ebeveyn bileşende this.on('click', '[data-xyz]', ...) ile delege dinleyin.
 */
export class DataTableView extends Component {
  static libs = ['datatables'];

  render() {
    return html`<div class="table-responsive"><table class="table table-hover align-middle w-100"></table></div>`;
  }

  afterMount() {
    const { columns, data, options = {} } = this.props;
    this.table = new window.DataTable(this.$('table'), {
      data,
      columns,
      pageLength: 10,
      language: TR,
      ...options,
    });
  }

  beforeUnmount() {
    this.table?.destroy();
  }
}
