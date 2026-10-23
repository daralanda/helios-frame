import { html, raw } from '../core/dom.js';

/**
 * Bootstrap uyumlu form alanı. `attrs` güvenilir (sizin yazdığınız) ek öznitelikler içindir.
 * type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' ...
 */
export function formField({ name, label, type = 'text', value = '', error = '', placeholder = '', col = 'col-12', attrs = '' }) {
  const cls = `form-control ${error ? 'is-invalid' : ''}`;
  const input = type === 'textarea'
    ? html`<textarea class="${cls}" id="f-${name}" name="${name}" rows="3" placeholder="${placeholder}" ${raw(attrs)}>${value}</textarea>`
    : html`<input class="${cls}" id="f-${name}" name="${name}" type="${type}" value="${value}" placeholder="${placeholder}" aria-invalid="${error ? 'true' : 'false'}" ${raw(attrs)}>`;

  return html`
    <div class="${col}">
      <label class="form-label" for="f-${name}">${label}</label>
      ${input}
      ${error ? html`<div class="invalid-feedback">${error}</div>` : ''}
    </div>`;
}
