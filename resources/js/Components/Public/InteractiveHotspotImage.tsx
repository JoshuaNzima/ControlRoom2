import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Modal from '@/Components/Modal';

type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  color?: string;
  icon?: string;
  slug?: string;
};

export default function InteractiveHotspotImage({ imageUrl, hotspots: inputHotspots, onSelect, showModal = true }: { imageUrl: string; hotspots?: Hotspot[]; onSelect?: (h: Hotspot | null) => void; showModal?: boolean }) {
  const hotspots = useMemo<Hotspot[]>(
    () =>
      inputHotspots || [
        { id: 'cctv', label: 'CCTV Surveillance', x: 10.8, y: 33.2, color: 'indigo', icon: 'Camera', slug: 'cctv-surveillance' },
        { id: 'guards', label: 'Manned Guards', x: 33.5, y: 63.0, color: 'red', icon: 'Shield', slug: 'manned-guards' },
        { id: 'k9', label: 'K9 Patrols', x: 51.5, y: 83.0, color: 'emerald', icon: 'Dog', slug: 'k9-patrols' },
        { id: 'rapid', label: 'Rapid Response Vehicle', x: 71.5, y: 61.0, color: 'rose', icon: 'Car', slug: 'rapid-response' },
        { id: 'perimeter', label: 'Perimeter Protection', x: 56.0, y: 54.0, color: 'amber', icon: 'ShieldCheck', slug: 'perimeter-protection' },
        { id: 'signage', label: 'Brand Signage', x: 90.0, y: 37.0, color: 'purple', icon: 'BadgeCheck', slug: 'branding' },
      ],
    [inputHotspots]
  );

  const [active, setActive] = useState<Hotspot | null>(null);

  return (
    <div className="relative w-full">
      <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950">
        <img
          src={imageUrl}
          alt="Compound Overview"
          className="w-full h-auto select-none"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = '0.6';
          }}
        />
        <div className="absolute inset-0">
          {hotspots.map((h) => {
            const base = h.color || 'red';
            const colorRing =
              base === 'indigo' ? 'ring-indigo-400' :
              base === 'emerald' ? 'ring-emerald-400' :
              base === 'amber' ? 'ring-amber-400' :
              base === 'purple' ? 'ring-purple-400' :
              'ring-red-400';
            const bgDot =
              base === 'indigo' ? 'bg-indigo-500' :
              base === 'emerald' ? 'bg-emerald-500' :
              base === 'amber' ? 'bg-amber-500' :
              base === 'purple' ? 'bg-purple-500' :
              'bg-red-500';
            return (
              <div
                key={h.id}
                className="absolute"
                style={{ left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <motion.button
                  type="button"
                  aria-label={h.label}
                  onClick={() => { setActive(h); onSelect?.(h); }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-8 h-8 rounded-full ${colorRing} ring-2 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-white/40`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${bgDot} shadow`} />
                  <motion.span
                    className={`absolute inset-0 rounded-full ${colorRing}`}
                    initial={{ opacity: 0.4, scale: 1 }}
                    animate={{ opacity: 0, scale: 2 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <motion.span
                    className={`absolute inset-0 rounded-full ${colorRing}`}
                    initial={{ opacity: 0.35, scale: 1 }}
                    animate={{ opacity: 0, scale: 2.6 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                  />
                </motion.button>
                <div className="hidden md:block">
                  <AnimatePresence>
                    <motion.div
                      key={`tip-${h.id}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 px-2 py-1 rounded bg-black/70 text-white text-xs backdrop-blur-sm"
                      style={{ transform: 'translate(-50%, 0)', left: '50%', position: 'relative', whiteSpace: 'nowrap' }}
                    >
                      {h.label}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {active && showModal && (
          <Modal show={true} onClose={() => { setActive(null); onSelect?.(null); }} maxWidth="xl">
            <div className="p-6 bg-white dark:bg-gray-900">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Service</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{active.label}</h3>
                </div>
                <button onClick={() => { setActive(null); onSelect?.(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>
              <div className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                {active.id === 'cctv' && (
                  <p>Advanced CCTV solutions with 24/7 live monitoring, cloud recording, and intelligent analytics for proactive security.</p>
                )}
                {active.id === 'guards' && (
                  <p>Professional manned guarding services with trained, vetted personnel and clear SLAs for every site.</p>
                )}
                {active.id === 'k9' && (
                  <p>Specialized K9 patrol units for high‑risk areas, deterrence, and rapid response support.</p>
                )}
                {active.id === 'access' && (
                  <p>Modern access control systems integrating cards, PINs, and biometrics with detailed audit trails.</p>
                )}
                {active.id === 'alarm' && (
                  <p>Intrusion and panic alarm systems with immediate notifications and escalation to response teams.</p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-3 justify-end">
                <button onClick={() => setActive(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Close</button>
                {active.slug && (
                  <a
                    href={route('public.services.show', active.slug) as any}
                    className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    View Service
                  </a>
                )}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
