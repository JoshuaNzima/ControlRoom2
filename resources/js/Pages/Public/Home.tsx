import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';

export default function Home() {
  const [currentStat, setCurrentStat] = useState(0);
  
  const stats = [
    { number: '500+', label: 'Active Guards', icon: 'Shield' },
    { number: '150+', label: 'Client Sites', icon: 'Building' },
    { number: '99.8%', label: 'Uptime Rate', icon: 'Activity' },
    { number: '24/7', label: 'Monitoring', icon: 'Eye' }
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
      setCurrentStat((prev) => (prev + 1) % stats.length);
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
                <Link 
                  href={route('login')} 
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <IconMapper name="LogIn" className="w-5 h-5" />
                  Client Portal
                </Link>
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
                {stats.map((stat, index) => (
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
            <Link 
              href={route('login')} 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <IconMapper name="LogIn" className="w-5 h-5" />
              Access Client Portal
            </Link>
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
