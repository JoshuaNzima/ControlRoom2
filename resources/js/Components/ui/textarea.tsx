import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-coin-500 focus:border-transparent dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-500 dark:shadow-none ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export default Textarea;


