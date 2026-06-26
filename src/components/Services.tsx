"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

const services = [
  {
    title: "Man Guarding",
    subtitle: "Professional Security Personnel",
    description:
      "Highly trained security guards deployed at your premises — 24/7 surveillance, access control, and incident response. Our personnel are vetted, trained, and equipped to handle any situation with professionalism and discretion.",
    features: [
      "24/7 on-site presence",
      "Access control & visitor management",
      "Patrol & incident reporting",
      "Armed & unarmed options",
    ],
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Event Security",
    subtitle: "Concert, Corporate & Private Events",
    description:
      "Comprehensive crowd management and security for events of all sizes — from corporate galas to music festivals. We ensure seamless execution so you can focus on what matters: your guests.",
    features: [
      "Crowd control & screening",
      "VIP protection details",
      "Bag search & metal detection",
      "Emergency evacuation protocols",
    ],
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 7h8m-8 4h5m-5 4h3" strokeLinecap="round" />
        <rect x="2" y="3" width="20" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Rapid Response",
    subtitle: "24/7 Emergency Dispatch",
    description:
      "When every second counts, our rapid response team is on standby. GPS-dispatched units reach your location in minutes, equipped to neutralize threats and secure your property.",
    features: [
      "GPS-tracked response units",
      "< 10 minute average arrival",
      "Direct police liaison",
      "Live status tracking",
    ],
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Off-Site CCTV Monitoring",
    subtitle: "Remote Surveillance Center",
    description:
      "State-of-the-art monitoring center staffed by trained operators who watch your cameras 24/7. Receive instant alerts for suspicious activity, with video evidence preserved for investigations.",
    features: [
      "Real-time remote monitoring",
      "AI-powered motion detection",
      "Cloud video storage (30 days)",
      "Instant breach alerts & dispatch",
    ],
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 7h.01" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 21h-6a4 4 0 01-4-4V7a4 4 0 014-4h6a4 4 0 014 4v10a4 4 0 01-4 4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 7v10a4 4 0 004 4h2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Services() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="services" className="relative py-28 md:py-36 bg-coin-surface">
      <div className="absolute inset-0 bg-grid opacity-40" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeading
            label="Our Services"
            title="Comprehensive Security Solutions"
            description="We offer a full spectrum of security services tailored to protect your business, assets, and people across Malawi."
          />
        </AnimatedSection>

        <div className="mt-16 grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <AnimatedSection key={service.title} delay={index * 0.1}>
              <div
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className="group relative h-full rounded-2xl border border-coin-border bg-coin-card/60 p-8 transition-all duration-500 hover:border-coin-gold/30 hover:bg-coin-card hover:shadow-lg hover:shadow-coin-glow/5"
              >
                {/* Hover glow */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-opacity duration-700 ${
                    activeIndex === index ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    background:
                      "radial-gradient(600px circle at 50% 0%, rgba(245,158,11,0.04), transparent 70%)",
                  }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-coin-gold/10 text-coin-gold group-hover:bg-coin-gold/20 transition-colors duration-300">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-coin-text">
                        {service.title}
                      </h3>
                      <p className="text-xs text-coin-muted">{service.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-sm text-coin-muted leading-relaxed mb-6">
                    {service.description}
                  </p>

                  <ul className="space-y-2.5">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-coin-text/80">
                        <svg
                          className="w-4 h-4 text-coin-gold mt-0.5 shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* CTA */}
        <AnimatedSection delay={0.4}>
          <div className="mt-16 text-center">
            <p className="text-coin-muted text-sm mb-4">
              Not sure which service fits your needs?
            </p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-coin-dark bg-coin-gold hover:bg-coin-gold-light rounded-xl transition-all duration-300 shadow-lg shadow-coin-glow"
            >
              Let Us Recommend a Plan
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
