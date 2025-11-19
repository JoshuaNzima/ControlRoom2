import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';

export default function Home() {
  const [currentStat, setCurrentStat] = useState(0);
  const [activeIntake, setActiveIntake] = useState<'ticket' | 'down' | 'incident'>('ticket');
  const { flash, metrics }: any = usePage().props;
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
    attachments: [] as File[]
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

  return (
    <PublicLayout title="Coin Security — Advanced Security Solutions">
      <Head title="Home" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
                  <IconMapper name="Send" className="w-5 h-5" />
                  Report an Issue
                </a>
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                >
                  <IconMapper name="Phone" className="w-5 h-5" />
                  Get Quote
                </a>
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

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <IconMapper name="Shield" className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">Active Monitoring</div>
                      <div className="text-sm text-gray-300">All systems operational</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Site Coverage</span>
                      <span className="text-sm font-semibold">98.5%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full" style={{width: '98.5%'}}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">24</div>
                      <div className="text-xs text-gray-300">Guards On Duty</div>
                    </div>
                    <div className="text-center p-3 bg-white/10 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">12</div>
                      <div className="text-xs text-gray-300">Active Sites</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="intake" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {flash?.success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 text-green-800 px-4 py-3">
              {flash.success}
            </div>
          )}
          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button type="button" onClick={() => setActiveIntake('ticket')} className={`w-full px-4 py-3 rounded-xl border transition ${activeIntake === 'ticket' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
              Raise Ticket
            </button>
            <button type="button" onClick={() => setActiveIntake('down')} className={`w-full px-4 py-3 rounded-xl border transition ${activeIntake === 'down' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
              Report Down
            </button>
            <button type="button" onClick={() => setActiveIntake('incident')} className={`w-full px-4 py-3 rounded-xl border transition ${activeIntake === 'incident' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
              Report Incident
            </button>
          </div>
          <form onSubmit={submit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Your Name</label>
                <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.phone && <div className="text-sm text-red-600">{errors.phone}</div>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Client Name</label>
                    <input value={data.client_name} onChange={(e) => setData('client_name', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.client_name && <div className="text-sm text-red-600">{errors.client_name}</div>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Site</label>
                    <input value={data.client_site} onChange={(e) => setData('client_site', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.client_site && <div className="text-sm text-red-600">{errors.client_site}</div>}
                  </div>
                </div>
              </div>
            </details>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input value={data.title} onChange={(e) => setData('title', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                {errors.title && <div className="text-sm text-red-600">{errors.title}</div>}
              </div>
              {activeIntake === 'ticket' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Priority</label>
                  <select value={data.priority} onChange={(e) => setData('priority', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                  <label className="text-sm font-medium text-gray-700">Down Type</label>
                  <select value={data.down_type} onChange={(e) => setData('down_type', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="guard_absent">Guard Absent</option>
                    <option value="site_unmanned">Site Unmanned</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.down_type && <div className="text-sm text-red-600">{errors.down_type}</div>}
                </div>
              )}
              {activeIntake === 'ticket' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select value={data.category} onChange={(e) => setData('category', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" required />
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
                Submit
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Security Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From professional guards to advanced technology, we provide everything you need to secure your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconMapper name={feature.icon} className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Businesses
            </h2>
            <p className="text-xl text-gray-600">
              See what our clients say about our security services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <IconMapper key={i} name="Star" className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
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
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
            >
              <IconMapper name="Phone" className="w-5 h-5" />
              Contact Sales Team
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
