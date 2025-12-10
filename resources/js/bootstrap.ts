import axios from 'axios';

// Axios defaults
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';
const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
if (csrf) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = csrf;
}

// Global axios
window.axios = axios;
