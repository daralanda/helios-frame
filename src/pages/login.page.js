import { Component } from '../core/component.js';
import { html } from '../core/dom.js';
import { validate, formValues } from '../core/forms.js';
import { formField } from '../ui/form-field.js';

export default class LoginPage extends Component {
  static layout = 'blank';
  static meta = { title: 'Giriş' };

  state = { busy: false, error: '', errors: {} };
  email = '';

  beforeMount() {
    this.on('submit', 'form', async (e) => {
      e.preventDefault();
      const values = formValues(e.target);
      this.email = values.email ?? '';

      const errors = validate(values, { email: ['required', 'email'], password: ['required'] });
      if (Object.keys(errors).length) return this.setState({ errors, error: '' });

      this.setState({ busy: true, errors: {}, error: '' });
      try {
        await this.ctx.services.auth.login(values.email, values.password);
        // Açık yönlendirme (open redirect) önlemi: yalnızca uygulama içi yollar kabul edilir.
        const next = this.props.query.next;
        this.ctx.router.navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : '/b2b/dashboard');
      } catch (err) {
        if (!this.destroyed) this.setState({ busy: false, error: err.message });
      }
    });
  }

  render() {
    const { busy, error, errors } = this.state;
    return html`
      <div class="hf-login">
        <div class="card shadow-sm"><div class="card-body p-4">
          <a class="hf-brand mb-3 d-inline-flex" href="${this.href('/')}"><span class="hf-sun" aria-hidden="true"></span>${this.ctx.config.brand}</a>
          <h1 class="h4">Müşteri paneli girişi</h1>
          <p class="small text-body-secondary">Demo için herhangi bir e-posta ve <code>demo</code> parolasını kullanın.</p>
          ${error ? html`<div class="alert alert-danger py-2" role="alert">${error}</div>` : ''}
          <form class="row g-3" novalidate>
            ${formField({ name: 'email', label: 'E-posta', type: 'email', value: this.email, error: errors.email, attrs: 'autocomplete="username"' })}
            ${formField({ name: 'password', label: 'Parola', type: 'password', error: errors.password, attrs: 'autocomplete="current-password"' })}
            <div class="col-12"><button class="btn btn-primary w-100" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</button></div>
          </form>
        </div></div>
      </div>`;
  }
}
