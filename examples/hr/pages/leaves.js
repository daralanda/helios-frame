import { html, $, on } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead, STATUS } from '../../_shared/ui.js';

export default {
  title: 'İzin yönetimi',
  render: () => html`${pageHead('İzin yönetimi', 'Onay bekleyen talepler en üstte. Onaylanan izinler puantaja otomatik işlenir.')}
    <hd-table id="leaves" page-size="10" searchable caption="İzin talepleri"></hd-table>`,
  async mount(el, app) {
    let rows = await app.data.get('examples/data/hr/leaves.json', { cache: 60000 });
    const t = $('#leaves', el);
    if (!t) return undefined;
    const order = { 'Onay bekliyor': 0, Onaylandı: 1, Reddedildi: 2 };
    const sorted = () => [...rows].sort((a, b) => order[a.status] - order[b.status] || a.start.localeCompare(b.start));
    t.columns = [
      { key: 'name', label: 'Personel' }, { key: 'dept', label: 'Departman' }, { key: 'type', label: 'İzin türü' },
      { key: 'start', label: 'Başlangıç', type: 'date' }, { key: 'end', label: 'Bitiş', type: 'date' }, { key: 'days', label: 'Gün', type: 'number' },
      { key: 'status', label: 'Durum', type: 'badge', badges: STATUS },
      { key: 'id', label: 'İşlem', sortable: false, render: (r) => (r.status === 'Onay bekliyor'
        ? html`<span class="hf-cluster hf-gap-2"><button type="button" class="hf-btn hf-btn--sm hf-btn--ghost" data-reject="${r.id}" aria-label="${r.name} reddet">${icon('x', 'hf-icon--sm')}</button>
            <button type="button" class="hf-btn hf-btn--sm hf-btn--primary" data-approve="${r.id}">${icon('check', 'hf-icon--sm')}Onayla</button></span>` : '') },
    ];
    t.data = sorted();
    const set = (id, status) => {
      rows = rows.map((r) => (String(r.id) === id ? { ...r, status } : r));
      const page = t.state.page;
      t.data = sorted();
      t.state.page = page; t.refresh();
      app.bus.emit('toast', { message: status === 'Onaylandı' ? 'İzin onaylandı; puantaja işlendi.' : 'İzin talebi reddedildi.', type: status === 'Onaylandı' ? 'success' : 'info', timeout: 2500 });
    };
    const offs = [on(t, 'click', '[data-approve]', (e, b) => set(b.dataset.approve, 'Onaylandı')), on(t, 'click', '[data-reject]', (e, b) => set(b.dataset.reject, 'Reddedildi'))];
    return () => offs.forEach((off) => off());
  },
};
