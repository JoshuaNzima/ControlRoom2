import * as React from 'react';

type SelectContextValue = {
  value: string | undefined;
  setValue: (value: string | undefined) => void;
  registerItem: (item: { value: string; label: string }) => void;
  items: Array<{ value: string; label: string }>;
  placeholder?: string;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(value);
  const [items, setItems] = React.useState<Array<{ value: string; label: string }>>([]);
  const [placeholder, setPlaceholder] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const setValue = (next: string | undefined) => {
    setInternalValue(next);
    if (next !== undefined && onValueChange) onValueChange(next);
  };

  const registerItem = (item: { value: string; label: string }) => {
    setItems(prev => {
      const exists = prev.some(i => i.value === item.value);
      return exists ? prev : [...prev, item];
    });
  };

  return (
    <SelectContext.Provider value={{ value: internalValue, setValue, registerItem, items, placeholder }}>
      {/* Capture placeholder from SelectValue if provided via prop */}
      {/* Children will render trigger/value/content structure */}
      {children}
    </SelectContext.Provider>
  );
};

export interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ className = '', children, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    return (
      <div
        ref={ref}
        className={`relative flex h-9 w-full items-center justify-between rounded-lg border border-gray-300 px-3 text-sm text-gray-900 focus-within:ring-2 focus-within:ring-indigo-500 ${className}`}
        {...props}
      >
        {/* Visual value/placeholder */}
        <div className="pointer-events-none flex-1 truncate">
          <SelectValue />
        </div>
        <div className="pointer-events-none ml-2 text-gray-400">▾</div>
        {/* Native select overlays to provide reliable dropdown behavior */}
        <select
          className="absolute inset-0 h-full w-full opacity-0"
          value={ctx?.value ?? ''}
          onChange={e => ctx?.setValue(e.target.value || undefined)}
        >
          {/* Placeholder option */}
          <option value="" disabled hidden>
            {ctx?.placeholder ?? ''}
          </option>
          {ctx?.items.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

export interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const ctx = React.useContext(SelectContext);
  React.useEffect(() => {
    // Store placeholder for the native select hidden option
    if (placeholder !== undefined && ctx) {
      // This is safe since placeholder only affects rendering
      (ctx as any).placeholder = placeholder;
    }
  }, [placeholder, ctx]);

  const label = React.useMemo(() => {
    const found = ctx?.items.find(i => i.value === ctx.value);
    return found?.label ?? placeholder ?? '';
  }, [ctx?.items, ctx?.value, placeholder]);

  return <span>{label}</span>;
};

export interface SelectContentProps {
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  // We rely on the native select for UI; this component only exists to allow
  // composition and to expose SelectItem children for registration.
  return <>{children}</>;
};

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children }) => {
  const ctx = React.useContext(SelectContext);
  React.useEffect(() => {
    if (!ctx) return;
    const label = typeof children === 'string' ? children : React.Children.toArray(children).join(' ');
    ctx.registerItem({ value, label: String(label) });
  }, [ctx, value, children]);

  // Render nothing visually; items are represented in the native select overlay
  return null;
};

export default Select;


