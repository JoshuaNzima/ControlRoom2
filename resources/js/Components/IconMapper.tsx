import React, { useEffect, useState } from 'react';

// Load lucide-react dynamically to avoid runtime issues when chunks are split and
// the namespace may not be available synchronously in some build outputs.
type IconsModule = Record<string, any> | null;

interface IconMapperProps {
  name?: string;
  size?: number;
  className?: string;
}

export default function IconMapper({ name, size = 22, className = '' }: IconMapperProps) {
  const [icons, setIcons] = useState<IconsModule>(null);

  useEffect(() => {
    let mounted = true;
    import('lucide-react').then((mod) => {
      if (mounted) setIcons(mod as Record<string, any>);
    }).catch(() => {
      if (mounted) setIcons(null);
    });
    return () => { mounted = false; };
  }, []);

  if (!name) return null;
  if (!icons) return null; // not loaded yet

  const key = name.charAt(0).toUpperCase() + name.slice(1);
  const candidates = [
    key,
    key.replace(/[-_ ]+(.)/g, (m, c) => c.toUpperCase()),
    name.toUpperCase(),
    name.toLowerCase(),
  ];

  for (const candidate of candidates) {
    if ((icons as any)[candidate]) {
      const Comp = (icons as any)[candidate];
      return <Comp size={size} className={className} />;
    }
  }

  // Fallback icon (Grid or first available)
  const Fallback = (icons as any)['Grid'] || Object.values(icons)[0];
  if (!Fallback) return null;
  return <Fallback size={size} className={className} />;
}
