# 🎨 Landing Pages — Light Theme + Interactive UX

## Confirmed
- ✅ Keep red accent (`#e04b3f`)
- ✅ Keep all security-themed animations (scan lines, radar, badges, corner brackets, particles)
- 🎯 **Modern tech-forward** — light, clean, confident

---

## Phase A — Color system rewrite

- [x] **`tailwind.config.js`** — Rewrote all `coin-*` tokens to light values

## Phase B — Update all pages to light colors

- [x] **`PublicLayout.tsx`** — Light header (white, shadow), light footer, clean dark refs
- [x] **`Home.tsx`** — Light text, white cards, section backgrounds use coin-surface/white
- [x] **`About.tsx`** — Light sections, stats bar, values
- [x] **`Careers.tsx`** — Light sections, job cards, modal
- [x] **`Privacy.tsx`** — Light sections
- [x] **`Services/Index.tsx`** — Light sections, service cards
- [x] **`Services/Service.tsx`** — Light sections, feature cards
- [x] **`ContactFormSection.tsx`** — Light form styling
- [x] **`QuoteModal.tsx`** — Light modal styling
- [x] **`SectionHeading.tsx`** — Clean light colors
- [x] **`resources/css/app.css`** — Removed datepicker dark overrides

## Phase C — Interactive elements

- [x] **`AnimatedCounter.tsx`** — Number ticks up from 0 on scroll
- [x] **`TiltCard.tsx`** — 3D mouse-perspective tilt wrapper
- [x] **MagneticButton** — Inline in Home.tsx, CTA buttons follow cursor
- [x] **Hero typewriter** — Phrases cycle with blur transition
- [x] **Testimonial carousel drag** — Click+drag support with infinite scroll
- [x] **Scroll progress bars** — Thin accent bar on card reveal (features section)
- [x] **Mouse parallax on hero decorations** — Subtle cursor tracking

## Phase D — Integration wiring

- [x] AnimatedCounter → Home.tsx stats + About.tsx stats
- [x] TiltCard → Home.tsx service cards + feature cards
- [x] MagneticButton → CTA buttons, hero buttons
- [x] Typewriter → Hero headline
- [x] Drag → Testimonial carousel
- [x] Scroll progress bars → Features section
- [x] Mouse parallax → Hero decorative elements

## Phase E — Verification

- [x] `npx tsc --noEmit` — No type errors
- [ ] Open each page — correct colors, interactive elements work
- [ ] Mobile responsive check
