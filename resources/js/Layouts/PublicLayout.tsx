import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AIAssistant from '@/Components/AI/AIAssistant';

interface Props {
  title?: string;
  children: React.ReactNode;
}

export default function PublicLayout({ title = 'Coin Security', children }: Props) {
  const safeRoute = (name: string, params?: any, fallback: string = '#') => {
    try {
      return route(name, params);
    } catch {
      return fallback;
    }
  };

  const phoneNumber = '0999611711';
  const phoneHref = `tel:+265${phoneNumber}`;
  const whatsappHref = `https://wa.me/265${phoneNumber}?text=Hi%20Coin%20Security%2C%20I%27d%20like%20a%20quote.`;
  const addressLine = 'Area 47/4, Viphya street, Lilongwe, Malawi';
  const operatingRegion = 'Blantyre • Lilongwe • Mzuzu';

  return (
    <div className="min-h-screen overflow-x-hidden bg-red-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Head title={title}>
        <meta
          name="description"
          content="Coin Security provides professional security guards, 24/7 live monitoring, and rapid response across Malawi (Blantyre, Lilongwe, Mzuzu). Call or WhatsApp us for a quote."
        />
      </Head>

      <header className="sticky top-0 z-50 border-b border-red-100 bg-white/95 backdrop-blur-sm shadow-lg dark:border-gray-800 dark:bg-gray-950/80 dark:shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/images/Coin-logo.png" alt="Coin Security" className="h-10 w-auto" />
              <span className="text-lg font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                Coin Security
              </span>
            </div>

            <nav className="flex w-full flex-wrap items-center justify-start gap-3 sm:w-auto sm:justify-end">
              <Link
                href={safeRoute('public.home', undefined, '/')}
                className="text-sm font-medium text-gray-700 hover:text-coin-700 transition-colors duration-200 dark:text-gray-200 dark:hover:text-coin-300"
              >
                Home
              </Link>

              <Link
                href={safeRoute('public.services', undefined, '/services')}
                className="text-sm font-medium text-gray-700 hover:text-coin-700 transition-colors duration-200 dark:text-gray-200 dark:hover:text-coin-300"
              >
                Services
              </Link>

              <Link
                href={safeRoute('login', undefined, '/login')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coin-700 to-coin-600 text-white text-sm font-medium rounded-lg shadow-sm shadow-black/10 hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 dark:shadow-black/40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Client Login
              </Link>


              <Link
                href={safeRoute('public.contact', undefined, '/contact')}
                className="text-sm font-medium text-gray-700 hover:text-coin-700 transition-colors duration-200 dark:text-gray-200 dark:hover:text-coin-300"
              >
                Contact
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <div className="animate-slideUp transition-all-smooth">{children}</div>
      </main>

      <footer className="bg-gradient-to-r from-slate-900 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/images/Coin-logo.png" alt="Coin Security" className="h-8 w-auto" />
                <span className="text-xl font-bold">Coin Security</span>
              </div>

              <p className="text-gray-300 mb-4 max-w-md">
                Professional security services with cutting-edge technology. Protecting businesses with trained guards,
                live monitoring, and intelligent analytics.
              </p>

              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-4 h-4 mt-0.5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
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
                  <svg
                    className="w-4 h-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.27 1.64.45 2.5.57A2 2 0 0 1 22 16.92z" />
                  </svg>

                  <a className="text-white hover:underline" href={phoneHref}>
                    {phoneNumber}
                  </a>
                </div>

                <div>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link
                    href={safeRoute('public.services.show', 'security-guards', '/services/security-guards')}
                    className="hover:text-white transition-colors"
                  >
                    Security Guards
                  </Link>
                </li>
                <li>
                  <Link
                    href={safeRoute('public.services.show', 'cctv-surveillance', '/services/cctv-surveillance')}
                    className="hover:text-white transition-colors"
                  >
                    Live Monitoring
                  </Link>
                </li>
                <li>
                  <Link
                    href={safeRoute('public.services.show', 'mobile-patrol', '/services/mobile-patrol')}
                    className="hover:text-white transition-colors"
                  >
                    Patrol Services
                  </Link>
                </li>
                <li>
                  <Link
                    href={safeRoute('public.services', undefined, '/services')}
                    className="hover:text-white transition-colors"
                  >
                    Emergency Response
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <Link href={safeRoute('public.about', undefined, '/about')} className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href={safeRoute('public.careers', undefined, '/careers')}
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href={safeRoute('public.contact', undefined, '/contact')}
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href={safeRoute('public.privacy', undefined, '/privacy')}
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>
              © {new Date().getFullYear()} Coin Security — All rights reserved. Professional security services you can trust.
            </p>
          </div>
        </div>
      </footer>

      <AIAssistant context="landing" />
    </div>
  );
}
