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
      // eslint-disable-next-line no-alert
      alert(msg);
    }
  };
  return { toast };
}

export default useToast;


