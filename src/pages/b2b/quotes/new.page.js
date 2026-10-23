import { Component } from '../../../core/component.js';
import { html, formatMoney } from '../../../core/dom.js';
import { validate, minLength } from '../../../core/forms.js';
import { formField } from '../../../ui/form-field.js';

const SCHEMA = {
  company: ['required', minLength(2)],
  taxNo: ['required', 'taxNo'],
  contact: ['required'],
  email: ['required', 'email'],
  phone: ['phone'],
  validUntil: ['required'],
};

const newItem = () => ({ desc: '', qty: 1, price: 0 });
const inDays = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

/**
 * Kurumsal teklif formu: dinamik kalem satırları, canlı toplamlar, doğrulama.
 * Performans/odak için: yazarken yeniden çizim YOK; yalnızca satır ekle/sil ve doğrulama hatasında render edilir.
 */
export default class QuoteFormPage extends Component {
  static layout = 'b2b';
  static meta = { title: 'Yeni Teklif', auth: true };

  state = { items: [newItem()], errors: {}, busy: false };
  values = { company: '', taxNo: '', contact: '', email: '', phone: '', validUntil: inDays(15), notes: '' };

  beforeMount() {
    this.on('input', '[name]', (e, el) => { this.values[el.name] = el.value; });

    this.on('input', '[data-item]', (e, el) => {
      const row = this.state.items[Number(el.dataset.idx)];
      if (!row) return;
      row[el.dataset.item] = el.dataset.item === 'desc' ? el.value : Math.max(0, Number(el.value) || 0);
      this.#refreshTotals();
    });

    this.on('click', '[data-add-row]', () => this.setState({ items: [...this.state.items, newItem()] }));
    this.on('click', '[data-remove-row]', (e, el) => {
      const items = this.state.items.filter((_, i) => i !== Number(el.dataset.removeRow));
      this.setState({ items: items.length ? items : [newItem()] });
    });
    this.on('submit', 'form', (e) => { e.preventDefault(); this.submit(); });
  }

  async afterMount() {
    const id = this.props.query.customer;
    if (!id) return;
    const c = await this.ctx.services.customers.byId(id, { signal: this.signal }).catch(() => null);
    if (c && !this.destroyed) {
      Object.assign(this.values, { company: c.company, contact: c.contact, email: c.email ?? '', phone: c.phone ?? '' });
      this.update();
    }
  }

  get totals() {
    const subtotal = this.state.items.reduce((sum, i) => sum + i.qty * i.price, 0);
    const vat = subtotal * this.ctx.config.b2b.vatRate;
    return { subtotal, vat, total: subtotal + vat };
  }

  #totalsHtml() {
    const t = this.totals;
    return html`
      <dt class="col-6 fw-normal">Ara toplam</dt><dd class="col-6 text-end">${formatMoney(t.subtotal)}</dd>
      <dt class="col-6 fw-normal">KDV (%${this.ctx.config.b2b.vatRate * 100})</dt><dd class="col-6 text-end">${formatMoney(t.vat)}</dd>
      <dt class="col-6 border-top pt-2">Genel toplam</dt><dd class="col-6 text-end border-top pt-2 fw-bold fs-5">${formatMoney(t.total)}</dd>`;
  }

  /** Yazarken tüm sayfayı değil yalnızca toplam alanlarını güncelle (odak korunur). */
  #refreshTotals() {
    const box = this.$('[data-totals]');
    if (box) box.innerHTML = String(this.#totalsHtml());
    this.state.items.forEach((item, i) => {
      const cell = this.$(`[data-line="${i}"]`);
      if (cell) cell.textContent = formatMoney(item.qty * item.price);
    });
  }

  async submit() {
    const errors = validate(this.values, SCHEMA);
    const valid = this.state.items.filter((i) => i.desc.trim() && i.qty > 0);
    if (!valid.length) errors.items = 'En az bir kalem (açıklama ve adet) girin';
    if (Object.keys(errors).length) {
      this.setState({ errors });
      this.ctx.toast.error('Lütfen formdaki hataları düzeltin');
      return;
    }

    this.setState({ busy: true, errors: {} });
    try {
      const totals = { ...this.totals };
      await this.ctx.services.quotes.create({ ...this.values, items: valid, totals });
      this.ctx.toast.success('Teklif oluşturuldu');
      this.ctx.router.navigate('/b2b/quotes');
    } catch (err) {
      this.ctx.toast.error(`Teklif kaydedilemedi: ${err.message}`);
      if (!this.destroyed) this.setState({ busy: false });
    }
  }

  render() {
    const { items, errors, busy } = this.state;
    const v = this.values;
    return html`
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="h3 mb-0">Yeni teklif</h1>
        <a class="btn btn-outline-secondary" href="${this.href('/b2b/quotes')}">Vazgeç</a>
      </div>

      <form novalidate>
        <div class="card mb-3"><div class="card-body">
          <h2 class="h6 mb-3">Firma bilgileri</h2>
          <div class="row g-3">
            ${formField({ name: 'company', label: 'Firma unvanı', value: v.company, error: errors.company, col: 'col-md-6' })}
            ${formField({ name: 'taxNo', label: 'Vergi / TC kimlik no', value: v.taxNo, error: errors.taxNo, col: 'col-md-6', attrs: 'inputmode="numeric"' })}
            ${formField({ name: 'contact', label: 'Yetkili kişi', value: v.contact, error: errors.contact, col: 'col-md-4' })}
            ${formField({ name: 'email', label: 'E-posta', type: 'email', value: v.email, error: errors.email, col: 'col-md-4' })}
            ${formField({ name: 'phone', label: 'Telefon', type: 'tel', value: v.phone, error: errors.phone, col: 'col-md-4' })}
          </div>
        </div></div>

        <div class="card mb-3"><div class="card-body">
          <h2 class="h6 mb-3">Kalemler</h2>
          ${errors.items ? html`<div class="alert alert-danger py-2">${errors.items}</div>` : ''}
          <div class="table-responsive">
            <table class="table align-middle mb-2">
              <thead><tr><th>Açıklama</th><th style="width:7rem">Adet</th><th style="width:10rem">Birim fiyat (₺)</th><th class="text-end" style="width:9rem">Tutar</th><th style="width:3rem"></th></tr></thead>
              <tbody>
                ${items.map((item, i) => html`
                  <tr>
                    <td><input class="form-control" data-item="desc" data-idx="${i}" data-key="desc-${i}" value="${item.desc}" placeholder="Ürün / hizmet" aria-label="Açıklama ${i + 1}"></td>
                    <td><input class="form-control" type="number" min="1" step="1" data-item="qty" data-idx="${i}" data-key="qty-${i}" value="${item.qty}" aria-label="Adet ${i + 1}"></td>
                    <td><input class="form-control" type="number" min="0" step="0.01" data-item="price" data-idx="${i}" data-key="price-${i}" value="${item.price}" aria-label="Birim fiyat ${i + 1}"></td>
                    <td class="text-end" data-line="${i}">${formatMoney(item.qty * item.price)}</td>
                    <td><button type="button" class="btn btn-sm btn-link text-danger" data-remove-row="${i}" aria-label="Satırı sil">✕</button></td>
                  </tr>`)}
              </tbody>
            </table>
          </div>
          <button type="button" class="btn btn-sm btn-outline-primary" data-add-row>+ Satır ekle</button>
        </div></div>

        <div class="row g-3">
          <div class="col-lg-8"><div class="card h-100"><div class="card-body"><div class="row g-3">
            ${formField({ name: 'validUntil', label: 'Geçerlilik tarihi', type: 'date', value: v.validUntil, error: errors.validUntil, col: 'col-md-6' })}
            ${formField({ name: 'notes', label: 'Notlar / ödeme koşulları', type: 'textarea', value: v.notes })}
          </div></div></div></div>
          <div class="col-lg-4"><div class="card h-100"><div class="card-body">
            <dl class="row mb-3" data-totals>${this.#totalsHtml()}</dl>
            <button class="btn btn-primary w-100" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Kaydediliyor…' : 'Teklifi oluştur'}</button>
          </div></div></div>
        </div>
      </form>`;
  }
}
