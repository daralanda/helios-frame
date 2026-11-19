/**
 * <hd-tabs>
 *   <section data-tab="Açıklama">...</section>
 *   <section data-tab="Teknik özellikler">...</section>
 * </hd-tabs>
 *
 * İçerik HTML'de kalır (arama motorları tüm sekmeleri okur); JS yalnızca ARIA sekme
 * davranışını ekler. Klavye: ←/→, Home, End. URL'de #sekme-id varsa o sekme açılır.
 */
import { nextId } from '../core/dom.js';
import { define, HdElement } from './base.js';

class HdTabs extends HdElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    const panels = [...this.children].filter((c) => c.dataset.tab);
    const list = document.createElement('div');
    list.className = 'hf-tabs__list';
    list.setAttribute('role', 'tablist');
    if (this.getAttribute('label')) list.setAttribute('aria-label', this.getAttribute('label'));

    this.tabs = panels.map((panel) => {
      panel.id ||= nextId('hf-panel');
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'hf-tabs__tab';
      tab.id = nextId('hf-tab');
      tab.textContent = panel.dataset.tab;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      panel.classList.add('hf-tabs__panel');
      list.append(tab);
      return { tab, panel };
    });
    this.prepend(list);

    list.addEventListener('click', (e) => {
      const i = this.tabs.findIndex((t) => t.tab === e.target.closest('[role="tab"]'));
      if (i >= 0) this.select(i);
    });
    list.addEventListener('keydown', (e) => {
      const cur = this.tabs.findIndex((t) => t.tab === document.activeElement);
      const n = this.tabs.length;
      const next = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: n - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      this.select((next + n) % n, true);
    });

    const fromHash = this.tabs.findIndex((t) => `#${t.panel.id}` === location.hash);
    this.select(fromHash >= 0 ? fromHash : 0);
  }

  select(index, focus = false) {
    this.tabs.forEach(({ tab, panel }, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      if (on && focus) tab.focus();
    });
    this.dispatchEvent(new CustomEvent('hd-tab', { detail: { index } }));
  }
}

define('hd-tabs', HdTabs);
