import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Props {
  imageSrc?: string;
  className?: string;
  /** How much slower the parallax moves relative to scroll (default 0.5) */
  speed?: number;
  /** Maximum opacity for the image (default 0.04) */
  opacity?: number;
  children?: React.ReactNode;
}

/**
 * Replaces the old inline <img> pattern with a true parallax scroll effect.
 * The image moves at a different speed than content, creating depth.
 * If no imageSrc is provided, renders nothing (for sections that don't need it).
 */
export default function ParallaxSectionBg({
  imageSrc = '/images/compound.png',
  className = '',
  speed = 0.5,
  opacity = 0.04,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);

  if (!imageSrc) return <>{children}</>;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0"
          style={{ y }}
        >
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity }}
            aria-hidden="true"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent" />
      </div>
      {children}
    </div>
  );
}
