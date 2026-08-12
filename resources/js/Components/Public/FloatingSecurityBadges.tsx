import { useEffect, useRef } from "react";

interface Badge {
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  delay: number;
  type: "shield" | "lock" | "camera" | "eye" | "radar" | "fingerprint";
  opacity: number;
}

const BADGE_TYPES = ["shield", "lock", "camera", "eye", "radar", "fingerprint"] as const;

export default function FloatingSecurityBadges({
  count = 8,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Remove any existing badges
    container.innerHTML = "";

    const badges: Badge[] = [];
    const w = () => container.offsetWidth;
    const h = () => container.offsetHeight;

    for (let i = 0; i < count; i++) {
      badges.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 16 + 12,
        rotation: Math.random() * 360,
        speed: Math.random() * 0.3 + 0.15,
        delay: Math.random() * 8,
        type: BADGE_TYPES[i % BADGE_TYPES.length],
        opacity: Math.random() * 0.15 + 0.04,
      });
    }

    // SVG paths for each badge type
    const paths: Record<string, string> = {
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
      camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
      eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      radar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1010 10"/><path d="M12 6a6 6 0 106 6"/><path d="M12 10a2 2 0 102 2"/></svg>',
      fingerprint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12A10 10 0 0112 2"/><path d="M2 12a10 10 0 0110 10"/><path d="M22 12A10 10 0 0012 2"/><path d="M22 12a10 10 0 01-10 10"/><path d="M12 22c-2.2 0-4-1.8-4-4"/><path d="M12 22c2.2 0 4-1.8 4-4"/><path d="M12 22v-6"/></svg>',
    };

    badges.forEach((badge, i) => {
      const el = document.createElement("div");
      el.className = "absolute pointer-events-none";
      el.style.width = `${badge.size}px`;
      el.style.height = `${badge.size}px`;
      el.style.left = `${badge.x}%`;
      el.style.top = `${badge.y}%`;
      el.style.opacity = `${badge.opacity}`;
      el.style.color = "#e04b3f";
      el.style.transform = `rotate(${badge.rotation}deg)`;
      el.style.animation = `float-security-badge ${6 + badge.speed * 10}s ease-in-out ${badge.delay}s infinite`;
      el.innerHTML = paths[badge.type];
      container.appendChild(el);
    });

    return () => {
      container.innerHTML = "";
    };
  }, [count]);

  return (
    <>
      <style>{`
        @keyframes float-security-badge {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-18px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-22px) rotate(4deg); }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      />
    </>
  );
}
