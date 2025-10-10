import React from 'react';
import * as Icons from 'lucide-react';

interface IconMapperProps {
  name?: string;
  size?: number;
  className?: string;
}

export default function IconMapper({ name, size = 22, className = '' }: IconMapperProps) {
  if (!name) return null;
  const key = name.charAt(0).toUpperCase() + name.slice(1);
  // Try common naming variations
  const candidates = [
    key,
    key.replace(/[-_ ]+(.)/g, (m, c) => c.toUpperCase()),
    name.toUpperCase(),
    name.toLowerCase(),
  ];

  for (const candidate of candidates) {
    if ((Icons as any)[candidate]) {
      const Comp = (Icons as any)[candidate];
      return <Comp size={size} className={className} />;
    }
  }

  // Fallback icon
  const Fallback = (Icons as any)['Grid'] || Object.values(Icons)[0];
  return <Fallback size={size} className={className} />;
}
