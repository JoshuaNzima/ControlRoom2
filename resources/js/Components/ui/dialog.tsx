import React from 'react';
import Modal from '@/Components/Modal';

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }) {
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) return children;
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    ctx.setOpen(true);
  };
  if (asChild) {
    return React.cloneElement(children, { onClick: handleClick } as any);
  }
  return (
    <button onClick={handleClick} type="button">
      {children}
    </button>
  );
}

export function DialogContent({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) return null;
  return (
    <Modal show={ctx.open} onClose={() => ctx.setOpen(false)} closeable={true}>
      <div 
        className={`p-4 ${className}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </Modal>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-4 pb-2 border-b border-gray-100 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>{children}</h3>;
}

export function DialogFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-4 py-3 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row sm:justify-end gap-2 ${className}`}>{children}</div>;
}

export default Dialog;


