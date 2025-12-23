import axios from 'axios';

// Axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Global axios
window.axios = axios;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const config = error?.config;
    if (status === 419 && config && !(config as any).__isRetry) {
      try {
        await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
        const retryConfig: any = { ...config, __isRetry: true };
        return axios(retryConfig);
      } catch (e) {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    }
    return Promise.reject(error);
  }
);

const __getCookie = (name: string) => {
  const value = document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
  return value ? decodeURIComponent(value) : null;
};

const __origFetch = window.fetch.bind(window);
const __sameOrigin = (u: any) => {
  try {
    const x = new URL(u, window.location.href);
    return x.origin === window.location.origin;
  } catch {
    return true;
  }
};

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input instanceof Request ? input.url : String(input);
  let opts: RequestInit = { ...(init || {}) };
  if (__sameOrigin(url)) {
    let h = new Headers(opts.headers || (input instanceof Request ? (input.headers as any) : undefined) || {});
    if (!h.has('X-Requested-With')) h.set('X-Requested-With', 'XMLHttpRequest');
    const xsrf = __getCookie('XSRF-TOKEN');
    if (xsrf) {
      h.set('X-XSRF-TOKEN', xsrf);
      h.delete('X-CSRF-TOKEN');
    } else if (!h.has('X-CSRF-TOKEN')) {
      const m = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
      if (m) h.set('X-CSRF-TOKEN', m);
    }
    opts.headers = h;
    if (!opts.credentials) opts.credentials = 'same-origin';
  }
  let res = await __origFetch(input as any, opts);
  if (res.status === 419 && __sameOrigin(url)) {
    try { await axios.get('/sanctum/csrf-cookie', { withCredentials: true }); } catch {}
    if (__sameOrigin(url)) {
      let h2 = new Headers(opts.headers || {});
      const xsrf2 = __getCookie('XSRF-TOKEN');
      if (xsrf2) {
        h2.set('X-XSRF-TOKEN', xsrf2);
        h2.delete('X-CSRF-TOKEN');
      }
      opts.headers = h2;
    }
    res = await __origFetch(input as any, opts);
    if (res.status === 419) {
      if (typeof window !== 'undefined') window.location.reload();
    }
  }
  return res;
};
