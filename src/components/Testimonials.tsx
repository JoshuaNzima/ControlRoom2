"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const testimonials = [
  {
    quote:
      "Coin Security transformed our approach to workplace safety. Their guards are professional, well-trained, and the management team is incredibly responsive. We've been with them for 5 years and have never felt safer.",
    name: "Grace Banda",
    role: "Operations Director, Malawi Retail Group",
  },
  {
    quote:
      "We hired Coin Security for our annual music festival — over 15,000 attendees. Their crowd management and rapid response plan were flawless. No incidents, no complaints. Exceptional work.",
    name: "Michael Kamwendo",
    role: "Event Organizer, Lake of Stars Festival",
  },
  {
    quote:
      "The off-site CCTV monitoring service is a game-changer. We get instant alerts when something happens, and their operators spotted a break-in attempt before our own on-site guard did. Highly recommend.",
    name: "Chifundo Nkhoma",
    role: "CEO, Nkhoma Properties",
  },
  {
    quote:
      "As a small business owner, I was worried about the cost of professional security. Coin Security offered a package that fit our budget without cutting corners. Their team is always courteous and professional.",
    name: "Esther Phiri",
    role: "Owner, Phiri & Sons Hardware",
  },
  {
    quote:
      "Their rapid response team arrived at our premises within 8 minutes of an alarm activation. The thieves were apprehended before they could even load their vehicle. Worth every kwacha.",
    name: "John Mwale",
    role: "Manager, Mwale Logistics",
  },
];

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaused) return;

    let animationId: number;
    let startTime: number | null = null;
    const speed = 0.3; // pixels per frame

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      if (!el || isPaused) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Check if scrolled enough to loop
      if (el.scrollLeft >= el.scrollWidth / 2) {
        el.scrollLeft = 0;
      } else {
        el.scrollLeft += speed;
      }
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  return (
    <section id="testimonials" className="relative py-28 md:py-36 bg-coin-surface overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeading
            label="Testimonials"
            title="What Our Clients Say"
            description="Hear from the businesses and organizations that trust Coin Security with their safety every day."
          />
        </AnimatedSection>
      </div>

      {/* Infinite scroll carousel */}
      <div
        className="relative z-10 mt-16"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-hidden px-6 lg:px-8 cursor-grab active:cursor-grabbing"
          style={{ scrollBehavior: "auto" }}
        >
          {/* Duplicate for seamless loop */}
          {[...testimonials, ...testimonials].map((t, i) => (
            <div
              key={`${t.name}-${i}`}
              className="min-w-[350px] md:min-w-[420px] max-w-[420px] shrink-0 p-7 rounded-2xl border border-coin-border bg-coin-card/70"
            >
              {/* Quote icon */}
              <svg
                className="w-8 h-8 text-coin-gold/30 mb-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-sm md:text-base text-coin-muted leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-coin-gold/15 flex items-center justify-center text-coin-gold font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-coin-text">
                    {t.name}
                  </div>
                  <div className="text-xs text-coin-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-coin-surface to-transparent pointer-events-none z-20" />
      <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-coin-surface to-transparent pointer-events-none z-20" />
    </section>
  );
}
