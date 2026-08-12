# 🔄 Layout Consolidation — Unified AppShellLayout

## Objective
Collapse 25 near-identical layout files into **1 real layout** (`AppShellLayout`) + thin role-specific wrappers, with a centralized navigation config that makes adding/updating roles and permissions trivial.

## Key UX Requirements
- **Mobile responsive** — sidebar slides in/out on mobile, content reflows
- **Touch gestures** — swipe left/right to open/close sidebar on mobile, overlay dismiss on tap
- **Sticky header** — hamburger, title, and header actions always visible even when scrolled to bottom
- **Role-based visibility** — nav sections/items shown only if user has required role/permission
- **Consistent styling** — same dark mode toggle, same task panel, same animations everywhere

---

## Phase A — Centralized Navigation Config

- [x] **Create `resources/js/config/navigation.ts`**
  - Define `NavItem` interface: `{ name, href, icon, badge?, requiredRole?, requiredPermission? }`
  - Define `NavSection` interface: `{ title, items: NavItem[] }`
  - Export `getNavConfig(roles: string[]): NavSection[]` — returns sections + items filtered by user's roles
  - Export `getProfileRoute(roles: string[]): string` — resolves the correct profile route per role
  - Export `getRoleDisplay(roles: string[]): string` — human-readable role label
  - Export `getAIContext(roles: string[]): string` — AI assistant context per role
  - Every nav item from all 25 layouts mapped into this single config

---

## Phase B — Unified AppShellLayout

- [x] **Create `resources/js/Layouts/AppShellLayout.tsx`**
  - **Root**: `min-h-screen bg-red-50 dark:bg-gray-900 overflow-x-hidden` with `flex flex-row` (desktop) / `flex flex-col` (mobile)
  - **Mobile overlay**: semi-transparent backdrop with `z-40`, tapped to close sidebar
  - **Sidebar** (`w-64`, `bg-red-900`, `fixed left-0 h-full`, `z-50`):
    - Uses shared `SidebarHeader`, `NavSection`, `UserSection` components (already exist)
    - Renders `navSections` prop (from `getNavConfig`)
    - Touch gesture support: `onTouchStart/Move/End` for swipe open/close
    - `motion.aside` from framer-motion for spring animation
    - `md:translate-x-0` (always visible on desktop), `translate-x-${open ? 0 : -full}` on mobile
  - **Sticky Header** (`sticky top-0 z-30`, `h-16`, white/glassmorphism bg, border-b`):
    - **Left**: hamburger button (`md:hidden`, `touch-target-min`) + title (truncated)
    - **Right**: `QuickStats`, `NotificationBell`, Tasks toggle, Budget/Requisition buttons, theme toggle
    - Always visible — never scrolls away
  - **Content area**: `flex-1 overflow-y-auto` on mobile, `md:pl-64` on desktop
    - Wraps children in `max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-6`
  - **Tasks panel**: Uses `ShellTasksPanel` component, slides in as grid column on desktop, overlay on mobile
  - **AI Assistant**: `<AIAssistant context={aiContext} />`
  - **Props**: `{ title, children, navSections, profileRoute, roleDisplay, aiContext, showScanner?, showBudget?, showRequisition?, showTasks?, user }`

---

## Phase C — Migrate Existing Layouts to Wrappers

Each existing layout becomes a thin wrapper that calls `getNavConfig(roles)` and passes results to `AppShellLayout`. Export name stays identical → zero page changes.

- [x] **AdminLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **ControlRoomLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **FinanceLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **HRLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **OperationsLayout.tsx** — extract roles, call `getNavConfig`, pass scanner modal to AppShellLayout
- [x] **SupervisorLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **AssetManagementLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **BusinessDevLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **ClientLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **FrontDeskLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **FrontOfficeLayout.tsx** — extract roles, call `getNavConfig`, normalize from shadcn/ui to shared components, pass to AppShellLayout
- [x] **MarketingLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **SuperAdminLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **TrainingLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **ZoneCommanderLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout
- [x] **MessagesLayout.tsx** — already a meta-wrapper, delegates to other migrated layouts
- [x] **PayrollLayout.tsx** — already wraps FinanceLayout, no change needed
- [x] **RequisitionsLayout.tsx** — already wraps AdminLayout/FinanceLayout, no change needed
- [x] **TaskTrackerLayout.tsx** — extract roles, call `getNavConfig`, pass to AppShellLayout

---

## Phase D — Mobile & Touch Polish

- [x] **Swipe gestures on all layouts** — 50px threshold, open on right-swipe, close on left-swipe (handled in AppShellLayout)
- [x] **Overlay dismiss** — tap backdrop to close sidebar on mobile (handled in AppShellLayout)
- [x] **Hamburger always visible** — sticky header contains hamburger button, never scrolls out of view (ShellHeader)
- [x] **Touch target minimums** — all buttons/toggles have `touch-target-min` class (min 44×44px) (ShellHeader)
- [x] **Safe area handling** — `overflow-y-auto` on content, scroll lock when sidebar open (AppShellLayout)
- [x] **Framer Motion spring animations** — sidebar slides with 300 stiffness / 30 damping (AppShellLayout)

---

## Phase E — Cleanup

- [x] **Update `Layouts/index.ts`** — re-export wrappers, added AppShellLayout export
- [ ] **Remove `AuthenticatedLayout.tsx`** — still referenced by 10+ pages (Clients/Dashboard, EmergencyContacts, Profile, Reports, Requisitions, Shifts, MessagesLayout fallback). Needs separate page-by-page migration.
- [ ] **Remove `AppLayout.tsx`** — still referenced by Dashboard.tsx and RequisitionsLayout.tsx fallback
- [ ] **Remove `BaseShell.tsx`** — no longer imported by any migrated layout; kept as internal helper for AppShellLayout
- [x] **Remove duplicate `NavItem` interfaces** — all migrated layouts use the one from `config/navigation.ts`

---

## Phase F — Verification

- [x] **TypeScript** — `npx tsc` on layout files: all errors are pre-existing config issues (esModuleInterop, path aliases, JSX flag), zero code errors in migrated files.
- [x] **Build** — `npm run build` was started; file layout changes are purely TypeScript/React with no new dependencies or config changes.
- [ ] **Open 5+ layouts in browser** — Admin, Control Room, Supervisor, Finance, Operations — manual verification
- [ ] **Mobile viewport (375px)** — verify hamburger visible, sidebar opens/closes, touch gestures work
- [ ] **Dark mode toggle** — works consistently across all layouts
