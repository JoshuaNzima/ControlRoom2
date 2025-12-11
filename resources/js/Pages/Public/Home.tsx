import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';
import InteractiveHotspotImage from '@/Components/Public/InteractiveHotspotImage';
import Modal from '@/Components/Modal';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';

export default function Home() {
  const [currentStat, setCurrentStat] = useState(0);
  const [activeIntake, setActiveIntake] = useState<'ticket' | 'down' | 'incident'>('ticket');
  const [selected, setSelected] = useState<any | null>(null);
  const { flash, metrics, team = [] }: any = usePage().props;
  const spotlightRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
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
  const tiltX = useTransform(py, (v) => v * -3);
  const tiltY = useTransform(px, (v) => v * 3);
  const heroRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
    if (selected && spotlightRef.current) {
      spotlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selected]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      setIsCoarse(!!coarse);
    }
  }, []);

  useEffect(() => {
    if (!isCoarse) return;
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
  }, [isCoarse]);

  return (
    <PublicLayout title="Coin Security — Advanced Security Solutions">
      <Head title="Home" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-red-950 to-slate-900 text-white">
        <div className="absolute inset-0 bg-black/30"></div>
        <div ref={heroRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="relative min-h-[100svh] flex items-center pt-24 pb-16">
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:14px_14px]" style={{ x: gridX, y: gridY }} />
          <motion.div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-[40vw] h-[40vw] rounded-full bg-red-500/15 blur-3xl" style={{ x: glow1X, y: glow1Y }} />
          <motion.div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 w-[32vw] h-[32vw] rounded-full bg-purple-500/20 blur-3xl" style={{ x: glow2X, y: glow2Y }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Advanced Security
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Solutions
                  </span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Professional security services with cutting-edge technology. 
                  Protect your business with trained guards, live monitoring, and intelligent analytics.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#intake" 
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <IconMapper name="Send" className="w-[clamp(18px,3vw,22px)] h-[clamp(18px,3vw,22px)]" />
                  Report an Issue
                </a>
                <button 
                  type="button"
                  onClick={() => setShowQuote(true)}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <IconMapper name="Phone" className="w-[clamp(18px,3vw,22px)] h-[clamp(18px,3vw,22px)]" />
                  Get Quote
                </button>
              </div>

              {/* Animated Stats */}
              <div className="grid grid-cols-2 gap-6 pt-8">
                {metricStats.map((stat, index) => (
                  <div 
                    key={index}
                    className={`text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-500 ${
                      currentStat === index ? 'scale-105 bg-white/20' : ''
                    }`}
                  >
                    <div className="text-3xl font-bold text-blue-400">{stat.number}</div>
                    <div className="text-sm text-gray-300">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <motion.div className="relative" style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 900 }}>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-300/10 rounded-3xl blur-3xl"></div>
              <div className="relative">
                <InteractiveHotspotImage imageUrl="/images/compound.png" showModal={false} onSelect={setSelected} />
              </div>
            </motion.div>
          </div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            className="py-8 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
          >
            <div ref={spotlightRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Highlighted service</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selected.label}</h3>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    {(['cctv','guards','k9','rapid','perimeter','signage'].includes(selected?.id) ? (
                      selected.id === 'cctv' ? ['24/7 monitoring & analytics','Cloud or on‑prem recording','Remote incident review'] :
                      selected.id === 'guards' ? ['Vetted, trained manpower','Site-specific SLAs','Daily supervision/briefing'] :
                      selected.id === 'k9' ? ['Deterrence patrols','Rapid response pairing','Certified handlers'] :
                      selected.id === 'rapid' ? ['Rapid response fleet','Dispatch & escalation','On‑scene reporting'] :
                      selected.id === 'perimeter' ? ['Access control & fencing','Visitor logs & audits','Alarm integrations'] :
                      ['Brand presence & signage','Visitor confidence','Compliance-ready assets']
                    ) : []).map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 w-2 h-2 rounded-full bg-red-500" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900">
                    <img src="/images/compound.png" alt="Service" className="w-full h-40 object-cover rounded-lg opacity-90" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  {selected?.slug && (
                    <a href={route('public.services.show', selected.slug) as any} className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Learn more</a>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      

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
                className="group bg-white dark:bg-gray-950 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-800"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconMapper name={feature.icon} className="w-[clamp(24px,3vw,32px)] h-[clamp(24px,3vw,32px)] text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
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
                className="text-center p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
              >
                <div className="text-3xl font-extrabold text-red-600">{stat.number}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-gray-800"
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-500 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Secure Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get a free security assessment and customized quote for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#intake"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <IconMapper name="Shield" className="w-5 h-5" />
              Report an Issue
            </a>
            <button
              type="button"
              onClick={() => setShowQuote(true)}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
            >
              <IconMapper name="Phone" className="w-5 h-5" />
              Contact Sales Team
            </button>
          </div>
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
