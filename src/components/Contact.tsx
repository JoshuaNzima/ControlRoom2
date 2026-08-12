"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "./AnimatedSection";
import SectionHeading from "./SectionHeading";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section id="contact" className="relative py-28 md:py-36 bg-coin-dark">
      <div className="absolute inset-0 bg-gradient-radial opacity-50" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeading
            label="Contact Us"
            title="Let's Talk About Your Security Needs"
            description="Whether you need a quote, a consultation, or immediate assistance — our team is ready to help."
          />
        </AnimatedSection>

        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Form */}
          <AnimatedSection direction="left">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-full min-h-[360px] rounded-2xl border border-coin-gold/20 bg-coin-card/60 p-10 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-coin-gold/15 flex items-center justify-center mb-5">
                  <svg className="w-8 h-8 text-coin-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-coin-text mb-2">Message Sent!</h3>
                <p className="text-coin-muted text-sm">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-coin-muted mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-gold/50 focus:ring-1 focus:ring-coin-gold/20 transition-all duration-300"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-coin-muted mb-1.5">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-gold/50 focus:ring-1 focus:ring-coin-gold/20 transition-all duration-300"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-coin-muted mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-gold/50 focus:ring-1 focus:ring-coin-gold/20 transition-all duration-300"
                    placeholder="+265 99 123 4567"
                  />
                </div>
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-coin-muted mb-1.5">
                    Service Interested In
                  </label>
                  <select
                    id="service"
                    className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-gold/50 focus:ring-1 focus:ring-coin-gold/20 transition-all duration-300"
                  >
                    <option value="">Select a service...</option>
                    <option value="man-guarding">Man Guarding</option>
                    <option value="event-security">Event Security</option>
                    <option value="rapid-response">Rapid Response</option>
                    <option value="cctv-monitoring">Off-Site CCTV Monitoring</option>
                    <option value="other">Other / Not Sure</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-coin-muted mb-1.5">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-gold/50 focus:ring-1 focus:ring-coin-gold/20 transition-all duration-300 resize-none"
                    placeholder="Tell us about your security needs..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-8 py-3.5 text-sm font-semibold text-coin-dark bg-coin-gold hover:bg-coin-gold-light rounded-xl transition-all duration-300 shadow-lg shadow-coin-glow"
                >
                  Send Message
                </button>
              </form>
            )}
          </AnimatedSection>

          {/* Contact Info */}
          <AnimatedSection direction="right" delay={0.2}>
            <div className="space-y-8">
              <div className="p-8 rounded-2xl border border-coin-border bg-coin-card/60">
                <h3 className="text-lg font-bold text-coin-text mb-6">Contact Information</h3>
                <div className="space-y-5">
                  {[
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                      label: "Head Office",
                      value: "Area 10, Lilongwe, Malawi",
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      ),
                      label: "Phone",
                      value: "+265 1 234 567",
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      ),
                      label: "Email",
                      value: "info@coinsecurity.mw",
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                      label: "Hours",
                      value: "24/7 — We never close",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-coin-gold/10 text-coin-gold shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-xs text-coin-muted">{item.label}</div>
                        <div className="text-sm font-medium text-coin-text">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency CTA */}
              <div className="p-8 rounded-2xl border border-coin-gold/20 bg-coin-gold/5">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-coin-text mb-1">Emergency Response</h3>
                    <p className="text-xs text-coin-muted mb-3">
                      If you have an active security emergency, call our dispatch center immediately.
                    </p>
                    <a
                      href="tel:+2651234567"
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      +265 1 234 567
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
