import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

// Global axios
window.axios = axios;

declare global {
  interface Window {
    Pusher?: any;
    Echo?: any;
    appKey?: string;
    pusherCluster?: string;
  }
}

window.Pusher = (Pusher as any)?.default || Pusher;

try {
  if (!window.Echo && window.appKey) {
    window.Echo = new Echo({
      broadcaster: 'pusher',
      key: window.appKey,
      cluster: window.pusherCluster,
      forceTLS: true,
    });

  }
} catch {}

// Provide a safe Echo stub so any consumer calling Echo.socketId() won't crash when Pusher isn't configured
if (!window.Echo) {
  (window as any).Echo = { socketId: () => '' };
}

// Helper to safely read the current socket id
const __safeSocketId = (): string => {
  try {
    const e: any = (window as any).Echo;
    if (e && typeof e.socketId === 'function') {
      const id = e.socketId();
      return typeof id === 'string' ? id : '';
    }
  } catch {}
  return '';
};

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

// Attach X-Socket-Id header when available to let Laravel avoid broadcasting to the same socket
axios.interceptors.request.use((config) => {
  try {
    const sid = __safeSocketId();
    if (sid) {
      (config.headers as any) = config.headers || {};
      (config.headers as any)['X-Socket-Id'] = sid;
    }
  } catch {}
  return config;
});

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
