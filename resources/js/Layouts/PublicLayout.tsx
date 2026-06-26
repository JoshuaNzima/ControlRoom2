import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AIAssistant from '@/Components/AI/AIAssistant';

interface Props {
  title?: string;
  children: React.ReactNode;
}

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/#intake' },
];

export default function PublicLayout({ title = 'Coin Security', children }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const safeRoute = (name: string, params?: any, fallback: string = '#') => {
    try { return route(name, params); } catch { return fallback; }
  };

  const phoneNumber = '+265 99 961 1711';
  const phoneHref = 'tel:+265999611711';
  const whatsappHref = 'https://wa.me/265999611711?text=Hi%20Coin%20Security%2C%20I%27d%20like%20a%20quote.';
  const addressLine = 'Area 47/4, Viphya street, Lilongwe, Malawi';
  const operatingRegion = 'Blantyre • Lilongwe • Mzuzu';

  const footerLinks = {
    Services: [
      { label: 'Security Guards', href: safeRoute('public.services.show', 'security-guards', '/services/security-guards') },
      { label: 'Live Monitoring', href: safeRoute('public.services.show', 'cctv-surveillance', '/services/cctv-surveillance') },
      { label: 'Patrol Services', href: safeRoute('public.services.show', 'mobile-patrol', '/services/mobile-patrol') },
      { label: 'Emergency Response', href: safeRoute('public.services', undefined, '/services') },
    ],
    Company: [
      { label: 'About Us', href: safeRoute('public.about', undefined, '/about') },
      { label: 'Careers', href: safeRoute('public.careers', undefined, '/careers') },
      { label: 'Contact', href: safeRoute('public.contact', undefined, '/contact') },
      { label: 'Privacy Policy', href: safeRoute('public.privacy', undefined, '/privacy') },
    ],
    Support: [
      { label: 'FAQ', href: '#' },
      { label: 'Client Login', href: safeRoute('login', undefined, '/login') },
      { label: 'Emergency: +265 99 961 1711', href: phoneHref },
    ],
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-coin-dark text-coin-text">
      <Head title={title}>
        <meta
          name="description"
          content="Coin Security provides professional security guards, 24/7 live monitoring, and rapid response across Malawi (Blantyre, Lilongwe, Mzuzu). Call or WhatsApp us for a quote."
        />
      </Head>

      {/* ═══ HEADER ═══ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-coin-dark/85 backdrop-blur-xl border-b border-coin-border'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/images/Coin-logo.png"
                alt="Coin Security"
                className="h-10 w-10 object-contain rounded-full"
              />
              <span className="text-lg font-bold tracking-tight">
                Coin <span className="text-coin-accent">Security</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium text-coin-muted hover:text-coin-text transition-colors duration-300 group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-coin-accent rounded-full transition-all duration-300 group-hover:w-4" />
                </Link>
              ))}
              <Link
                href={safeRoute('login', undefined, '/login')}
                className="ml-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-coin-accent hover:bg-coin-accent-light rounded-lg transition-all duration-300 shadow-lg shadow-coin-glow"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Client Login
              </Link>
            </nav>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5 group"
              aria-label="Toggle menu"
            >
              <span className={`block h-[2.5px] w-6 bg-coin-text rounded-full transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-[2.5px] w-6 bg-coin-text rounded-full transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-0' : ''}`} />
              <span className={`block h-[2.5px] w-6 bg-coin-text rounded-full transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-coin-border bg-coin-dark/95 backdrop-blur-xl"
            >
              <nav className="flex flex-col px-6 py-6 gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-coin-muted hover:text-coin-text hover:bg-coin-card rounded-lg transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={safeRoute('login', undefined, '/login')}
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 px-5 py-3 text-sm font-semibold text-white bg-coin-accent hover:bg-coin-accent-light rounded-lg text-center transition-all duration-300"
                >
                  Client Login
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1">{children}</main>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative border-t border-coin-border bg-coin-dark">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <img
                  src="/images/Coin-logo.png"
                  alt="Coin Security"
                  className="h-9 w-9 object-contain rounded-full"
                />
                <span className="text-base font-bold tracking-tight">
                  Coin <span className="text-coin-accent">Security</span>
                </span>
              </Link>
              <p className="text-sm text-coin-muted leading-relaxed max-w-sm">
                Malawi's trusted security partner. Protecting businesses, events, and communities
                with professional security services since 2012.
              </p>

              <div className="mt-6 space-y-3 text-sm text-coin-muted">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 text-coin-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>
                    Physical Address: {addressLine}
                    <br />
                    Operating Region: {operatingRegion}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-coin-accent shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.27 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <a className="text-coin-text hover:text-coin-accent transition-colors" href={phoneHref}>{phoneNumber}</a>
                </div>
                <div>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-coin-text mb-4">{category}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-coin-muted hover:text-coin-accent transition-colors duration-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-coin-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-coin-muted">
              &copy; {new Date().getFullYear()} Coin Security. All rights reserved.
            </p>
            <p className="text-xs text-coin-muted">
              Protecting Malawi, one client at a time.
            </p>
          </div>
        </div>
      </footer>

      <AIAssistant context="landing" />
    </div>
  );
}
