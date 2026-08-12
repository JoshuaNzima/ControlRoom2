"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

function Counter({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-coin-gold">{value}</div>
      <div className="mt-1.5 text-sm text-coin-muted">{label}</div>
    </div>
  );
}

const values = [
  {
    title: "Integrity",
    description: "We operate with unwavering honesty and transparency in every engagement.",
  },
  {
    title: "Excellence",
    description: "Continuous training and investment in technology ensure we deliver the highest standard of service.",
  },
  {
    title: "Community",
    description: "As a Malawian company, we are deeply invested in the safety and prosperity of our local communities.",
  },
  {
    title: "Innovation",
    description: "We leverage modern technology — AI monitoring, GPS tracking — to stay ahead of threats.",
  },
];

const timeline = [
  { year: "2012", event: "Coin Security founded in Lilongwe" },
  { year: "2015", event: "Expanded to Blantyre & Mzuzu" },
  { year: "2019", event: "Launched off-site CCTV monitoring center" },
  { year: "2023", event: "1,200+ personnel, 500+ clients served" },
];

export default function About() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  return (
    <section id="about" className="relative py-28 md:py-36 bg-coin-dark">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-radial opacity-40" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeading
            label="About Us"
            title="Malawi's Trusted Security Partner"
            description="With over a decade of experience, Coin Security has protected businesses, events, and communities across Malawi with unwavering dedication."
          />
        </AnimatedSection>

        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Story */}
          <AnimatedSection direction="left">
            <div className="space-y-5">
              <p className="text-base md:text-lg text-coin-muted leading-relaxed">
                Founded in <span className="text-coin-text font-semibold">Lilongwe, Malawi</span> in 2012, Coin Security
                started with a simple mission: provide world-class security services that local businesses could
                trust. What began as a small team of 20 guards has grown into one of Malawi's leading
                security providers.
              </p>
              <p className="text-base md:text-lg text-coin-muted leading-relaxed">
                Today, we deploy over <span className="text-coin-text font-semibold">1,200 trained personnel</span>{" "}
                across the country, protecting everything from corporate headquarters and retail chains to
                major public events and private residences. Our investments in technology — including our
                state-of-the-art remote monitoring center — allow us to offer a level of protection that
                was once only available to large corporations.
              </p>
              <p className="text-base md:text-lg text-coin-muted leading-relaxed">
                But our growth hasn't changed our values. Every client, whether a small shop or a
                multinational, receives the same commitment to excellence, integrity, and personalized
                service that has defined us from day one.
              </p>

              {/* Core Values */}
              <div className="pt-6 grid sm:grid-cols-2 gap-4">
                {values.map((v) => (
                  <div key={v.title} className="p-4 rounded-xl border border-coin-border bg-coin-card/40">
                    <h4 className="font-semibold text-coin-text text-sm mb-1">{v.title}</h4>
                    <p className="text-xs text-coin-muted leading-relaxed">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Timeline + Stats */}
          <AnimatedSection direction="right" delay={0.2}>
            <div className="space-y-8">
              {/* Stats Grid */}
              <div
                ref={statsRef}
                className="grid grid-cols-2 gap-4 p-6 rounded-2xl border border-coin-border bg-coin-card/60"
              >
                <Counter value={statsInView ? "12+" : "0"} label="Years of Experience" />
                <Counter value={statsInView ? "500+" : "0"} label="Clients Served" />
                <Counter value={statsInView ? "1,200+" : "0"} label="Security Personnel" />
                <Counter value={statsInView ? "4" : "0"} label="Regional Offices" />
              </div>

              {/* Timeline */}
              <div className="space-y-0">
                <h4 className="text-sm font-semibold text-coin-text mb-4">Our Journey</h4>
                {timeline.map((item, i) => (
                  <div key={item.year} className="flex gap-4 pb-5 last:pb-0 relative">
                    {/* Line connector */}
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-coin-gold/20" />
                    )}
                    {/* Dot */}
                    <div className="relative z-10 mt-1 w-[15px] h-[15px] rounded-full border-2 border-coin-gold bg-coin-dark shrink-0 flex items-center justify-center">
                      <div className="w-[5px] h-[5px] rounded-full bg-coin-gold" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-coin-gold">{item.year}</span>
                      <p className="text-sm text-coin-muted">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
