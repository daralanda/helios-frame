/**
 * fetch tabanlı küçük REST istemcisi.
 *  - baseURL, ortak header'lar, zaman aşımı, AbortSignal desteği
 *  - JSON otomatik (de)serileştirme
 *  - request / response / error interceptor'ları (auth token, 401 yönetimi vb.)
 */
export class HttpError extends Error {
  constructor(message, { status = 0, data = null, url = '' } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
    this.url = url;
  }
}

export class HttpClient {
  #interceptors = { request: [], response: [], error: [] };

  constructor({ baseURL = '', headers = {}, timeout = 15000 } = {}) {
    this.baseURL = baseURL;
    this.headers = headers;
    this.timeout = timeout;
  }

  /** fn({ url, init }) => { url, init } */
  useRequest(fn) { this.#interceptors.request.push(fn); return this; }
  /** fn({ data, status, headers }) => { data, status, headers } */
  useResponse(fn) { this.#interceptors.response.push(fn); return this; }
  /** fn(error) - yalnızca yan etki içindir (oturum kapatma, log vb.) */
  useError(fn) { this.#interceptors.error.push(fn); return this; }

  get(url, opts) { return this.request('GET', url, opts); }
  post(url, body, opts) { return this.request('POST', url, { ...opts, body }); }
  put(url, body, opts) { return this.request('PUT', url, { ...opts, body }); }
  patch(url, body, opts) { return this.request('PATCH', url, { ...opts, body }); }
  delete(url, opts) { return this.request('DELETE', url, opts); }

  async request(method, url, { params, body, headers, signal, timeout = this.timeout } = {}) {
    let fullUrl = this.#buildUrl(url, params);
    let init = { method, headers: { Accept: 'application/json', ...this.headers, ...headers } };

    if (body !== undefined) {
      if (body instanceof FormData) {
        init.body = body;
      } else {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
      }
    }

    for (const fn of this.#interceptors.request) {
      ({ url: fullUrl, init } = (await fn({ url: fullUrl, init })) ?? { url: fullUrl, init });
    }

    const controller = new AbortController();
    const onAbort = () => controller.abort(signal.reason);
    if (signal) {
      if (signal.aborted) controller.abort(signal.reason);
      else signal.addEventListener('abort', onAbort, { once: true });
    }
    const timer = setTimeout(() => controller.abort(new DOMException('Zaman aşımı', 'TimeoutError')), timeout);

    try {
      const res = await fetch(fullUrl, { ...init, signal: controller.signal });
      const type = res.headers.get('content-type') ?? '';
      const data = res.status === 204 ? null : type.includes('json') ? await res.json() : await res.text();

      if (!res.ok) {
        const message = (data && typeof data === 'object' && data.message) || res.statusText || `HTTP ${res.status}`;
        throw new HttpError(message, { status: res.status, data, url: fullUrl });
      }

      let out = { data, status: res.status, headers: res.headers };
      for (const fn of this.#interceptors.response) out = (await fn(out)) ?? out;
      return out.data;
    } catch (err) {
      const aborted = err?.name === 'AbortError' || err?.name === 'TimeoutError';
      if (!aborted) for (const fn of this.#interceptors.error) await fn(err);
      throw err;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }

  #buildUrl(url, params) {
    const isAbsolute = /^https?:\/\//i.test(url);
    let full = isAbsolute ? url : `${this.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
    if (params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v !== '' && v != null) qs.set(k, v);
      const s = qs.toString();
      if (s) full += (full.includes('?') ? '&' : '?') + s;
    }
    return full;
  }
}
