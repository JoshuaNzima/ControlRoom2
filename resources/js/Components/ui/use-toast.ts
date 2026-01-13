import { toast as hotToast } from 'react-hot-toast';

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = (opts: ToastOptions) => {
    // Minimal fallback toast using alert; replace with your UI library's toast system
    const msg = `${opts.title ? opts.title + '\n' : ''}${opts.description ?? ''}`.trim();
    if (msg) {
      if (opts.variant === 'destructive') {
        hotToast.error(msg);
      } else {
        hotToast(msg);
      }
    }
  };
  return { toast };
}

export default useToast;


