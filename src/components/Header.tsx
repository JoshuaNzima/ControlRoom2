"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-coin-dark/85 backdrop-blur-xl border-b border-coin-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10">
              <div className="absolute inset-0 rounded-full bg-coin-gold/20 group-hover:bg-coin-gold/30 transition-colors duration-300" />
              <div className="absolute inset-0.5 rounded-full border border-coin-gold/40" />
              <span className="relative text-lg font-bold text-coin-gold">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight">
              Coin <span className="text-coin-gold">Security</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-coin-muted hover:text-coin-text transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-coin-gold rounded-full transition-all duration-300 group-hover:w-4" />
              </a>
            ))}
            <a
              href="#contact"
              className="ml-4 px-5 py-2.5 text-sm font-semibold text-coin-dark bg-coin-gold hover:bg-coin-gold-light rounded-lg transition-all duration-300 shadow-lg shadow-coin-glow"
            >
              Get a Quote
            </a>
          </nav>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5 group"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-[2.5px] w-6 bg-coin-text rounded-full transition-all duration-300 ${
                mobileOpen ? "rotate-45 translate-y-[7px]" : ""
              }`}
            />
            <span
              className={`block h-[2.5px] w-6 bg-coin-text rounded-full transition-all duration-300 ${
                mobileOpen ? "opacity-0 scale-0" : ""
              }`}
            />
            <span
              className={`block h-[2.5px] w-6 bg-coin-text rounded-full transition-all duration-300 ${
                mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-coin-border bg-coin-dark/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col px-6 py-6 gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-coin-muted hover:text-coin-text hover:bg-coin-card rounded-lg transition-all duration-300"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="mt-2 px-5 py-3 text-sm font-semibold text-coin-dark bg-coin-gold hover:bg-coin-gold-light rounded-lg text-center transition-all duration-300"
              >
                Get a Quote
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
