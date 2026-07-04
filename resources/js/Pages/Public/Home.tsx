import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import AnimatedSection from '@/Components/Public/AnimatedSection';
import SectionHeading from '@/Components/Public/SectionHeading';
import ParallaxSectionBg from '@/Components/Public/ParallaxSectionBg';
import QuoteModal from '@/Components/Public/QuoteModal';
import { motion, useScroll, useSpring } from 'framer-motion';
import SecurityCanvasBackground from '@/Components/Public/SecurityCanvasBackground';
import FloatingSecurityBadges from '@/Components/Public/FloatingSecurityBadges';
import ContactFormSection from '@/Components/Public/ContactFormSection';
import AnimatedCounter from '@/Components/Public/AnimatedCounter';
import TiltCard from '@/Components/Public/TiltCard';
import { Shield, Zap, Users, ChevronRight, CheckCircle, Building2, Activity, Quote } from 'lucide-react';

/* ─── Typewriter slogans + descriptions ─── */
const SLOGANS = [
  { word: 'Detect', description: 'Advanced threat detection and intelligent surveillance systems — we catch what others miss.' },
  { word: 'Prevent', description: 'Proactive prevention strategies to stop security breaches before they happen.' },
  { word: 'Respond', description: 'Lightning-fast response when every second counts — on-site in minutes.' },
  { word: 'Protect', description: 'Comprehensive protection you can trust, 24 hours a day, 365 days a year.' },
];

/* ─── Typewriter typing effect component ─── */
function TypewriterText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const idxRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setDisplayed('');
      idxRef.current = 0;
      cancelAnimationFrame(rafRef.current);
      return;
    }

    idxRef.current = 0;
    setDisplayed('');

    const tick = () => {
      if (idxRef.current < text.length) {
        setDisplayed(text.slice(0, idxRef.current + 1));
        idxRef.current++;
        // Variable speed: faster for short words, slower for long
        const delay = text.length > 80 ? 25 : 35;
        rafRef.current = window.setTimeout(tick, delay);
      } else {
        setDisplayed(text);
      }
    };
    rafRef.current = window.setTimeout(tick, 300); // initial pause before typing starts

    return () => {
      clearTimeout(rafRef.current);
    };
  }, [active, text]);

  // Blinking cursor
  useEffect(() => {
    if (!active) { setShowCursor(false); return; }
    const ci = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(ci);
  }, [active]);

  return (
    <span>
      {displayed}
      {active && showCursor && (
        <span className="inline-block w-[2px] h-[1em] bg-coin-accent ml-0.5 align-middle animate-pulse" />
      )}
    </span>
  );
}

/* ─── Stats ─── */
const stats = [
  { value: 500, suffix: '+', label: 'Clients Protected' },
  { value: 12, suffix: '+', label: 'Years Experience' },
  { value: 1200, suffix: '+', label: 'Security Personnel' },
  { value: 98, suffix: '%', label: 'Client Retention' },
];

/* ─── Services ─── */
const services = [
  {
    title: 'Man Guarding',
    description: 'Professional, vetted security guards deployed 24/7 for access control, patrol, and incident response.',
    features: ['24/7 on-site presence', 'Access control & visitor management', 'Patrol & incident reporting', 'Armed & unarmed options'],
    icon: 'Shield',
  },
  {
    title: 'Event Security',
    description: 'Crowd management and security for concerts, corporate events, and private functions.',
    features: ['Crowd control & screening', 'VIP protection details', 'Bag search & metal detection', 'Emergency evacuation protocols'],
    icon: 'Calendar',
  },
  {
    title: 'Rapid Response',
    description: 'GPS-dispatched units on standby 24/7, reaching your location in minutes.',
    features: ['GPS-tracked response units', '< 10 minute average arrival', 'Direct police liaison', 'Live status tracking'],
    icon: 'Zap',
  },
  {
    title: 'Off-Site CCTV Monitoring',
    description: '24/7 remote surveillance with AI motion detection and instant breach alerts.',
    features: ['Real-time remote monitoring', 'AI-powered motion detection', 'Cloud video storage (30 days)', 'Instant breach alerts & dispatch'],
    icon: 'Camera',
  },
];

/* ─── Values ─── */
const values = [
  { title: 'Integrity', description: 'Honesty and transparency in every engagement.' },
  { title: 'Excellence', description: 'Continuous training and technology investment for the highest service standard.' },
  { title: 'Community', description: 'Deeply invested in the safety and prosperity of Malawian communities.' },
  { title: 'Innovation', description: 'AI monitoring, GPS tracking — staying ahead of threats.' },
];

/* ─── Timeline ─── */
const timeline = [
  { year: '2012', event: 'Coin Security founded in Lilongwe' },
  { year: '2015', event: 'Expanded to Blantyre & Mzuzu' },
  { year: '2019', event: 'Launched off-site CCTV monitoring center' },
  { year: '2023', event: '1,200+ personnel, 500+ clients served' },
];

/* ─── Testimonials ─── */
const testimonials = [
  {
    quote: 'Coin Security transformed our approach to workplace safety. Their guards are professional, well-trained, and the management team is incredibly responsive. We have been with them for 5 years and have never felt safer.',
    name: 'Grace Banda',
    role: 'Operations Director, Malawi Retail Group',
  },
  {
    quote: 'We hired Coin Security for our annual music festival — over 15,000 attendees. Their crowd management and rapid response plan were flawless. No incidents, no complaints. Exceptional work.',
    name: 'Michael Kamwendo',
    role: 'Event Organizer, Lake of Stars Festival',
  },
  {
    quote: 'The off-site CCTV monitoring service is a game-changer. We get instant alerts when something happens, and their operators spotted a break-in attempt before our own on-site guard did. Highly recommend.',
    name: 'Chifundo Nkhoma',
    role: 'CEO, Nkhoma Properties',
  },
  {
    quote: 'As a small business owner, I was worried about the cost of professional security. Coin Security offered a package that fit our budget without cutting corners. Their team is always courteous and professional.',
    name: 'Esther Phiri',
    role: 'Owner, Phiri & Sons Hardware',
  },
  {
    quote: 'Their rapid response team arrived at our premises within 8 minutes of an alarm activation. The thieves were apprehended before they could even load their vehicle. Worth every kwacha.',
    name: 'John Mwale',
    role: 'Manager, Mwale Logistics',
  },
];

const features = [
  { icon: 'Shield', title: 'Professional Security Guards', description: 'Licensed personnel with extensive background checks and ongoing training.' },
  { icon: 'Camera', title: '24/7 Live Monitoring', description: 'Advanced surveillance with real-time monitoring and instant incident response.' },
  { icon: 'MapPin', title: 'Multi-Site Coverage', description: 'Centralized security management across multiple locations.' },
  { icon: 'Smartphone', title: 'Mobile Command Center', description: 'Real-time security status and incident management from your phone.' },
  { icon: 'BarChart3', title: 'Analytics & Reporting', description: 'Detailed insights to optimize security operations and reduce risks.' },
  { icon: 'Headphones', title: '24/7 Support', description: 'Round-the-clock customer support and emergency response.' },
];

/* ─── MagneticButton helper ─── */
function MagneticButton({ children, className, href, onClick, ...props }: any) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPos({ x: x * 0.3, y: y * 0.3 });
  }, []);

  const reset = useCallback(() => setPos({ x: 0, y: 0 }), []);

  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className={className}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: pos.x === 0 ? 'transform 0.4s ease' : 'transform 0.05s ease',
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}

/* ─── Mouse-tracked hero decorations ─── */
function MouseParallaxDecorations() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div
        className="absolute top-20 left-[8%] w-16 h-16 border border-coin-accent/20 rounded-lg rotate-12 animate-float-slow hidden md:block pointer-events-none"
        style={{ transform: `translate(${mouse.x * -1}px, ${mouse.y * -1}px)` }}
      />
      <div
        className="absolute bottom-40 right-[6%] w-12 h-12 border border-coin-accent/20 rounded-full animate-float-medium hidden md:block pointer-events-none"
        style={{ transform: `translate(${mouse.x * 0.6}px, ${mouse.y * 0.6}px)` }}
      />
      <div
        className="absolute top-1/3 right-[12%] w-8 h-8 border border-coin-accent/15 rounded-lg -rotate-6 animate-float-slow hidden lg:block pointer-events-none"
        style={{ transform: `translate(${mouse.x * 0.3}px, ${mouse.y * 0.3}px)`, animationDelay: '5s' }}
      />
    </>
  );
}

export default function Home() {
  const [showQuote, setShowQuote] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const { metrics }: any = usePage().props;

  const metricStats = [
    { number: metrics?.guards_total ?? '—', label: 'Active Guards', icon: 'Shield' },
    { number: metrics?.sites_total ?? '—', label: 'Active Sites', icon: 'MapPin' },
    { number: typeof metrics?.uptime_pct === 'number' ? `${metrics.uptime_pct}%` : (metrics?.uptime_pct ?? '99.8%'), label: 'Uptime', icon: 'Activity' },
    { number: metrics?.clients_total ?? '—', label: 'Clients', icon: 'Building2' },
  ];

  /* ─── Staggered typewriter state ─── */
  const [showDesc, setShowDesc] = useState(false);

  /* ─── Typewriter cycling ─── */
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((p) => (p + 1) % SLOGANS.length);
    }, 6500);
    return () => clearInterval(interval);
  }, []);

  /* ─── Stagger: slogan first, description after delay ─── */
  useEffect(() => {
    setShowDesc(false);
    const t = setTimeout(() => setShowDesc(true), 500);
    return () => clearTimeout(t);
  }, [phraseIdx]);

  /* ─── Scroll Progress ─── */
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  /* ─── Draggable testimonial carousel ─── */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current.isDragging = true;
    dragState.current.startX = e.pageX - el.offsetLeft;
    dragState.current.scrollLeft = el.scrollLeft;
    el.style.cursor = 'grabbing';
  }, []);

  const handleMouseUp = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current.isDragging = false;
    el.style.cursor = '';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!dragState.current.isDragging || !el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.5;
    el.scrollLeft = dragState.current.scrollLeft - walk;
  }, []);

  /* ─── Infinite carousel ─── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || paused) return;
    let id: number, start: number | null = null;
    const fn = (ts: number) => {
      if (!start) start = ts;
      if (!el || paused) { id = requestAnimationFrame(fn); return; }
      if (el.scrollLeft >= el.scrollWidth / 2) el.scrollLeft = 0;
      else el.scrollLeft += 0.3;
      id = requestAnimationFrame(fn);
    };
    id = requestAnimationFrame(fn);
    return () => cancelAnimationFrame(id);
  }, [paused]);

  return (
    <PublicLayout title="Coin Security — Malawi's Trusted Security Partner">
      <Head title="Home" />

      {/* ── Scroll Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-coin-accent origin-left z-[60]"
        style={{ scaleY, opacity: scrollYProgress }}
      />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Full immersive backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-coin-surface" />
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />

        {/* Background image — subtle */}
        <div className="absolute inset-0">
          <img
            src="/images/compound.png"
            alt=""
            className="w-full h-full object-cover opacity-[0.05]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-transparent to-white/60" />
        </div>

        {/* Animated scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/30 to-transparent animate-scan-line" />
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-coin-accent/20 rounded-tl-3xl" />
        <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-coin-accent/20 rounded-tr-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-coin-accent/20 rounded-bl-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-coin-accent/20 rounded-br-3xl" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-coin-accent/8 blur-3xl animate-pulse-glow" />
        <div
          className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-coin-accent/6 blur-3xl animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />

        {/* Floating geometric accents with mouse parallax */}
        <MouseParallaxDecorations />

        {/* Security-themed canvas with particles */}
        <SecurityCanvasBackground density={60} color="#e04b3f" />

        {/* Floating security icon badges */}
        <FloatingSecurityBadges count={10} />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-coin-accent/20 bg-coin-accent/5 backdrop-blur-sm text-xs font-medium text-coin-accent mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coin-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-coin-accent" />
              </span>
              Trusted Security Partner in Malawi
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] text-coin-text">
              <span className="inline-flex items-center gap-x-3 sm:gap-x-4 flex-wrap justify-center">
                <span className="leading-none">We</span>
                <span className="relative inline-flex items-center h-14 sm:h-16 md:h-20 lg:h-24 w-36 sm:w-44 md:w-52 lg:w-64">
                  {SLOGANS.map((s, i) => (
                    <span
                      key={s.word}
                      className="absolute inset-0 flex items-center justify-center transition-all duration-700"
                      style={{
                        opacity: i === phraseIdx ? 1 : 0,
                        filter: i === phraseIdx ? 'blur(0px)' : 'blur(6px)',
                        transform: i === phraseIdx ? 'translateY(0) scale(1)' : 'translateY(0) scale(0.95)',
                      }}
                    >
                      <span className="relative z-10 text-coin-accent leading-none">{s.word}</span>
                      <span className="absolute -bottom-1 left-0 right-0 h-3 bg-coin-accent/15 rounded-full blur-sm" />
                    </span>
                  ))}
                </span>
              </span>
            </h1>

            <div className="relative min-h-[80px] mt-4 max-w-3xl mx-auto">
              {SLOGANS.map((s, i) => {
                const isActive = i === phraseIdx;
                return (
                  <p
                    key={s.word}
                    className="absolute left-0 right-0 text-base sm:text-lg md:text-xl text-coin-muted leading-relaxed text-balance transition-all duration-700"
                    style={{
                      opacity: isActive && showDesc ? 1 : 0,
                      filter: isActive && showDesc ? 'blur(0px)' : 'blur(4px)',
                      transform: isActive && showDesc ? 'translateY(0)' : 'translateY(8px)',
                    }}
                  >
                    <TypewriterText text={s.description} active={isActive && showDesc} />
                  </p>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton
                href="#intake"
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-coin-accent hover:bg-coin-accent-light rounded-xl transition-all duration-300 shadow-cta overflow-hidden"
              >
                <span className="relative z-10">Get Your Free Consultation</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </MagneticButton>
              <MagneticButton
                href="#services"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-coin-text border border-coin-border hover:border-coin-accent/40 rounded-xl transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm"
              >
                Our Services <ChevronRight className="w-4 h-4" />
              </MagneticButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-coin-border pt-10"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-bold text-coin-accent">
                  <AnimatedCounter end={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-xs md:text-sm text-coin-muted">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-coin-muted">Scroll to explore</span>
          <div className="w-5 h-8 border border-coin-border rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-coin-accent/60 rounded-full animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="services" className="relative py-28 md:py-36 bg-coin-surface overflow-hidden">
        <ParallaxSectionBg opacity={0.02} />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/15 to-transparent animate-scan-line" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <SectionHeading label="Our Services" title="Comprehensive Security Solutions" description="Full spectrum security services tailored to protect your business, assets, and people across Malawi." />
          </AnimatedSection>
          <div className="mt-16 grid md:grid-cols-2 gap-6 lg:gap-8">
            {services.map((svc, i) => (
              <AnimatedSection key={svc.title} delay={i * 0.1}>
                <TiltCard>
                  <div className="group h-full rounded-2xl border border-coin-border bg-white p-8 transition-all duration-500 hover:border-coin-accent/30 hover:shadow-card-hover hover-lift">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-coin-accent/10 text-coin-accent">
                        <IconMapper name={svc.icon} className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-coin-text">{svc.title}</h3>
                    </div>
                    <p className="text-sm text-coin-muted leading-relaxed mb-6">{svc.description}</p>
                    <ul className="space-y-2.5">
                      {svc.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-coin-text/80">
                          <CheckCircle className="w-4 h-4 text-coin-accent mt-0.5 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TiltCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ABOUT ─── */}
      <section id="about" className="relative py-28 md:py-36 bg-white overflow-hidden">
        <ParallaxSectionBg opacity={0.02} />
        <div className="absolute inset-0 bg-gradient-radial opacity-30" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/15 to-transparent animate-scan-line" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <SectionHeading label="About Us" title="Malawi's Trusted Security Partner" description="Over a decade protecting businesses, events, and communities across Malawi." />
          </AnimatedSection>
          <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <AnimatedSection direction="left">
              <div className="space-y-5">
                <p className="text-base md:text-lg text-coin-muted leading-relaxed">
                  Founded in <span className="text-coin-text font-semibold">Lilongwe, Malawi</span> in 2012, Coin Security
                  started with a simple mission: provide world-class security services that local businesses could
                  trust. What began as a small team of 20 guards has grown into one of Malawi's leading security providers.
                </p>
                <p className="text-base md:text-lg text-coin-muted leading-relaxed">
                  Today, we deploy over <span className="text-coin-text font-semibold">1,200 trained personnel</span> across the country, protecting everything from corporate headquarters and retail chains to major public events and private residences.
                </p>
                <div className="pt-6 grid sm:grid-cols-2 gap-4">
                  {values.map((v) => (
                    <div key={v.title} className="p-4 rounded-xl border border-coin-border bg-white shadow-sm">
                      <h4 className="font-semibold text-coin-text text-sm mb-1">{v.title}</h4>
                      <p className="text-xs text-coin-muted leading-relaxed">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection direction="right" delay={0.2}>
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 p-6 rounded-2xl border border-coin-border bg-white shadow-sm">
                  {metricStats.map((ms) => (
                    <div key={ms.label} className="text-center">
                      <div className="text-3xl md:text-4xl font-bold text-coin-accent">{ms.number}</div>
                      <div className="mt-1.5 text-sm text-coin-muted">{ms.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-0">
                  <h4 className="text-sm font-semibold text-coin-text mb-4">Our Journey</h4>
                  {timeline.map((item, i) => (
                    <div key={item.year} className="flex gap-4 pb-5 last:pb-0 relative">
                      {i < timeline.length - 1 && <div className="absolute left-[7px] top-5 bottom-0 w-px bg-coin-accent/20" />}
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
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="relative py-28 md:py-36 bg-coin-surface overflow-hidden">
        <ParallaxSectionBg opacity={0.02} />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/15 to-transparent animate-scan-line" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <SectionHeading label="Why Choose Us" title="Built for Reliability" description="Every aspect of our operation is designed to deliver consistent, professional security." />
          </AnimatedSection>
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.08}>
                <TiltCard>
                  <div className="group rounded-2xl border border-coin-border bg-white p-8 transition-all duration-500 hover:border-coin-accent/30 hover:shadow-card-hover hover-lift">
                    <div className="w-14 h-14 bg-coin-accent rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <IconMapper name={f.icon} className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-coin-text mb-3">{f.title}</h3>
                    <p className="text-sm text-coin-muted leading-relaxed">{f.description}</p>
                    {/* Scroll progress bar */}
                    <div className="mt-4 h-1 bg-coin-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-coin-accent rounded-full"
                        initial={{ width: '0%' }}
                        whileInView={{ width: '100%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </TiltCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="relative py-28 md:py-36 bg-white overflow-hidden">
        <ParallaxSectionBg opacity={0.02} />
        <div className="absolute inset-0 bg-grid opacity-15" />
        {/* Animated radar glow */}
        <div className="absolute top-1/3 right-[15%] w-64 h-64 rounded-full bg-coin-accent/6 blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-1/4 left-[10%] w-48 h-48 rounded-full bg-coin-accent/4 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection>
            <SectionHeading label="Testimonials" title="What Our Clients Say" description="Hear from businesses that trust Coin Security every day." />
          </AnimatedSection>
        </div>
        <div
          className="relative z-10 mt-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            className="flex gap-6 overflow-x-hidden px-6 lg:px-8 select-none"
            style={{ scrollBehavior: 'auto' }}
          >
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="min-w-[350px] md:min-w-[420px] max-w-[420px] shrink-0 p-7 rounded-2xl border border-coin-border bg-white hover:border-coin-accent/20 transition-all duration-300 shadow-card hover:shadow-card-hover"
              >
                <Quote className="w-8 h-8 text-coin-accent/30 mb-4" />
                <p className="text-sm md:text-base text-coin-muted leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-coin-accent/15 flex items-center justify-center text-coin-accent font-bold text-sm shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-coin-text">{t.name}</div>
                    <div className="text-xs text-coin-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-20" />
        <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-20" />
      </section>

      {/* ─── CONTACT / INTAKE FORM ─── */}
      <ContactFormSection />

      {/* ─── CTA ─── */}
      <section className="relative py-24 overflow-hidden bg-coin-surface">
        <ParallaxSectionBg opacity={0.02} />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-radial opacity-40" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/15 to-transparent animate-scan-line" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coin-accent/10 border border-coin-accent/20 mb-8">
              <Zap className="w-4 h-4 text-coin-accent" />
              <span className="text-sm text-coin-accent font-medium">Ready When You Are</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-coin-text mb-6 tracking-tight">
              Secure Your <span className="block text-coin-accent">Operations Today</span>
            </h2>
            <p className="text-xl text-coin-muted mb-10 max-w-2xl mx-auto">
              Join hundreds of businesses that trust Coin Security for their critical security infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticButton
                href="#intake"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-coin-accent text-white font-bold rounded-2xl shadow-cta hover:bg-coin-accent-light transition-all"
              >
                <Shield className="w-6 h-6" />
                <span className="text-lg">Start Protection</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <MagneticButton
                onClick={() => setShowQuote(true)}
                className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-white text-coin-text font-semibold rounded-2xl border border-coin-border hover:border-coin-accent/40 transition-all shadow-sm"
              >
                <Users className="w-5 h-5" />
                <span className="text-lg">Talk to Sales</span>
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── QUOTE MODAL ─── */}
      <QuoteModal show={showQuote} onClose={() => setShowQuote(false)} />
    </PublicLayout>
  );
}
