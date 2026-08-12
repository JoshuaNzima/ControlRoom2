"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles
    const count = 60;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.offsetWidth) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.offsetHeight) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 158, 11, ${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(245, 158, 11, ${0.06 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-coin-dark"
    >
      {/* Background layer */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute inset-0 bg-gradient-radial opacity-70" />

      {/* Animated particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Decorative glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-coin-gold/5 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-coin-gold/4 blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />

      {/* Floating geometric accents */}
      <div className="absolute top-20 left-[10%] w-16 h-16 border border-coin-gold/10 rounded-lg rotate-12 animate-float-slow hidden md:block" />
      <div className="absolute bottom-40 right-[8%] w-12 h-12 border border-coin-gold/10 rounded-full animate-float-medium hidden md:block" />
      <div className="absolute top-1/3 right-[15%] w-8 h-8 border border-coin-gold/8 rounded-lg -rotate-6 animate-float-slow hidden lg:block" style={{ animationDelay: "5s" }} />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-coin-gold/20 bg-coin-glow text-xs font-medium text-coin-gold mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coin-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-coin-gold" />
            </span>
            Trusted Security Partner in Malawi
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-coin-text">
            Protecting What{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-coin-gold">Matters Most</span>
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-coin-gold/15 rounded-full blur-sm" />
            </span>
            <br />
            Across Malawi
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-coin-muted max-w-2xl mx-auto leading-relaxed">
            Comprehensive security solutions tailored for your business — from
            expert guard services to intelligent surveillance systems. Your
            safety is our mission.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-coin-dark bg-coin-gold hover:bg-coin-gold-light rounded-xl transition-all duration-300 shadow-lg shadow-coin-glow overflow-hidden"
            >
              <span className="relative z-10">Get Your Free Consultation</span>
              <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-coin-text border border-coin-border hover:border-coin-gold/40 rounded-xl transition-all duration-300"
            >
              Our Services
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-coin-border pt-10"
        >
          {[
            { value: "500+", label: "Clients Protected" },
            { value: "12+", label: "Years Experience" },
            { value: "1,200+", label: "Security Personnel" },
            { value: "98%", label: "Client Retention" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-coin-gold">{stat.value}</div>
              <div className="mt-1 text-xs md:text-sm text-coin-muted">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-coin-muted">Scroll to explore</span>
        <div className="w-5 h-8 border border-coin-border rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-coin-gold/60 rounded-full animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
