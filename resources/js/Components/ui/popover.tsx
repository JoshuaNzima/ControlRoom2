import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const PopoverContext = createContext<PopoverContextValue | undefined>(undefined);

interface PopoverProps {
  children: React.ReactNode;
}

interface PopoverTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export const Popover = ({ children }: PopoverProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ asChild = false, children, ...props }, ref) => {
    const context = useContext(PopoverContext);
    if (!context) {
      throw new Error('PopoverTrigger must be used within a Popover component');
    }

    const handleClick = () => {
      context.setOpen(!context.open);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ref: (node: HTMLElement) => {
          context.triggerRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        },
        onClick: handleClick,
        ...props,
      } as any);
    }

    return (
      <button
        ref={ref as any}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);
PopoverTrigger.displayName = 'PopoverTrigger';

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, side = 'bottom', align = 'center', className = '', ...props }, ref) => {
    const context = useContext(PopoverContext);
    if (!context) {
      throw new Error('PopoverContent must be used within a Popover component');
    }

    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
      if (context.open && context.triggerRef.current) {
        const triggerRect = context.triggerRef.current.getBoundingClientRect();
        const contentHeight = 200; // Approximate height
        const contentWidth = 300; // Approximate width

        let top = 0;
        let left = 0;

        switch (side) {
          case 'top':
            top = triggerRect.top - contentHeight - 8;
            break;
          case 'bottom':
            top = triggerRect.bottom + 8;
            break;
          case 'left':
            left = triggerRect.left - contentWidth - 8;
            top = triggerRect.top;
            break;
          case 'right':
            left = triggerRect.right + 8;
            top = triggerRect.top;
            break;
        }

        switch (align) {
          case 'start':
            if (side === 'top' || side === 'bottom') {
              left = triggerRect.left;
            } else {
              top = triggerRect.top;
            }
            break;
          case 'end':
            if (side === 'top' || side === 'bottom') {
              left = triggerRect.right - contentWidth;
            } else {
              top = triggerRect.bottom - contentHeight;
            }
            break;
          case 'center':
          default:
            if (side === 'top' || side === 'bottom') {
              left = triggerRect.left + triggerRect.width / 2 - contentWidth / 2;
            } else {
              top = triggerRect.top + triggerRect.height / 2 - contentHeight / 2;
            }
            break;
        }

        setPosition({ top, left });
      }
    }, [context.open, side, align]);

    if (!context.open) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={`fixed z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PopoverContent.displayName = 'PopoverContent';
