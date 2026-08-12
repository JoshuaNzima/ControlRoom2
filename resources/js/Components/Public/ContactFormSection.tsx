import React, { useState, useEffect, useCallback } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import IconMapper from '@/Components/IconMapper';
import AnimatedSection from '@/Components/Public/AnimatedSection';
import SectionHeading from '@/Components/Public/SectionHeading';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, ChevronDown, Send, Loader2 } from 'lucide-react';

type IntakeType = 'issue' | 'quote';

interface IssueSubtype {
  value: string;
  label: string;
  /** Which contextual field to show */
  context: 'urgency' | 'down_type' | 'category';
}

const ISSUE_TYPES: IssueSubtype[] = [
  { value: 'ticket', label: 'Service Request', context: 'urgency' },
  { value: 'down', label: 'Site Uncovered', context: 'down_type' },
  { value: 'incident', label: 'Incident / Emergency', context: 'category' },
];

const TABS: { key: IntakeType; label: string; color: string }[] = [
  { key: 'issue', label: 'Report an Issue', color: 'bg-coin-accent border-coin-accent' },
  { key: 'quote', label: 'General Inquiry / Quote', color: 'bg-emerald-600 border-emerald-600' },
];

const FAQ_DATA = [
  { q: 'How quickly can you deploy security services?', a: 'We can deploy security guards within 24-48 hours for standard requests. Emergency deployments can be arranged within hours.' },
  { q: 'Are your security guards licensed and insured?', a: 'Yes, all our security guards are fully licensed, bonded, and insured. They undergo extensive background checks and continuous training.' },
  { q: 'Do you offer customized security solutions?', a: 'Absolutely! We provide tailored security solutions based on your specific needs, property type, and risk assessment.' },
  { q: 'What areas do you service?', a: 'We provide security services throughout Malawi and surrounding regions including Blantyre, Lilongwe, Mzuzu, Zomba, Mangochi, and Salima.' },
  { q: 'How do I get a quote?', a: 'Simply fill out the General Inquiry form above or call us directly. Our team will assess your needs and provide a detailed quote within 24 hours.' },
];

export default function ContactFormSection() {
  const [activeIntake, setActiveIntake] = useState<IntakeType>('issue');
  const [issueSubtype, setIssueSubtype] = useState<string>('ticket');
  const [extraOpen, setExtraOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const { flash } = usePage<any>().props;

  // ── Issue form (merged: ticket / down / incident) ──
  const intake = useForm({
    type: 'ticket' as string,
    name: '', email: '', phone: '', client_name: '', client_site: '', title: '',
    category: 'complaint', priority: 'medium', description: '', down_type: 'guard_absent',
    attachments: [] as File[], website: '',
  });

  // ── Quote form ──
  const quote = useForm({
    name: '', email: '', phone: '', company: '', subject: '', message: '',
    service_interest: 'general', budget: '', timeline: '', website: '',
  });

  // Sync intake type with issueSubtype
  useEffect(() => {
    intake.setData('type', issueSubtype);
  }, [issueSubtype]);

  const isQuoteMode = activeIntake === 'quote';

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isQuoteMode) {
      quote.post(route('public.contact.store'), {
        onSuccess: () => { quote.reset('subject', 'message'); },
      });
    } else {
      intake.post(route('public.intake.store'), {
        forceFormData: true,
        onSuccess: () => intake.reset('title', 'description', 'attachments'),
      });
    }
  }, [isQuoteMode, intake, quote]);

  const getBtnColor = (key: IntakeType) => {
    const map: Record<IntakeType, string> = {
      issue: 'bg-coin-accent border-coin-accent',
      quote: 'bg-emerald-600 border-emerald-600',
    };
    return map[key];
  };

  const activeProcessing = isQuoteMode ? quote.processing : intake.processing;
  const activeSuccess = flash?.success;

  /** Which issue context dropdown to show */
  const activeContext = ISSUE_TYPES.find((it) => it.value === issueSubtype)?.context ?? 'urgency';

  return (
    <section id="intake" className="relative py-28 md:py-36 bg-coin-dark overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial opacity-50" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-coin-accent/15 to-transparent animate-scan-line" />
      </div>
      <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-coin-accent/8 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-coin-accent/8 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-coin-accent/8 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-coin-accent/8 rounded-br-3xl" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-coin-accent/4 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-coin-accent/3 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
        <AnimatePresence>
          {activeSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 text-green-400 px-5 py-4 flex items-center gap-3 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{flash.success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatedSection>
          <SectionHeading
            label="Contact Us"
            title="Let's Talk About Your Security Needs"
            description="Whether you need a quote, consultation, or immediate assistance — our team is ready 24/7."
          />
        </AnimatedSection>

        {/* ── Emergency banner ── */}
        <AnimatedSection delay={0.1}>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 animate-pulse-alert">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-coin-text">Emergency? We're here 24/7</div>
                <div className="text-xs text-coin-muted">Call our dispatch center for immediate assistance</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="tel:+265999611711" className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-all shrink-0">
                <Phone className="w-4 h-4" /> +265 99 961 1711
              </a>
              <a href="https://wa.me/265999611711?text=Hi%20Coin%20Security%2C%20I%20need%20assistance." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </AnimatedSection>

        {/* ── Intake type selector ── */}
        <div className="mt-10 mb-8">
          <div className="text-sm text-coin-muted mb-4 text-center">Tell us what you need help with:</div>
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {TABS.map((tab) => (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setActiveIntake(tab.key)}
                className={`w-full px-3 py-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                  activeIntake === tab.key
                    ? `${tab.color} text-white shadow-lg`
                    : 'bg-coin-card text-coin-text border-coin-border hover:border-coin-accent/30'
                }`}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-5 gap-12 lg:gap-16">
          <AnimatedSection direction="left" className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={isQuoteMode ? quote.data.website : intake.data.website}
                onChange={(e) => {
                  if (isQuoteMode) quote.setData('website', e.target.value);
                  else intake.setData('website', e.target.value);
                }}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Issue subtype selector (only when in issue mode) */}
              {!isQuoteMode && (
                <div>
                  <label className="block text-sm font-medium text-coin-muted mb-1.5">Issue Type *</label>
                  <select
                    value={issueSubtype}
                    onChange={(e) => setIssueSubtype(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50 transition-all"
                  >
                    {ISSUE_TYPES.map((it) => (
                      <option key={it.value} value={it.value}>{it.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name + Email */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-coin-muted mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={isQuoteMode ? quote.data.name : intake.data.name}
                    onChange={(e) => {
                      if (isQuoteMode) quote.setData('name', e.target.value);
                      else intake.setData('name', e.target.value);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-accent/50 focus:ring-1 focus:ring-coin-accent/20 transition-all"
                    placeholder="Your name"
                  />
                  {isQuoteMode && quote.errors.name && <div className="text-sm text-red-400 mt-1">{quote.errors.name}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-coin-muted mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={isQuoteMode ? quote.data.email : intake.data.email}
                    onChange={(e) => {
                      if (isQuoteMode) quote.setData('email', e.target.value);
                      else intake.setData('email', e.target.value);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-accent/50 focus:ring-1 focus:ring-coin-accent/20 transition-all"
                    placeholder="you@example.com"
                  />
                  {isQuoteMode && quote.errors.email && <div className="text-sm text-red-400 mt-1">{quote.errors.email}</div>}
                </div>
              </div>

              {/* Phone + Company (quote) / Phone only (issue) */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-coin-muted mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={isQuoteMode ? quote.data.phone : intake.data.phone}
                    onChange={(e) => {
                      if (isQuoteMode) quote.setData('phone', e.target.value);
                      else intake.setData('phone', e.target.value);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-accent/50 focus:ring-1 focus:ring-coin-accent/20 transition-all"
                    placeholder="+265 99 123 4567"
                  />
                </div>
                {isQuoteMode && (
                  <div>
                    <label className="block text-sm font-medium text-coin-muted mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={quote.data.company}
                      onChange={(e) => quote.setData('company', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-accent/50 focus:ring-1 focus:ring-coin-accent/20 transition-all"
                      placeholder="Your company"
                    />
                  </div>
                )}
              </div>

              {/* Quote-specific fields */}
              <AnimatePresence>
                {isQuoteMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-medium text-coin-muted mb-1.5">Service Interested In</label>
                      <select
                        value={quote.data.service_interest}
                        onChange={(e) => quote.setData('service_interest', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50 transition-all"
                      >
                        <option value="general">General Inquiry</option>
                        <option value="security_guards">Security Guards (Man Guarding)</option>
                        <option value="cctv_surveillance">CCTV / Surveillance</option>
                        <option value="mobile_patrol">Mobile Patrol / Rapid Response</option>
                        <option value="event_security">Event Security</option>
                        <option value="consultation">Security Consultation</option>
                        <option value="integrated_systems">Integrated Security Systems</option>
                      </select>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-coin-muted mb-1.5">Budget Range</label>
                        <select
                          value={quote.data.budget}
                          onChange={(e) => quote.setData('budget', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50 transition-all"
                        >
                          <option value="">Prefer to discuss</option>
                          <option value="under_5k">Under $5,000</option>
                          <option value="5k_10k">$5,000 – $10,000</option>
                          <option value="10k_25k">$10,000 – $25,000</option>
                          <option value="25k_50k">$25,000 – $50,000</option>
                          <option value="over_50k">Over $50,000</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-coin-muted mb-1.5">Timeline</label>
                        <select
                          value={quote.data.timeline}
                          onChange={(e) => quote.setData('timeline', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50 transition-all"
                        >
                          <option value="">Select timeline</option>
                          <option value="asap">ASAP / Emergency</option>
                          <option value="1_month">Within 1 month</option>
                          <option value="3_months">Within 3 months</option>
                          <option value="6_months">Within 6 months</option>
                          <option value="planning">Just planning</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Additional Details (issue mode only) */}
              {!isQuoteMode && (
                <details
                  open={extraOpen}
                  onToggle={(e) => setExtraOpen((e.target as HTMLDetailsElement).open)}
                  className="rounded-xl border border-coin-border bg-coin-card/40 group"
                >
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-coin-muted flex items-center justify-between transition-colors hover:text-coin-text">
                    <span>Additional Details (optional)</span>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-coin-muted mb-1.5">Client Name</label>
                        <input
                          value={intake.data.client_name}
                          onChange={(e) => intake.setData('client_name', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50"
                          placeholder="Client name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-coin-muted mb-1.5">Site</label>
                        <input
                          value={intake.data.client_site}
                          onChange={(e) => intake.setData('client_site', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50"
                          placeholder="Site name"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              )}

              {/* Subject / Title */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className={isQuoteMode ? 'sm:col-span-3' : 'sm:col-span-2'}>
                  <label className="block text-sm font-medium text-coin-muted mb-1.5">
                    {isQuoteMode ? 'Subject *' : 'What happened? *'}
                  </label>
                  <input
                    value={isQuoteMode ? quote.data.subject : intake.data.title}
                    onChange={(e) => {
                      if (isQuoteMode) quote.setData('subject', e.target.value);
                      else intake.setData('title', e.target.value);
                    }}
                    placeholder={isQuoteMode ? 'e.g. Security quote for retail store' : 'Briefly describe the issue'}
                    className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-accent/50 focus:ring-1 focus:ring-coin-accent/20 transition-all"
                    required
                  />
                  {isQuoteMode && quote.errors.subject && <div className="text-sm text-red-400 mt-1">{quote.errors.subject}</div>}
                </div>
                {/* Contextual dropdown for issue mode */}
                {!isQuoteMode && (
                  <div>
                    {activeContext === 'urgency' && (
                      <div>
                        <label className="block text-sm font-medium text-coin-muted mb-1.5">Urgency</label>
                        <select
                          value={intake.data.priority}
                          onChange={(e) => intake.setData('priority', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50 transition-all"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    )}
                    {activeContext === 'down_type' && (
                      <div>
                        <label className="block text-sm font-medium text-coin-muted mb-1.5">Issue Type</label>
                        <select
                          value={intake.data.down_type}
                          onChange={(e) => intake.setData('down_type', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50 transition-all"
                        >
                          <option value="guard_absent">Guard Absent</option>
                          <option value="site_unmanned">Site Unmanned</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    )}
                    {activeContext === 'category' && (
                      <div>
                        <label className="block text-sm font-medium text-coin-muted mb-1.5">Category</label>
                        <select
                          value={intake.data.category}
                          onChange={(e) => intake.setData('category', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm focus:outline-none focus:border-coin-accent/50 transition-all"
                        >
                          <option value="incident">Incident</option>
                          <option value="emergency">Emergency</option>
                          <option value="complaint">Complaint</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description / Message */}
              <div>
                <label className="block text-sm font-medium text-coin-muted mb-1.5">
                  {isQuoteMode ? 'Message *' : 'Tell us more *'}
                </label>
                <textarea
                  value={isQuoteMode ? quote.data.message : intake.data.description}
                  onChange={(e) => {
                    if (isQuoteMode) quote.setData('message', e.target.value);
                    else intake.setData('description', e.target.value);
                  }}
                  placeholder={isQuoteMode ? 'Describe your security needs...' : 'Add details to help us respond quickly'}
                  className="w-full px-4 py-3 rounded-xl bg-coin-card border border-coin-border text-coin-text text-sm placeholder:text-coin-muted/50 focus:outline-none focus:border-coin-accent/50 focus:ring-1 focus:ring-coin-accent/20 min-h-[120px] resize-none transition-all"
                  required
                />
                {isQuoteMode && quote.errors.message && <div className="text-sm text-red-400 mt-1">{quote.errors.message}</div>}
              </div>

              {/* Attachments (issue mode only) */}
              {!isQuoteMode && (
                <details
                  open={attachOpen}
                  onToggle={(e) => setAttachOpen((e.target as HTMLDetailsElement).open)}
                  className="rounded-xl border border-coin-border bg-coin-card/40 group"
                >
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-coin-muted flex items-center justify-between transition-colors hover:text-coin-text">
                    <span>Attachments (optional)</span>
                    <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-4 pb-4 space-y-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => intake.setData('attachments', Array.from(e.target.files || []))}
                      className="block w-full text-sm text-coin-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-coin-accent/10 file:text-coin-accent hover:file:bg-coin-accent/20"
                    />
                    {intake.progress && (
                      <div className="text-sm text-coin-muted">Uploading {intake.progress.percentage}%</div>
                    )}
                  </div>
                </details>
              )}

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={activeProcessing}
                className={`w-full px-8 py-3.5 text-sm font-semibold text-white rounded-xl transition-all duration-300 shadow-lg shadow-coin-glow disabled:opacity-60 flex items-center justify-center gap-2 ${
                  isQuoteMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-coin-accent hover:bg-coin-accent-light'
                }`}
              >
                {activeProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-4 h-4" /> {isQuoteMode ? 'Send Inquiry' : 'Send Message'}</>
                )}
              </motion.button>
            </form>
          </AnimatedSection>

          {/* ── Right: Contact Info ── */}
          <AnimatedSection direction="right" delay={0.2} className="lg:col-span-2">
            <div className="space-y-8">
              <div className="p-8 rounded-2xl border border-coin-border bg-coin-card/60 backdrop-blur-sm group hover:border-coin-accent/20 transition-all duration-500">
                <h3 className="text-lg font-bold text-coin-text mb-6">Contact Information</h3>
                <div className="space-y-5">
                  {[
                    { icon: 'MapPin', label: 'Head Office', value: 'Area 47/4, Viphya street, Lilongwe, Malawi' },
                    { icon: 'Phone', label: 'Phone', value: '+265 99 961 1711' },
                    { icon: 'Mail', label: 'Email', value: 'info@coinsecurity.mw' },
                    { icon: 'Clock', label: 'Hours', value: '24/7 — We never close' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4 group">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-coin-accent/10 text-coin-accent shrink-0 group-hover:bg-coin-accent/20 transition-all duration-300">
                        <IconMapper name={item.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-coin-muted">{item.label}</div>
                        <div className="text-sm font-medium text-coin-text">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-500/10 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 text-red-400 shrink-0 animate-pulse-alert">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-coin-text mb-1">Emergency Response</h3>
                    <p className="text-xs text-coin-muted mb-3">Active security emergency? Call our dispatch center immediately.</p>
                    <div className="flex flex-wrap gap-2">
                      <a href="tel:+265999611711" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all">
                        <Phone className="w-4 h-4" /> +265 99 961 1711
                      </a>
                      <a href="https://wa.me/265999611711?text=Hi%20Coin%20Security%2C%20I%20have%20an%20emergency." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-sm">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-coin-border bg-coin-card/40 backdrop-blur-sm">
                <h4 className="text-sm font-semibold text-coin-text mb-3">Operating Regions</h4>
                <div className="flex flex-wrap gap-2">
                  {['Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Mangochi', 'Salima'].map((region) => (
                    <span key={region} className="px-3 py-1 text-xs font-medium text-coin-accent bg-coin-accent/10 rounded-full">
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* ── FAQ ── */}
        <AnimatedSection delay={0.3}>
          <div className="mt-24">
            <div className="text-center mb-12">
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-coin-accent bg-coin-accent/10 px-4 py-1.5 rounded-full mb-4">FAQ</span>
              <h2 className="text-3xl font-bold text-coin-text mb-2">Frequently Asked Questions</h2>
              <p className="text-coin-muted">Common questions about our security services</p>
            </div>
            <div className="max-w-3xl mx-auto space-y-3">
              {FAQ_DATA.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full text-left rounded-xl border border-coin-border bg-coin-card/60 p-5 transition-all hover:border-coin-accent/20 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold text-coin-text">{faq.q}</h3>
                      <ChevronDown className={`w-4 h-4 text-coin-muted shrink-0 transition-transform duration-300 ${faqOpen === i ? 'rotate-180' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {faqOpen === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 text-coin-muted text-sm overflow-hidden"
                        >
                          {faq.a}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
