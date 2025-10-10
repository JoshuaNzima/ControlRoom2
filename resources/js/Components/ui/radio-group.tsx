import * as React from 'react';

export const RadioGroupContext = React.createContext<{
  value: string;
  onChange: (value: string) => void;
} | null>(null);

export function RadioGroup({ value, onValueChange, className = '', children }: { value: string; onValueChange: (v: string) => void; className?: string; children: React.ReactNode }) {
  return (
    <div className={className} role="radiogroup">
      <RadioGroupContext.Provider value={{ value, onChange: onValueChange }}>{children}</RadioGroupContext.Provider>
    </div>
  );
}

export function RadioGroupItem({ id, value }: { id: string; value: string }) {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx) return null;
  return (
    <input
      type="radio"
      id={id}
      name="qr-radio"
      value={value}
      checked={ctx.value === value}
      onChange={() => ctx.onChange(value)}
      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
    />
  );
}

export default RadioGroup;


