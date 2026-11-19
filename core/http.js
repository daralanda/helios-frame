/**
 * Helios Frame · fetch tabanlı HTTP istemcisi.
 *
 * - Zaman aşımı + AbortController (iptal edilebilir istekler)
 * - Yalnızca GET için geri çekilmeli (backoff) yeniden deneme
 * - CSRF token'ı (meta veya cookie'den) SADECE aynı origin'e giden yazma isteklerine eklenir
 * - credentials: 'same-origin' -> HttpOnly oturum cookie'si otomatik gider, başka siteye gitmez
 * - GET yanıtları için isteğe bağlı bellek içi önbellek (cache: ms)
 */

export class HttpError extends Error {
  constructor(status, message, data = null) {
    super(message || `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readCsrf(csrf) {
  if (!csrf) return null;
  if (csrf.meta) {
    const m = document.querySelector(`meta[name="${CSS.escape(csrf.meta)}"]`);
    if (m?.content) return m.content;
  }
  if (csrf.cookie) {
    const row = document.cookie.split('; ').find((r) => r.startsWith(`${csrf.cookie}=`));
    if (row) return decodeURIComponent(row.slice(csrf.cookie.length + 1));
  }
  return null;
}

export function createHttp({
  baseURL = '',
  timeout = 15000,
  retries = 1,
  headers = {},
  csrf = { meta: 'csrf-token', cookie: 'XSRF-TOKEN', header: 'X-XSRF-TOKEN' },
  onUnauthorized = null,
} = {}) {
  const cache = new Map();
  const base = new URL(baseURL || './', document.baseURI);
  if (!base.pathname.endsWith('/')) base.pathname += '/';

  async function request(method, path, opts = {}) {
    const { body, query, signal, headers: extra, cache: ttl = 0, timeout: t = timeout } = opts;
    // "data/x.json" -> baseURL'e göre, "/api/x" -> origin köküne göre çözülür
    const url = new URL(String(path), base);
    if (query) {
      for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }

    const key = `${url.href}`;
    if (method === 'GET' && ttl > 0) {
      const hit = cache.get(key);
      if (hit && hit.exp > Date.now()) return structuredClone(hit.data);
    }

    const h = { Accept: 'application/json', 'X-Requested-With': 'fetch', ...headers, ...extra };
    const isRawBody = body instanceof FormData || body instanceof Blob || body instanceof URLSearchParams;
    let payload;
    if (body !== undefined) {
      payload = isRawBody ? body : JSON.stringify(body);
      if (!isRawBody) h['Content-Type'] = 'application/json';
    }
    const sameOrigin = url.origin === location.origin;
    if (method !== 'GET' && method !== 'HEAD' && sameOrigin) {
      const token = readCsrf(csrf);
      if (token) h[csrf.header || 'X-XSRF-TOKEN'] = token;
    }

    let attempt = 0;
    for (;;) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(new DOMException('Zaman aşımı', 'TimeoutError')), t);
      const relay = () => ctrl.abort(signal.reason);
      signal?.addEventListener('abort', relay, { once: true });
      try {
        const res = await fetch(url, {
          method,
          headers: h,
          body: payload,
          credentials: sameOrigin ? 'same-origin' : 'omit',
          signal: ctrl.signal,
          referrerPolicy: 'strict-origin-when-cross-origin',
        });
        if (res.status === 401) onUnauthorized?.(res);
        const type = res.headers.get('content-type') || '';
        const data = res.status === 204 ? null : type.includes('json') ? await res.json() : await res.text();
        if (!res.ok) {
          if (method === 'GET' && res.status >= 500 && attempt < retries) {
            attempt++; await sleep(250 * 2 ** attempt); continue;
          }
          throw new HttpError(res.status, (data && data.message) || res.statusText, data);
        }
        if (method === 'GET' && ttl > 0) cache.set(key, { exp: Date.now() + ttl, data: structuredClone(data) });
        return data;
      } catch (err) {
        if (err instanceof HttpError || signal?.aborted) throw err;
        if (method === 'GET' && attempt < retries && err.name !== 'TimeoutError') {
          attempt++; await sleep(250 * 2 ** attempt); continue;
        }
        throw err;
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', relay);
      }
    }
  }

  return {
    request,
    get: (p, o) => request('GET', p, o),
    post: (p, body, o) => request('POST', p, { ...o, body }),
    put: (p, body, o) => request('PUT', p, { ...o, body }),
    patch: (p, body, o) => request('PATCH', p, { ...o, body }),
    delete: (p, o) => request('DELETE', p, o),
    clearCache: () => cache.clear(),
  };
}
