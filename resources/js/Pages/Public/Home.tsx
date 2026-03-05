import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import Modal from '@/Components/Modal';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { Shield, Camera, Zap, MapPin, Users, Clock, ChevronRight, AlertTriangle, Phone, Send, Sun, Moon } from 'lucide-react';

function Starfield({ density = 140, speed = 0.02 }: { density?: number; speed?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<Array<{ x: number; y: number; z: number }>>([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const onResize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = Math.max(1, Math.floor(w * dpr));
      c.height = Math.max(1, Math.floor(h * dpr));
      sizeRef.current = { w, h, dpr };
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!starsRef.current.length) {
        const arr: Array<{ x: number; y: number; z: number }> = [];
        for (let i = 0; i < density; i++) {
          arr.push({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random() });
        }
        starsRef.current = arr;
      }
    };
    onResize();
    window.addEventListener('resize', onResize);

    const animate = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      const f = Math.min(w, h) * 0.6;
      for (let i = 0; i < starsRef.current.length; i++) {
        const s = starsRef.current[i];
        s.z -= speed;
        if (s.z <= 0.02) {
          s.x = (Math.random() - 0.5) * 2;
          s.y = (Math.random() - 0.5) * 2;
          s.z = 1;
        }
        const px = (s.x / s.z) * f + w / 2;
        const py = (s.y / s.z) * f + h / 2;
        if (px < 0 || px > w || py < 0 || py > h) continue;
        const t = 1 - s.z;
        const r = Math.max(0.4, t) * 0.9;
        ctx.globalAlpha = Math.min(0.55, 0.15 + t * 0.6);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [density, speed]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.12] mix-blend-screen" />;
}

export default function Home() {
  const [currentStat, setCurrentStat] = useState(0);
  const [activeIntake, setActiveIntake] = useState<'ticket' | 'down' | 'incident'>('ticket');
  const [darkMode, setDarkMode] = useState(false);
  const { flash, metrics, team = [] }: any = usePage().props;
  const { scrollYProgress } = useScroll();
  const prefersReduced = useReducedMotion();

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedMode = localStorage.getItem('coinsec-theme');
    if (savedMode) {
      setDarkMode(savedMode === 'dark');
    } else {
      setDarkMode(prefersDark);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('coinsec-theme', newMode ? 'dark' : 'light');
  };

  const safeRoute = (name: string, params?: any, fallback: string = '#') => {
    try {
      return route(name, params);
    } catch {
      return fallback;
    }
  };
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const yGlow2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const [isCoarse, setIsCoarse] = useState(false);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const px = useSpring(pointerX, { stiffness: 60, damping: 12, mass: 0.2 });
  const py = useSpring(pointerY, { stiffness: 60, damping: 12, mass: 0.2 });
  const glow1X = useTransform(px, (v) => v * 16);
  const glow1Y = useTransform([yGlow, py], (vals) => {
    const [sy, v] = vals as number[];
    return sy + v * 12;
  });
  const glow2X = useTransform(px, (v) => v * -12);
  const glow2Y = useTransform([yGlow2, py], (vals) => {
    const [sy, v] = vals as number[];
    return sy + v * -10;
  });
  const gridX = useTransform(px, (v) => v * 8);
  const gridY = useTransform(py, (v) => v * 6);
  const bgX = useTransform(px, (v) => v * 18);
  const bgY = useTransform(py, (v) => v * 14);
  const bgScale = useTransform(scrollYProgress, [0, 1], prefersReduced ? [1.06, 1.06] : [1.06, 1.12]);
  const heroHue = useTransform(scrollYProgress, [0, 1], [
    'hue-rotate(0deg)',
    prefersReduced ? 'hue-rotate(0deg)' : 'hue-rotate(20deg)'
  ]);
  const chip1X = useTransform(px, (v) => v * 14);
  const chip1Y = useTransform(py, (v) => v * -10);
  const chip2X = useTransform(px, (v) => v * -10);
  const chip2Y = useTransform(py, (v) => v * 12);
  const chip3X = useTransform(px, (v) => v * 8);
  const chip3Y = useTransform(py, (v) => v * 8);
  const chip4X = useTransform(px, (v) => v * -14);
  const chip4Y = useTransform(py, (v) => v * -6);
  const titleX = useTransform(px, (v) => v * 2);
  const titleY = useTransform(py, (v) => v * 1.5);
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeChip, setActiveChip] = useState<null | 'cctv' | 'rapid' | 'guards' | 'perimeter'>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    pointerX.set(Math.max(-1, Math.min(1, (nx - 0.5) * 2)));
    pointerY.set(Math.max(-1, Math.min(1, (ny - 0.5) * 2)));
  };
  const handleMouseLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };
  
  const { data, setData, post, processing, reset, errors, progress, transform } = useForm({
    type: 'ticket' as 'ticket' | 'down' | 'incident',
    name: '',
    email: '',
    phone: '',
    client_name: '',
    client_site: '',
    title: '',
    category: 'complaint',
    priority: 'medium',
    description: '',
    down_type: 'guard_absent',
    attachments: [] as File[],
    website: ''
  });

  const [showQuote, setShowQuote] = useState(false);
  const { data: qData, setData: setQData, post: postQuote, processing: qProcessing, reset: qReset, errors: qErrors } = useForm({
    name: '',
    email: '',
    subject: 'Request a Quote',
    message: '',
    website: ''
  });

  useEffect(() => {
    setData('type', activeIntake);
  }, [activeIntake]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    transform((current) => current);
    post(route('public.intake.store'), {
      forceFormData: true,
      onSuccess: () => {
        reset('title', 'description', 'attachments');
      }
    });
  };

  const submitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    postQuote(route('public.contact.store'), {
      onSuccess: () => {
        qReset();
        setShowQuote(false);
      }
    });
  };
  
  const metricStats = [
    { number: metrics?.guards_total ?? '—', label: 'Active Guards', icon: 'Shield' },
    { number: metrics?.sites_total ?? '—', label: 'Active Sites', icon: 'MapPin' },
    { number: typeof metrics?.uptime_pct === 'number' ? `${metrics.uptime_pct}%` : (metrics?.uptime_pct ?? '99.8%'), label: 'Uptime', icon: 'Activity' },
    { number: metrics?.clients_total ?? '—', label: 'Clients', icon: 'Building' }
  ];

  const features = [
    {
      icon: 'Shield',
      title: 'Professional Security Guards',
      description: 'Highly trained, licensed security personnel with extensive background checks and ongoing training programs.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'Camera',
      title: '24/7 Live Monitoring',
      description: 'Advanced surveillance systems with real-time monitoring and instant incident response capabilities.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: 'MapPin',
      title: 'Multi-Site Coverage',
      description: 'Comprehensive security solutions across multiple locations with centralized management and reporting.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: 'Smartphone',
      title: 'Mobile Command Center',
      description: 'Real-time access to security status, reports, and incident management through our mobile platform.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: 'BarChart3',
      title: 'Analytics & Reporting',
      description: 'Detailed insights and analytics to optimize your security operations and reduce risks.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: 'Headphones',
      title: '24/7 Support',
      description: 'Round-the-clock customer support and emergency response services for peace of mind.',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      company: 'TechCorp Industries',
      content: 'Coin Security has transformed our facility security. Their professional guards and advanced monitoring systems give us complete peace of mind.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      company: 'Metro Shopping Center',
      content: 'The real-time monitoring and instant alerts have helped us prevent incidents before they happen. Excellent service!',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      company: 'Downtown Office Complex',
      content: 'Professional, reliable, and always responsive. Coin Security has exceeded our expectations in every way.',
      rating: 5
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % metricStats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      setIsCoarse(!!coarse);
    }
  }, []);

  useEffect(() => {
    if (!isCoarse || prefersReduced) return;
    if (typeof window === 'undefined' || !(window as any).DeviceOrientationEvent) return;
    const handler = (e: DeviceOrientationEvent) => {
      const gamma = typeof e.gamma === 'number' ? e.gamma : 0;
      const beta = typeof e.beta === 'number' ? e.beta : 0;
      const nx = Math.max(-1, Math.min(1, gamma / 30));
      const ny = Math.max(-1, Math.min(1, beta / 30));
      pointerX.set(nx);
      pointerY.set(ny);
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [isCoarse, prefersReduced]);

  return (
    <PublicLayout title="Coin Security — Advanced Security Solutions">
      <Head title="Home" />

      {/* Dark Mode Toggle */}
      <motion.button
        onClick={toggleDarkMode}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all ${
          darkMode
            ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>

      {/* Hero Section */}
      <section className={`relative overflow-hidden transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {/* Animated gradient layer with hue shift */}
        <motion.div aria-hidden className={`pointer-events-none absolute inset-0 transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-slate-950 via-red-950 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`} style={{ filter: heroHue }} />
        <div className={`pointer-events-none absolute inset-0 transition-colors duration-300 ${darkMode ? 'bg-black/18' : 'bg-white/40'}`} />
        <div ref={heroRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="relative z-10 min-h-[100svh] flex items-center pt-24 pb-16">
          <motion.img aria-hidden src="/images/compound.png" alt="" className={`pointer-events-none absolute inset-0 w-full h-full object-cover blur-[8px] scale-110 transition-opacity duration-300 ${darkMode ? 'opacity-[0.26]' : 'opacity-[0.08]'}`} style={{ x: bgX, y: bgY, scale: bgScale }} />
          <motion.div aria-hidden className={`pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(${darkMode ? 'rgba(255,255,255' : 'rgba(0,0,0'},0.07)_1px,transparent_1px)] [background-size:14px_14px]`} style={{ x: gridX, y: gridY }} />
          <div aria-hidden className={`pointer-events-none absolute inset-0 opacity-[0.035] [background-image:repeating-linear-gradient(45deg,${darkMode ? 'rgba(255,255,255' : 'rgba(0,0,0'},0.18)_0px,${darkMode ? 'rgba(255,255,255' : 'rgba(0,0,0'},0.18)_1px,transparent_1px,transparent_8px)]`} />
          <motion.div aria-hidden className={`pointer-events-none absolute -top-24 -left-24 w-[40vw] h-[40vw] rounded-full blur-3xl transition-colors duration-300 ${darkMode ? 'bg-red-500/15' : 'bg-red-500/10'}`} style={{ x: glow1X, y: glow1Y }} />
          <motion.div aria-hidden className={`pointer-events-none absolute -bottom-24 -right-24 w-[32vw] h-[32vw] rounded-full blur-3xl transition-colors duration-300 ${darkMode ? 'bg-purple-500/20' : 'bg-purple-500/10'}`} style={{ x: glow2X, y: glow2Y }} />
          <motion.div aria-hidden className={`pointer-events-none absolute -top-40 left-1/4 w-[60vw] h-[60vw] rounded-full blur-3xl mix-blend-screen transition-colors duration-300 ${darkMode ? 'bg-red-500/10' : 'bg-red-500/5'}`}
            animate={prefersReduced ? { x: 0, y: 0, scale: 1 } : { x: [0, -30, 20, 0], y: [0, 20, -10, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 22, repeat: prefersReduced ? 0 : Infinity, repeatType: 'mirror', ease: 'easeInOut' }} />
          <motion.div aria-hidden className={`pointer-events-none absolute -bottom-48 right-[-10%] w-[50vw] h-[50vw] rounded-full blur-3xl mix-blend-screen transition-colors duration-300 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-500/5'}`}
            animate={prefersReduced ? { x: 0, y: 0, scale: 1 } : { x: [0, 25, -15, 0], y: [0, -15, 20, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 24, repeat: prefersReduced ? 0 : Infinity, repeatType: 'mirror', ease: 'easeInOut' }} />
          {/* Vignette and Noise overlays */}
          <div aria-hidden className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${darkMode ? 'bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.55)_100%)]' : 'bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.05)_100%)]'}`} />
          <svg aria-hidden className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.04] mix-blend-overlay" role="presentation">
            <filter id="heroNoise">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#heroNoise)" />
          </svg>
          {/* Starfield canvas (real 3D feel) - only in dark mode */}
          {darkMode && !prefersReduced && <Starfield />}
          
          {/* Floating hero chips with inline popovers */}
          <motion.div style={{ x: chip1X, y: chip1Y }}
            animate={prefersReduced ? { y: 0 } : { y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: prefersReduced ? 0 : Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute top-24 left-3 sm:left-6 z-30">
            <motion.button type="button" aria-expanded={activeChip === 'cctv'} onClick={() => setActiveChip(activeChip === 'cctv' ? null : 'cctv')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md text-xs transition-colors ${darkMode ? 'bg-black/40 text-white border-white/10 hover:bg-black/55' : 'bg-white/70 text-gray-800 border-gray-200 hover:bg-white'}`}>
              <IconMapper name="Camera" className={`w-3.5 h-3.5 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`} />
              <span>24/7 Monitoring</span>
            </motion.button>
            <AnimatePresence>
              {activeChip === 'cctv' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className={`mt-2 w-64 rounded-xl border backdrop-blur-md text-sm p-3 shadow-xl ${darkMode ? 'border-white/10 bg-black/70 text-white' : 'border-gray-200 bg-white text-gray-800'}`}>
                  <div className="font-semibold mb-1">CCTV Surveillance</div>
                  <div className={`text-[12px] ${darkMode ? 'text-gray-200/90' : 'text-gray-600'}`}>24/7 live monitoring, cloud recording and smart analytics for proactive security.</div>
                  <div className="mt-2 flex justify-end">
                    <a href={safeRoute('public.services.show', 'cctv-surveillance', '/services/cctv-surveillance')} className={`text-xs ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'} underline`}>Learn more</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div style={{ x: chip2X, y: chip2Y }}
            animate={prefersReduced ? { y: 0 } : { y: [0, 8, 0] }}
            transition={{ duration: 7.5, repeat: prefersReduced ? 0 : Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute bottom-24 left-4 sm:left-10 z-30">
            <motion.button type="button" aria-expanded={activeChip === 'rapid'} onClick={() => setActiveChip(activeChip === 'rapid' ? null : 'rapid')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md text-xs transition-colors ${darkMode ? 'bg-black/40 text-white border-white/10 hover:bg-black/55' : 'bg-white/70 text-gray-800 border-gray-200 hover:bg-white'}`}>
              <IconMapper name="Flashlight" className={`w-3.5 h-3.5 ${darkMode ? 'text-purple-300' : 'text-purple-500'}`} />
              <span>Rapid Response</span>
            </motion.button>
            <AnimatePresence>
              {activeChip === 'rapid' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className={`mt-2 w-64 rounded-xl border backdrop-blur-md text-sm p-3 shadow-xl ${darkMode ? 'border-white/10 bg-black/70 text-white' : 'border-gray-200 bg-white text-gray-800'}`}>
                  <div className="font-semibold mb-1">Rapid Response</div>
                  <div className={`text-[12px] ${darkMode ? 'text-gray-200/90' : 'text-gray-600'}`}>On‑call response fleet, fast dispatch and on‑scene reporting when it matters.</div>
                  <div className="mt-2 flex justify-end">
                    <a href={safeRoute('public.services.show', 'rapid-response', '/services/rapid-response')} className={`text-xs ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'} underline`}>Learn more</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div style={{ x: chip3X, y: chip3Y }}
            animate={prefersReduced ? { y: 0 } : { y: [0, -5, 0] }}
            transition={{ duration: 5.5, repeat: prefersReduced ? 0 : Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-6 z-30">
            <motion.button type="button" aria-expanded={activeChip === 'guards'} onClick={() => setActiveChip(activeChip === 'guards' ? null : 'guards')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md text-xs transition-colors ${darkMode ? 'bg-black/40 text-white border-white/10 hover:bg-black/55' : 'bg-white/70 text-gray-800 border-gray-200 hover:bg-white'}`}>
              <IconMapper name="Shield" className={`w-3.5 h-3.5 ${darkMode ? 'text-emerald-300' : 'text-emerald-500'}`} />
              <span>On‑site Guards</span>
            </motion.button>
            <AnimatePresence>
              {activeChip === 'guards' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className={`mt-2 w-64 rounded-xl border backdrop-blur-md text-sm p-3 shadow-xl ${darkMode ? 'border-white/10 bg-black/70 text-white' : 'border-gray-200 bg-white text-gray-800'}`}>
                  <div className="font-semibold mb-1">Manned Guards</div>
                  <div className={`text-[12px] ${darkMode ? 'text-gray-200/90' : 'text-gray-600'}`}>Trained, vetted personnel with site‑specific SLAs and daily supervision.</div>
                  <div className="mt-2 flex justify-end">
                    <a href={safeRoute('public.services.show', 'manned-guards', '/services/manned-guards')} className={`text-xs ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'} underline`}>Learn more</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.div style={{ x: chip4X, y: chip4Y }}
            animate={prefersReduced ? { y: 0 } : { y: [0, 7, 0] }}
            transition={{ duration: 6.5, repeat: prefersReduced ? 0 : Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute bottom-24 right-4 sm:right-10 z-30">
            <motion.button type="button" aria-expanded={activeChip === 'perimeter'} onClick={() => setActiveChip(activeChip === 'perimeter' ? null : 'perimeter')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md text-xs transition-colors ${darkMode ? 'bg-black/40 text-white border-white/10 hover:bg-black/55' : 'bg-white/70 text-gray-800 border-gray-200 hover:bg-white'}`}>
              <IconMapper name="MapPin" className={`w-3.5 h-3.5 ${darkMode ? 'text-amber-300' : 'text-amber-500'}`} />
              <span>Perimeter Protection</span>
            </motion.button>
            <AnimatePresence>
              {activeChip === 'perimeter' && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className={`mt-2 w-64 rounded-xl border backdrop-blur-md text-sm p-3 shadow-xl ${darkMode ? 'border-white/10 bg-black/70 text-white' : 'border-gray-200 bg-white text-gray-800'}`}>
                  <div className="font-semibold mb-1">Perimeter Protection</div>
                  <div className={`text-[12px] ${darkMode ? 'text-gray-200/90' : 'text-gray-600'}`}>Access control, alarms, and perimeter sensors integrated into operations.</div>
                  <div className="mt-2 flex justify-end">
                    <a href={safeRoute('public.services.show', 'perimeter-protection', '/services/perimeter-protection')} className={`text-xs ${darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'} underline`}>Learn more</a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 gap-12 items-center">
            <div className="space-y-8">
              <motion.div className="space-y-4" style={{ x: prefersReduced ? 0 : titleX, y: prefersReduced ? 0 : titleY }}>
                <div className="relative">
                  <motion.div aria-hidden className="pointer-events-none absolute -inset-x-16 -top-10 h-48 rounded-[100%] bg-gradient-to-r from-red-500/25 to-indigo-500/20 blur-2xl"
                    style={{ x: prefersReduced ? 0 : gridX, y: prefersReduced ? 0 : gridY }} />
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.08 } }
                    }}
                  >
                    <h1 className="relative text-5xl lg:text-7xl font-bold leading-tight">
                      <motion.span
                        className="block overflow-hidden"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                      >
                        <motion.span
                          className={`block ${darkMode ? 'text-white' : 'text-gray-900'}`}
                          initial={{ y: 100, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                        >
                          Advanced
                        </motion.span>
                      </motion.span>
                      <motion.span
                        className="block overflow-hidden"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                      >
                        <motion.span
                          className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500"
                          initial={{ y: 100, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.15, ease: [0.33, 1, 0.68, 1] }}
                        >
                          Security
                        </motion.span>
                      </motion.span>
                      <motion.span
                        className="block overflow-hidden"
                        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                      >
                        <motion.span
                          className={`block ${darkMode ? 'text-white' : 'text-gray-900'}`}
                          initial={{ y: 100, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.8, delay: 0.3, ease: [0.33, 1, 0.68, 1] }}
                        >
                          Command
                        </motion.span>
                      </motion.span>
                    </h1>
                  </motion.div>
                  <motion.div
                    className="absolute -right-4 top-0"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 1, type: 'spring' }}
                  >
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/50">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className={`text-xl lg:text-2xl leading-relaxed max-w-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  Elite security infrastructure with real-time command capabilities.
                  <span className="text-red-500"> Protect what matters most.</span>
                </motion.p>
              </motion.div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.a 
                  href="#intake" 
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/25 overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Report Incident</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.a>
                <motion.button 
                  type="button"
                  onClick={() => setShowQuote(true)}
                  className={`group inline-flex items-center justify-center gap-3 px-8 py-4 font-semibold rounded-xl border transition-all ${darkMode ? 'bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20 hover:border-white/30' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-lg'}`}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Phone className="w-5 h-5" />
                  <span>Get Quote</span>
                </motion.button>
              </div>

              {/* Animated Stats - Redesigned */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-2 gap-4 pt-8"
              >
                {metricStats.map((stat, index) => (
                  <motion.div 
                    key={index}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className={`relative overflow-hidden p-4 rounded-2xl backdrop-blur-md border transition-all duration-500 cursor-pointer group ${
                      darkMode 
                        ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10' 
                        : 'bg-white border-gray-200 shadow-lg'
                    } ${currentStat === index ? 'ring-2 ring-red-500/50' : ''}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.number}</div>
                      <div className={`text-xs uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</div>
                    </div>
                    <div className={`absolute top-2 right-2 opacity-20 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      <IconMapper name={stat.icon} className="w-8 h-8" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Full-bleed mode: remove framed image card */}
          </div>
          </div>
        </div>
      </section>

      {/* Full-bleed hero has no spotlight detail section */}

      

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Comprehensive Security Solutions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              From professional guards to advanced technology, we provide everything you need to secure your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                whileHover={prefersReduced ? undefined : { rotateX: -2, rotateY: 2, scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                style={{ transformPerspective: 800 }}
                className="group relative overflow-hidden bg-white dark:bg-gray-950 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconMapper name={feature.icon} className="w-[clamp(24px,3vw,32px)] h-[clamp(24px,3vw,32px)] text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
                <div aria-hidden className="pointer-events-none absolute -top-1/3 -left-1/4 w-[140%] h-1/2 bg-gradient-to-r from-white/10 via-white/0 to-transparent rotate-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">By the Numbers</h2>
            <p className="text-gray-600 dark:text-gray-400">Operational scale and reliability</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metricStats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                whileHover={{ scale: 1.03 }}
                className="text-center p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:shadow-lg"
              >
                <div className="text-3xl font-extrabold text-red-600">{stat.number}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Removed Explore Our Operations section in favor of hero hotspots */}

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Trusted by Leading Businesses
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See what our clients say about our security services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                whileHover={prefersReduced ? undefined : { rotateX: -1.5, rotateY: 1.5, scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                style={{ transformPerspective: 800 }}
                className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <IconMapper key={i} name="Star" className="w-[clamp(16px,2.2vw,20px)] h-[clamp(16px,2.2vw,20px)] text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{testimonial.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.company}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="intake" className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {flash?.success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 text-green-800 px-4 py-3 dark:border-green-900 dark:bg-green-900/30 dark:text-green-300">
              {flash.success}
            </div>
          )}
          <div className="mb-8">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tell us what you need help with:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button type="button" onClick={() => setActiveIntake('ticket')} className={`w-full px-4 py-3 rounded-xl border transition ${activeIntake === 'ticket' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                Service Request
              </button>
              <button type="button" onClick={() => setActiveIntake('down')} className={`w-full px-4 py-3 rounded-xl border transition ${activeIntake === 'down' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                Site Uncovered
              </button>
              <button type="button" onClick={() => setActiveIntake('incident')} className={`w-full px-4 py-3 rounded-xl border transition ${activeIntake === 'incident' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                Incident / Emergency
              </button>
            </div>
          </div>
          <form onSubmit={submit} className="bg-white dark:bg-gray-950 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 md:p-8 space-y-6">
            <input
              type="text"
              name="website"
              value={data.website}
              onChange={(e) => setData('website', e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Name</label>
                <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}
              </div>
            </div>
            <details className="rounded-xl border border-gray-200 bg-gray-50 open:bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <IconMapper name="MoreHorizontal" className="w-4 h-4 text-gray-500" />
                  Additional Details (optional)
                </span>
                <span className="text-gray-400">▼</span>
              </summary>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.phone && <div className="text-sm text-red-600">{errors.phone}</div>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Client Name</label>
                    <input value={data.client_name} onChange={(e) => setData('client_name', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.client_name && <div className="text-sm text-red-600">{errors.client_name}</div>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Site</label>
                    <input value={data.client_site} onChange={(e) => setData('client_site', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.client_site && <div className="text-sm text-red-600">{errors.client_site}</div>}
                  </div>
                </div>
              </div>
            </details>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">What happened?</label>
                <input value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="Briefly describe the issue" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                {errors.title && <div className="text-sm text-red-600">{errors.title}</div>}
              </div>
              {activeIntake === 'ticket' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Urgency</label>
                  <select value={data.priority} onChange={(e) => setData('priority', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  {errors.priority && <div className="text-sm text-red-600">{errors.priority}</div>}
                </div>
              )}
              {activeIntake === 'down' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">What seems to be the issue?</label>
                  <select value={data.down_type} onChange={(e) => setData('down_type', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="guard_absent">Guard Absent</option>
                    <option value="site_unmanned">Site Unmanned</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.down_type && <div className="text-sm text-red-600">{errors.down_type}</div>}
                </div>
              )}
              {activeIntake === 'ticket' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type of request</label>
                  <select value={data.category} onChange={(e) => setData('category', e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="complaint">Complaint</option>
                    <option value="incident">Incident</option>
                    <option value="request">Request</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="emergency">Emergency</option>
                  </select>
                  {errors.category && <div className="text-sm text-red-600">{errors.category}</div>}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tell us more</label>
              <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="Add any details that can help us respond quickly" className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" required />
              {errors.description && <div className="text-sm text-red-600">{errors.description}</div>}
            </div>  
            <details className="rounded-xl border border-gray-200 bg-gray-50 open:bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-700">
                Attachments (optional)
              </summary>
              <div className="px-4 pb-4 space-y-2">
                <label className="text-sm font-medium text-gray-700">Attach files</label>
                <input type="file" multiple onChange={(e) => setData('attachments', Array.from(e.target.files || []))} className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {progress && <div className="text-sm text-gray-600">Uploading {progress.percentage}%</div>}
                {errors.attachments && <div className="text-sm text-red-600">{errors.attachments}</div>}
              </div>
            </details>
            <div className="flex items-center justify-end gap-3">
              <button type="submit" disabled={processing} className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow ${activeIntake === 'ticket' ? 'bg-blue-600 hover:bg-blue-700' : activeIntake === 'down' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-rose-600 hover:bg-rose-700'} disabled:opacity-60`}>
                <IconMapper name="Send" className="w-5 h-5" />
                Send
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Our Team & Portfolio</h2>
            <p className="text-gray-600 dark:text-gray-400">A glimpse of the people and moments behind our service</p>
          </div>
          {Array.isArray(team) && team.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {team.map((src: string, i: number) => (
                <div key={i} className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                  <img src={src} alt={`Team ${i + 1}`} className="w-full h-40 md:h-44 object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">Team images coming soon.</div>
          )}
        </div>
      </section>

      {/* CTA Section - Redesigned with bold dark theme */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-red-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(220,38,38,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-8"
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Zap className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300 font-medium">Ready When You Are</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Secure Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                Operations Today
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join hundreds of businesses that trust CoinSec for their critical security infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="#intake"
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-red-600/30 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  <span className="text-lg">Start Protection</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.a>
              <motion.button
                type="button"
                onClick={() => setShowQuote(true)}
                className="inline-flex items-center justify-center gap-3 px-8 py-5 bg-white/5 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="w-5 h-5" />
                <span className="text-lg">Talk to Sales</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-10 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 dark:text-gray-400 mb-6">Trusted by teams like</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-center opacity-80">
            {['TechCorp','Metro Mall','City Bank','GlobalWare'].map((n, i) => (
              <div key={i} className="text-center text-gray-400 dark:text-gray-500 text-sm">{n}</div>
            ))}
          </div>
        </div>
      </section>

      <Modal show={showQuote} onClose={() => setShowQuote(false)} maxWidth="xl">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request a Quote</h3>
            <button onClick={() => setShowQuote(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <IconMapper name="X" className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={submitQuote} className="mt-4 space-y-4">
            <input type="text" name="website" value={qData.website} onChange={(e) => setQData('website', e.target.value)} className="hidden" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Full Name *</label>
                <input value={qData.name} onChange={(e) => setQData('name', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
                {qErrors.name && <div className="text-sm text-red-600">{qErrors.name}</div>}
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Email *</label>
                <input type="email" value={qData.email} onChange={(e) => setQData('email', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
                {qErrors.email && <div className="text-sm text-red-600">{qErrors.email}</div>}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Subject *</label>
              <input value={qData.subject} onChange={(e) => setQData('subject', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2" />
              {qErrors.subject && <div className="text-sm text-red-600">{qErrors.subject}</div>}
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Message *</label>
              <textarea value={qData.message} onChange={(e) => setQData('message', e.target.value)} required className="w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 min-h-[120px]" />
              {qErrors.message && <div className="text-sm text-red-600">{qErrors.message}</div>}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={qProcessing} className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-medium disabled:opacity-60">
                <IconMapper name="Send" className="w-5 h-5" />
                Send
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </PublicLayout>
  );
}
