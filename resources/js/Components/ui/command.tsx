import React from 'react';

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  heading?: React.ReactNode;
}

interface CommandItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value?: string;
}

export const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
Command.displayName = 'Command';

export const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ placeholder = 'Type a command or search...', className = '', ...props }, ref) => (
    <div className="flex items-center border-b px-3">
      <input
        ref={ref}
        className={`flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
);
CommandInput.displayName = 'CommandInput';

export const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`max-h-[300px] overflow-y-auto overflow-x-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CommandList.displayName = 'CommandList';

export const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`py-6 text-center text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CommandEmpty.displayName = 'CommandEmpty';

export const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ children, heading, className = '', ...props }, ref) => (
    <div ref={ref} className={`overflow-hidden p-1 text-foreground ${className}`} {...props}>
      {heading && (
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          {heading}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
);
CommandGroup.displayName = 'CommandGroup';

export const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ children, value, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CommandItem.displayName = 'CommandItem';
