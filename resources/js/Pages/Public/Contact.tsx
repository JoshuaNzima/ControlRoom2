import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import IconMapper from '@/Components/IconMapper';

export default function Contact() {
  const { flash }: any = usePage().props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
    service_interest: 'general',
    budget: '',
    timeline: '',
    website: ''
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    post(route('public.contact.store'), {
      onSuccess: () => {
        reset();
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  };

  const services = [
    { value: 'security_guards', label: 'Security Guards' },
    { value: 'cctv_surveillance', label: 'CCTV Surveillance' },
    { value: 'mobile_patrol', label: 'Mobile Patrol' },
    { value: 'event_security', label: 'Event Security' },
    { value: 'consultation', label: 'Security Consultation' },
    { value: 'integrated_systems', label: 'Integrated Security Systems' },
    { value: 'general', label: 'General Inquiry' }
  ];

  const budgets = [
    { value: 'under_5k', label: 'Under $5,000/month' },
    { value: '5k_10k', label: '$5,000 - $10,000/month' },
    { value: '10k_25k', label: '$10,000 - $25,000/month' },
    { value: '25k_50k', label: '$25,000 - $50,000/month' },
    { value: 'over_50k', label: 'Over $50,000/month' },
    { value: 'discuss', label: "Let's discuss budget" }
  ];

  const timelines = [
    { value: 'asap', label: 'ASAP' },
    { value: '1_month', label: 'Within 1 month' },
    { value: '3_months', label: 'Within 3 months' },
    { value: '6_months', label: 'Within 6 months' },
    { value: 'planning', label: 'Just planning' }
  ];

  return (
    <PublicLayout title="Contact Us — Coin Security">
      <Head title="Contact" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Get in
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Touch
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Ready to secure your business? Our security experts are here to help you find the perfect solution for your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {flash?.success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 text-green-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <IconMapper name="CheckCircle" className="w-5 h-5" />
                {flash.success}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconMapper name="Phone" className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Emergency Hotline</div>
                      <div className="text-gray-600">24/7 Available</div>
                      <div className="text-blue-600 font-medium">+1 (555) 123-4567</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconMapper name="Mail" className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Email Us</div>
                      <div className="text-gray-600">General inquiries</div>
                      <div className="text-blue-600 font-medium">info@coinsecurity.com</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconMapper name="MapPin" className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Head Office</div>
                      <div className="text-gray-600">123 Security Street</div>
                      <div className="text-gray-600">Business City, BC 12345</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconMapper name="Clock" className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Business Hours</div>
                      <div className="text-gray-600">Mon-Fri: 8:00 AM - 6:00 PM</div>
                      <div className="text-gray-600">Sat-Sun: 24/7 Emergency</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Emergency Support</h3>
                <p className="text-blue-100 mb-4">
                  For immediate security emergencies, our hotline is available 24/7 for rapid response.
                </p>
                <a 
                  href="tel:+15551234567" 
                  className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <IconMapper name="Phone" className="w-4 h-4" />
                  Call Now
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Request a Quote</h2>
                
                <form onSubmit={submit} className="space-y-6">
                  {/* Honeypot field */}
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
                      <label className="text-sm font-medium text-gray-700">Full Name *</label>
                      <input 
                        type="text" 
                        value={data.name} 
                        onChange={(e) => setData('name', e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required 
                      />
                      {errors.name && <div className="text-sm text-red-600">{errors.name}</div>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Email Address *</label>
                      <input 
                        type="email" 
                        value={data.email} 
                        onChange={(e) => setData('email', e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required 
                      />
                      {errors.email && <div className="text-sm text-red-600">{errors.email}</div>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <input 
                        type="tel" 
                        value={data.phone} 
                        onChange={(e) => setData('phone', e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                      {errors.phone && <div className="text-sm text-red-600">{errors.phone}</div>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Company Name</label>
                      <input 
                        type="text" 
                        value={data.company} 
                        onChange={(e) => setData('company', e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                      {errors.company && <div className="text-sm text-red-600">{errors.company}</div>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Subject *</label>
                    <input 
                      type="text" 
                      value={data.subject} 
                      onChange={(e) => setData('subject', e.target.value)} 
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      placeholder="How can we help you?"
                      required 
                    />
                    {errors.subject && <div className="text-sm text-red-600">{errors.subject}</div>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Service Interest</label>
                      <select 
                        value={data.service_interest} 
                        onChange={(e) => setData('service_interest', e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {services.map(service => (
                          <option key={service.value} value={service.value}>{service.label}</option>
                        ))}
                      </select>
                      {errors.service_interest && <div className="text-sm text-red-600">{errors.service_interest}</div>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Estimated Budget</label>
                      <select 
                        value={data.budget} 
                        onChange={(e) => setData('budget', e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select budget range</option>
                        {budgets.map(budget => (
                          <option key={budget.value} value={budget.value}>{budget.label}</option>
                        ))}
                      </select>
                      {errors.budget && <div className="text-sm text-red-600">{errors.budget}</div>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Timeline</label>
                      <select 
                        value={data.timeline} 
                        onChange={(e) => setData('timeline', e.target.value)} 
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select timeline</option>
                        {timelines.map(timeline => (
                          <option key={timeline.value} value={timeline.value}>{timeline.label}</option>
                        ))}
                      </select>
                      {errors.timeline && <div className="text-sm text-red-600">{errors.timeline}</div>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Message *</label>
                    <textarea 
                      value={data.message} 
                      onChange={(e) => setData('message', e.target.value)} 
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]" 
                      placeholder="Tell us more about your security needs..."
                      required 
                    />
                    {errors.message && <div className="text-sm text-red-600">{errors.message}</div>}
                  </div>

                  <div className="flex items-center justify-end">
                    <button 
                      type="submit" 
                      disabled={processing || isSubmitting} 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <IconMapper name="Send" className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Common questions about our security services</p>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">How quickly can you deploy security services?</h3>
              <p className="text-gray-600">We can deploy security guards within 24-48 hours for standard requests. Emergency deployments can be arranged within hours depending on availability.</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Are your security guards licensed and insured?</h3>
              <p className="text-gray-600">Yes, all our security guards are fully licensed, bonded, and insured. They undergo extensive background checks and continuous training.</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Do you offer customized security solutions?</h3>
              <p className="text-gray-600">Absolutely! We provide tailored security solutions based on your specific needs, property type, and risk assessment.</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">What areas do you service?</h3>
              <p className="text-gray-600">We provide security services throughout the metropolitan area and surrounding regions. Contact us to confirm service availability in your location.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
