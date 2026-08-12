import React from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import AnimatedSection from '@/Components/Public/AnimatedSection';
import AnimatedCounter from '@/Components/Public/AnimatedCounter';
import SecurityHeroBackground from '@/Components/Public/SecurityHeroBackground';

const stats = [
  { value: 500, suffix: '+', label: 'Clients Protected' },
  { value: 12, suffix: '+', label: 'Years Experience' },
  { value: 1200, suffix: '+', label: 'Security Personnel' },
  { value: 98, suffix: '%', label: 'Client Retention' },
];

const timeline = [
  { year: '2012', event: 'Coin Security founded in Lilongwe' },
  { year: '2015', event: 'Expanded to Blantyre & Mzuzu' },
  { year: '2019', event: 'Launched off-site CCTV monitoring center' },
  { year: '2023', event: '1,200+ personnel, 500+ clients served' },
];

const values = [
  { title: 'Integrity', description: 'Honesty and transparency in every engagement.' },
  { title: 'Excellence', description: 'Continuous training and technology investment for the highest service standard.' },
  { title: 'Community', description: 'Deeply invested in the safety and prosperity of Malawian communities.' },
  { title: 'Innovation', description: 'AI monitoring, GPS tracking — staying ahead of threats.' },
];

export default function About() {
  return (
    <PublicLayout title="About — Coin Security">
      <Head title="About" />
      <SecurityHeroBackground showImage showCanvas showBadges className="pt-28 pb-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-accent bg-coin-accent/10 px-4 py-1.5 rounded-full mb-4">About</div>
            <h1 className="text-4xl md:text-5xl font-bold text-coin-text">About Coin Security</h1>
            <p className="mt-4 text-coin-muted max-w-2xl text-lg">Professional security services backed by technology, process discipline, and a customer-first culture.</p>
          </motion.div>
        </div>
      </SecurityHeroBackground>

      {/* Stats bar */}
      <section className="relative py-12 bg-white border-b border-coin-border overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <AnimatedSection key={s.label} delay={i * 0.08}>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-coin-accent">
                    <AnimatedCounter end={s.value} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-sm text-coin-muted">{s.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 bg-coin-surface overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/15 to-transparent animate-scan-line" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Values grid */}
          <AnimatedSection>
            <div className="text-center mb-8">
              <div className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-accent bg-coin-accent/10 px-4 py-1.5 rounded-full mb-4">
                Our Values
              </div>
              <h2 className="text-3xl font-bold text-coin-text">What Drives Us</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <AnimatedSection key={v.title} delay={i * 0.08}>
                <div className="rounded-2xl border border-coin-border p-6 bg-white shadow-sm h-full transition-all duration-300 hover:border-coin-accent/30 hover:shadow-card-hover hover-lift">
                  <h4 className="text-lg font-semibold text-coin-text mb-2">{v.title}</h4>
                  <p className="text-coin-muted text-sm leading-relaxed">{v.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Core pillars */}
          <AnimatedSection delay={0.1}>
            <div className="text-center mb-8">
              <div className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-accent bg-coin-accent/10 px-4 py-1.5 rounded-full mb-4">
                Why Choose Us
              </div>
              <h2 className="text-3xl font-bold text-coin-text">Our Core Pillars</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{icon:'Shield',title:'Licensed & Vetted',desc:'All personnel are licensed, background-checked, and continuously trained.'},{icon:'Activity',title:'Operational Excellence',desc:'Clear SLAs, post orders, and digital reporting for accountability.'},{icon:'Headphones',title:'24/7 Support',desc:'Always-on support for incidents, escalations, and service updates.'}].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="group rounded-2xl border border-coin-border p-6 bg-white shadow-sm transition-all duration-300 hover:border-coin-accent/30 hover:shadow-card-hover hover-lift">
                  <div className="w-12 h-12 rounded-xl bg-coin-accent text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconMapper name={item.icon} className="w-6 h-6" />
                  </div>
                  <div className="mt-4 text-lg font-semibold text-coin-text">{item.title}</div>
                  <div className="mt-1 text-coin-muted">{item.desc}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* About text */}
          <AnimatedSection delay={0.15}>
            <div className="rounded-2xl border border-coin-border p-8 bg-white shadow-sm">
              <div className="text-coin-muted leading-relaxed space-y-4">
                <p className="text-base">We combine trained security professionals with live monitoring, modern tooling, and data to protect people and property.</p>
                <p className="text-base">Our operating model emphasizes preventive controls, rapid incident response, and transparent reporting. We adapt to your risk profile and scale services as your needs evolve.</p>
              </div>
            </div>
          </AnimatedSection>

          {/* Timeline */}
          <AnimatedSection delay={0.2}>
            <div className="rounded-2xl border border-coin-border p-8 bg-white shadow-sm">
              <h3 className="text-lg font-bold text-coin-text mb-6 text-center">Our Journey</h3>
              <div className="max-w-lg mx-auto space-y-0">
                {timeline.map((item, i) => (
                  <div key={item.year} className="flex gap-4 pb-5 last:pb-0 relative">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-coin-accent/20" />
                    )}
                    <div className="relative z-10 mt-1 w-[15px] h-[15px] rounded-full border-2 border-coin-accent bg-white shrink-0 flex items-center justify-center">
                      <div className="w-[5px] h-[5px] rounded-full bg-coin-accent" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-coin-accent">{item.year}</span>
                      <p className="text-sm text-coin-muted">{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </PublicLayout>
  );
}
