import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import AnimatedSection from '@/Components/Public/AnimatedSection';
import SecurityHeroBackground from '@/Components/Public/SecurityHeroBackground';
import QuoteModal from '@/Components/Public/QuoteModal';

interface Service {
  slug: string;
  title: string;
  icon: string;
  intro: string;
  features: string[];
}

export default function ServicePage({ service }: { service: Service }) {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <PublicLayout title={`${service?.title ?? 'Service'} — Coin Security`}>
      <Head title={service?.title ?? 'Service'} />
      <SecurityHeroBackground showImage showCanvas showBadges className="pt-28 pb-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-coin-accent flex items-center justify-center shadow-lg shadow-coin-glow">
                <IconMapper name={service.icon} className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-coin-text">{service.title}</h1>
            </div>
            <p className="mt-4 text-coin-muted max-w-3xl text-lg">{service.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setShowQuote(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-coin-accent rounded-lg font-medium text-white shadow hover:bg-coin-accent-light transition-colors"
              >
                <IconMapper name="Phone" className="w-5 h-5" /> Request Quote
              </motion.button>
              <Link href={route('public.services')} className="inline-flex items-center gap-2 px-5 py-3 bg-coin-card/80 backdrop-blur-sm border border-coin-border rounded-lg font-medium text-coin-text hover:border-coin-accent/40 transition-colors">
                <IconMapper name="ArrowLeft" className="w-5 h-5" /> Back to Services
              </Link>
            </div>
          </motion.div>
        </div>
      </SecurityHeroBackground>
      <section className="py-20 bg-coin-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-12">
              <div className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-accent bg-coin-accent/10 px-4 py-1.5 rounded-full mb-4">
                Service Features
              </div>
              <h2 className="text-3xl font-bold text-coin-text">What's Included</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.features.map((f, i) => (
              <AnimatedSection key={i} delay={i * 0.06}>
                <div className="group rounded-2xl border border-coin-border p-6 bg-coin-card/60 transition-all duration-300 hover:border-coin-accent/30 hover:shadow-lg hover:shadow-coin-glow hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-coin-accent/10 text-coin-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                      <IconMapper name="Check" className="w-5 h-5" />
                    </div>
                    <div className="font-medium text-coin-text">{f}</div>
                  </div>
                  {/* Animated progress bar */}
                  <div className="mt-3 h-0.5 bg-coin-card rounded-full overflow-hidden">
                    <div
                      className="h-full bg-coin-accent/40 rounded-full transition-all duration-1000"
                      style={{ width: `${((i + 1) / service.features.length) * 100}%` }}
                    />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
      <QuoteModal show={showQuote} onClose={() => setShowQuote(false)} subjectPrefix={service?.title} />
    </PublicLayout>
  );
}
