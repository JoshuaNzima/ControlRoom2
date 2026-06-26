"use client";

const footerLinks = {
  Services: [
    { label: "Man Guarding", href: "#services" },
    { label: "Event Security", href: "#services" },
    { label: "Rapid Response", href: "#services" },
    { label: "CCTV Monitoring", href: "#services" },
  ],
  Company: [
    { label: "About Us", href: "#about" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
    { label: "Careers", href: "#" },
  ],
  Support: [
    { label: "FAQ", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Emergency: +265 1 234 567", href: "tel:+2651234567" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-coin-border bg-coin-dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 md:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#home" className="flex items-center gap-3 mb-4">
              <div className="relative flex items-center justify-center w-9 h-9">
                <div className="absolute inset-0 rounded-full bg-coin-gold/20" />
                <div className="absolute inset-0.5 rounded-full border border-coin-gold/40" />
                <span className="relative text-base font-bold text-coin-gold">C</span>
              </div>
              <span className="text-base font-bold tracking-tight">
                Coin <span className="text-coin-gold">Security</span>
              </span>
            </a>
            <p className="text-sm text-coin-muted leading-relaxed max-w-sm">
              Malawi's trusted security partner. Protecting businesses, events, and communities
              with professional security services since 2012.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-4 mt-6">
              {[
                { name: "Facebook", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                { name: "Twitter/X", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
                { name: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" },
                { name: "Instagram", path: "M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3h10zm-5 4a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm5.5-2.5a1 1 0 100-2 1 1 0 000 2z" },
              ].map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-coin-border text-coin-muted hover:text-coin-gold hover:border-coin-gold/30 transition-all duration-300"
                  aria-label={social.name}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-coin-text mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-coin-muted hover:text-coin-gold transition-colors duration-300"
                    >
                      {link.label}
                    </a>
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
  );
}
