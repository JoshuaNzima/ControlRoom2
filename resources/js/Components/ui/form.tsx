import React from 'react';

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ children, className = '', ...props }, ref) => (
    <form ref={ref} className={className} {...props}>
      {children}
    </form>
  )
);
Form.displayName = 'Form';

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`space-y-2 ${className}`} {...props}>
      {children}
    </div>
  )
);
FormField.displayName = 'FormField';

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ children, className = '', ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    >
      {children}
    </label>
  )
);
FormLabel.displayName = 'FormLabel';

export const FormControl = React.forwardRef<HTMLDivElement, FormControlProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);
FormControl.displayName = 'FormControl';

export const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ children, className = '', ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm font-medium text-destructive ${className}`}
      {...props}
    >
      {children}
    </p>
  )
);
FormMessage.displayName = 'FormMessage';
