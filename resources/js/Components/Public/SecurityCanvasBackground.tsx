import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  density?: number;
  color?: string;
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  type: "node" | "shield" | "signal";
  pulse: number;
}

export default function SecurityCanvasBackground({
  className = "",
  density = 50,
  color = "#e04b3f",
  speed = 0.3,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    let time = 0;
    let mouseX = -1000;
    let mouseY = -1000;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", onMouse);

    // Create particles
    const count = density;
    const w = () => canvas!.offsetWidth;
    const h = () => canvas!.offsetHeight;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.5 + 0.15,
        type: i % 8 === 0 ? "shield" : i % 5 === 0 ? "signal" : "node",
        pulse: Math.random() * Math.PI * 2,
      });
    }

    // Draw a small shield icon at position
    const drawShield = (x: number, y: number, s: number, a: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s / 12, s / 12);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = a * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(-8, -6);
      ctx.lineTo(-8, 2);
      ctx.quadraticCurveTo(-8, 8, 0, 12);
      ctx.quadraticCurveTo(8, 8, 8, 2);
      ctx.lineTo(8, -6);
      ctx.closePath();
      ctx.stroke();
      // Inner check
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-1, 3);
      ctx.lineTo(4, -3);
      ctx.stroke();
      ctx.restore();
    };

    // Draw a signal/camera icon
    const drawSignal = (x: number, y: number, s: number, a: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s / 8, s / 8);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = a * 0.5;
      // Circle with dot (camera lens)
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.stroke();
      // Mount
      ctx.beginPath();
      ctx.moveTo(-3, 6);
      ctx.lineTo(3, 6);
      ctx.lineTo(4, 9);
      ctx.lineTo(-4, 9);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      time += 0.005;
      const cw = canvas!.offsetWidth;
      const ch = canvas!.offsetHeight;
      ctx.clearRect(0, 0, cw, ch);

      // Draw faint radar grid
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.03;
      ctx.lineWidth = 0.5;
      const gridSize = 80;
      for (let x = 0; x < cw; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }
      for (let y = 0; y < ch; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // Radar sweep arc (subtle)
      const sweepAngle = (time * 0.5) % (Math.PI * 2);
      ctx.save();
      ctx.translate(cw * 0.85, ch * 0.2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, Math.min(cw, ch) * 0.4, sweepAngle - 0.3, sweepAngle + 0.1);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.015;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sweepAngle) * Math.min(cw, ch) * 0.4, Math.sin(sweepAngle) * Math.min(cw, ch) * 0.4);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.08;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.04 * (1 - dist / 140);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        p.pulse += 0.02;
        p.x += p.vx;
        p.y += p.vy;

        // Mouse interaction
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        if (mouseDist < 120) {
          const force = (120 - mouseDist) / 120;
          p.vx += (dx / mouseDist) * force * 0.05;
          p.vy += (dy / mouseDist) * force * 0.05;
        }

        // Friction
        p.vx *= 0.999;
        p.vy *= 0.999;

        // Boundaries
        if (p.x < 0) p.x = cw;
        if (p.x > cw) p.x = 0;
        if (p.y < 0) p.y = ch;
        if (p.y > ch) p.y = 0;

        const pulseAlpha = p.alpha + Math.sin(p.pulse) * 0.1;

        if (p.type === "shield") {
          drawShield(p.x, p.y, p.size * 5, pulseAlpha);
        } else if (p.type === "signal") {
          drawSignal(p.x, p.y, p.size * 4, pulseAlpha);
        } else {
          // Node dot with glow
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, "transparent");
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.globalAlpha = pulseAlpha * 0.3;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.globalAlpha = pulseAlpha * 0.8;
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [density, color, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
