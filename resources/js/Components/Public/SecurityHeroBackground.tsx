import SecurityCanvasBackground from "./SecurityCanvasBackground";
import FloatingSecurityBadges from "./FloatingSecurityBadges";

interface Props {
  showCanvas?: boolean;
  showBadges?: boolean;
  showImage?: boolean;
  imageSrc?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function SecurityHeroBackground({
  showCanvas = true,
  showBadges = true,
  showImage = false,
  imageSrc = "/images/compound.png",
  className = "",
  children,
}: Props) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-coin-dark via-coin-dark to-coin-surface" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-50" />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-gradient-radial opacity-60" />

      {/* Background image */}
      {showImage && (
        <div className="absolute inset-0">
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover opacity-[0.06]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-coin-dark/80 via-coin-dark/50 to-coin-dark/80" />
        </div>
      )}

      {/* Animated scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/20 to-transparent animate-scan-line" />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-coin-accent/10 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-coin-accent/10 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-coin-accent/10 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-coin-accent/10 rounded-br-3xl" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-coin-accent/4 blur-3xl animate-pulse-glow" />
      <div
        className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-coin-accent/3 blur-3xl animate-pulse-glow"
        style={{ animationDelay: "2s" }}
      />

      {/* Floating geometric accents */}
      <div className="absolute top-20 left-[8%] w-16 h-16 border border-coin-accent/8 rounded-lg rotate-12 animate-float-slow hidden md:block" />
      <div className="absolute bottom-40 right-[6%] w-12 h-12 border border-coin-accent/8 rounded-full animate-float-medium hidden md:block" />
      <div
        className="absolute top-1/3 right-[12%] w-8 h-8 border border-coin-accent/6 rounded-lg -rotate-6 animate-float-slow hidden lg:block"
        style={{ animationDelay: "5s" }}
      />

      {/* Canvas particle system */}
      {showCanvas && <SecurityCanvasBackground />}

      {/* Floating security badges */}
      {showBadges && <FloatingSecurityBadges count={8} />}

      {/* Content */}
      {children}
    </div>
  );
}
