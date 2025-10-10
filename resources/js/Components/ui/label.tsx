import * as React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ className = '', ...props }) => {
  return <label className={`text-sm font-medium text-gray-700 ${className}`} {...props} />;
};

export default Label;


