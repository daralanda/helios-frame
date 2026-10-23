import { Component } from '../core/component.js';
import { html } from '../core/dom.js';

const LINKS = [
  ['/b2b/dashboard', '📊', 'Panel'],
  ['/b2b/customers', '🏢', 'Müşteriler'],
  ['/b2b/quotes', '📄', 'Teklifler'],
];

export class B2BSidebar extends Component {
  beforeMount() {
    this.state = { path: this.ctx.router.current?.path ?? '', user: this.ctx.store.state.user };
    this.onBus('route:change', (to) => this.setState({ path: to.path }));
    this.watch(this.ctx.store, (s) => s.user, (user) => this.setState({ user }));

    this.on('click', '[data-logout]', () => {
      this.ctx.services.auth.logout();
      this.ctx.router.navigate('/login');
    });
  }

  render() {
    const { path, user } = this.state;
    return html`
      <aside class="hf-sidebar d-flex flex-column p-3">
        <a class="hf-brand mb-4" href="${this.href('/')}"><span class="hf-sun" aria-hidden="true"></span>${this.ctx.config.brand}</a>
        <nav class="nav nav-pills flex-column gap-1 mb-auto" aria-label="B2B menü">
          ${LINKS.map(([to, icon, label]) => html`
            <a class="nav-link ${path === to || (to !== '/b2b/dashboard' && path.startsWith(to)) ? 'active' : ''}" href="${this.href(to)}">${icon} ${label}</a>`)}
        </nav>
        ${user ? html`
          <div class="border-top pt-3 small">
            <div class="fw-semibold text-truncate">${user.name}</div>
            <div class="text-body-secondary text-truncate mb-2">${user.company ?? user.email}</div>
            <button class="btn btn-sm btn-outline-secondary w-100" data-logout>Çıkış yap</button>
          </div>` : ''}
      </aside>`;
  }
}
