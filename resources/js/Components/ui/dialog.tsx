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
    return React.cloneElement(children, { onClick: handleClick });
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
    <Modal show={ctx.open} onClose={() => ctx.setOpen(false)}>
      <div className={`p-4 ${className}`}>{children}</div>
    </Modal>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-4 pb-2 border-b bg-white">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-gray-900">{children}</h3>;
}

export default Dialog;


