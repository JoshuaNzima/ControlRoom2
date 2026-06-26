import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import AnimatedSection from '@/Components/Public/AnimatedSection';
import SecurityHeroBackground from '@/Components/Public/SecurityHeroBackground';

interface Service {
  slug: string;
  title: string;
  icon: string;
  summary: string;
  features?: string[];
}

export default function ServicesIndex({ services = [] as Service[] }: { services: Service[] }) {
  return (
    <PublicLayout title="Services — Coin Security">
      <Head title="Services" />
      <SecurityHeroBackground showImage showCanvas showBadges className="pt-28 pb-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-accent bg-coin-accent/10 px-4 py-1.5 rounded-full mb-4">Services</div>
            <h1 className="text-4xl md:text-5xl font-bold text-coin-text">Our Security Services</h1>
            <p className="mt-4 text-coin-muted max-w-2xl text-lg">End-to-end physical security and technology solutions, tailored to your risk profile.</p>
          </motion.div>
        </div>
      </SecurityHeroBackground>
      <section className="py-16 bg-coin-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <AnimatedSection key={s.slug} delay={i * 0.07}>
                <Link
                  href={route('public.services.show', s.slug)}
                  className="group block rounded-2xl border border-coin-border bg-coin-card/60 p-6 shadow transition-all duration-300 hover:-translate-y-1 hover:border-coin-accent/30 hover:shadow-lg hover:shadow-coin-glow"
                >
                  <div className="w-12 h-12 rounded-xl bg-coin-accent text-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconMapper name={s.icon} className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-coin-text group-hover:text-coin-accent transition-colors">{s.title}</h3>
                  <p className="mt-2 text-coin-muted">{s.summary}</p>
                  {s.features?.length ? (
                    <ul className="mt-4 text-sm text-coin-muted space-y-1 list-disc pl-5">
                      {s.features.slice(0, 3).map((f, fi) => (
                        <li key={fi} className="transition-colors group-hover:text-coin-text/70">{f}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-6 inline-flex items-center gap-2 text-coin-accent font-medium group-hover:gap-3 transition-all">
                    Learn more <IconMapper name="ArrowRight" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
