// Simple PWA registration and update signaling
// Auto-runs on import

let reg: ServiceWorkerRegistration | null = null;
let updateAvailable = false;

function dispatchUpdateAvailable(r: ServiceWorkerRegistration) {
  updateAvailable = true;
  const evt = new CustomEvent('pwa:update-available', { detail: { registration: r } });
  window.dispatchEvent(evt);
}

export async function applyUpdate(): Promise<void> {
  try {
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }
    if (reg?.installing) {
      // wait until installing becomes waiting
      await new Promise<void>((resolve) => {
        const sw = reg!.installing!;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && reg?.waiting) {
            reg!.waiting!.postMessage({ type: 'SKIP_WAITING' });
            resolve();
          }
        });
      });
    }
  } catch {}
}

function register() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        reg = registration;

        // New update found
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              dispatchUpdateAvailable(registration);
            }
          });
        });

        // If already waiting (e.g., page reloaded after deploy)
        if (registration.waiting) {
          dispatchUpdateAvailable(registration);
        }

        // When the new SW takes control, reload once
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      })
      .catch(() => {});
  });
}

register();

export function getRegistration() {
  return reg;
}
