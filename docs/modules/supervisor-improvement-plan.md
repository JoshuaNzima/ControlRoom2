# Supervisor & Sergeant Module — Improvement & Fix Plan

## Primary Goal: Consolidation & Unification

The Supervisor module (shared by both supervisors and sergeants) is part of a larger pattern where **every role has its own copy of the same page**. This plan identifies what can be unified and what should stay module-specific.

---

## Full Capability Map — Guards Pages (All Modules)

Based on reading every guards page in every module:

| Module | Guards Page | Search/Filter | View Details | Check-In/Out | Bulk Ops | Assignments | Status Changes | Add/Edit Guard | Import/Export |
|--------|------------|---------------|--------------|--------------|----------|-------------|----------------|----------------|---------------|
| **Supervisor** | `Supervisor/Guards/Index.tsx` | ✅ name, ID, status, guard type, sort | ✅ modal | ✅ full (present, absent, check-in, check-out, backdate) | ✅ bulk check-in/out | ❌ | ❌ | ❌ | ❌ |
| **Admin** | `Admin/Guards/Index.tsx` | ✅ name/ID/phone | ✅ modal (compliance) | ❌ | ❌ | ❌ | ✅ (via other pages) | ❌ | ✅ export |
| **Control Room** | `ControlRoom/Guards/Index.tsx` | ✅ name/ID, status, zone, client, supervisor, on-duty, sort | ✅ modal (compliance) | ✅ basic (present, absent) | ✅ bulk cover | ✅ assign site, assign supervisor | ✅ **suspend, dismiss, resign, retired** | ✅ add & edit (3-edit limit) | ✅ import + export |
| **Zone Commander** | `ZoneCommander/Guards.tsx` | ✅ name/ID/email/site, status (6 states), risk level | ❌ (no modal) | ❌ (separate attendance page) | ❌ | ✅ deploy to site | ❌ | ❌ | ❌ |
| **Operations** | `Operations/Guards/Index.tsx` | ✅ status dropdown | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Training** | `Training/Guards/Index.tsx` | ✅ name/ID | ✅ basic modal | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Other Duplicated Pages Snapshot

| Page Type | Supervisor | Control Room | Zone Commander | Admin | Operations |
|-----------|------------|--------------|----------------|-------|------------|
| **Attendance** | `Supervisor/Attendance.tsx` — **DELETED** (Phase 2) | `ControlRoom/Attendance/Index.tsx` — **DELETED** (Phase 2) | `ZoneCommander/Attendance.tsx` — **DELETED** (Phase 2) | — | — |
| **Downs** | (via controller) | `ControlRoom/Downs/Index.tsx` — **DELETED** (Phase 3) | `ZoneCommander/Downs.tsx` — **DELETED** (Phase 3) | `Admin/Downs/Index.tsx` — **DELETED** (Phase 3) | — |
| **Reports** | `Supervisor/Reports.tsx` — **TO DELETE (Phase 4)** | `ControlRoom/Reports/Index.tsx` — **TO DELETE (Phase 4)** | `ZoneCommander/Reports.tsx` — **TO DELETE (Phase 4)** | `Admin/Reports.tsx` — **TO DELETE (Phase 4)** | `Operations/Reports/*` — scope TBD |

---

## Consolidation Roadmap

### PHASE 1: Unify Guards Pages — ✅ COMPLETE

**Current state:** 6 separate Guards index pages → single `resources/js/Pages/Guards/Index.tsx`

1. **Accepts a `mode` prop** controlling available actions:

   | Mode | Roles | Actions Available |
   |------|-------|------------------|
   | `view-only` | Training, Operations, HR | Search/filter, view details, read-only table |
   | `attendance-basic` | Zone Commander | Above + mark present, check out (minimal) |
   | `attendance-full` | Supervisor, Sergeant | Above + full check-in/out, bulk check-in/out, backdate |
   | `control-room` | Control Room | Above + add/edit guard, assign site, assign supervisor, **status changes** (suspend/dismiss/resign/retired), import/export, bulk cover |
   | `admin` | Admin, Super Admin | Above + full CRUD, compliance management, assignment management |

2. **Uses the same component set**, with conditional rendering based on `mode`:
   - `GuardFilterBar` — shared filter component (search, status, guard type, zone, client, supervisor, sort)
   - `GuardListItem` — shared card/row component (initials avatar, name, ID, status badge, assignment info, today attendance)
   - `StatusBadge` — shared badge component (takes `status` + `type` props)
   - Action buttons rendered only based on mode capabilities

3. **Backend:** Single controller method (or existing controller specific to each role prefix) that:
   - Scopes data via `GuardScopingService`
   - Returns the unified `Guards/Index` Inertia page
   - Injects the `mode` string based on authenticated user's permissions

**Files deleted after consolidation:** 5 directories × 1+ files each — Supervisor/Guards/Index.tsx, Admin/Guards/Index.tsx, ControlRoom/Guards/Index.tsx, ZoneCommander/Guards.tsx, Operations/Guards/Index.tsx, Training/Guards/Index.tsx

### PHASE 2: Unify Attendance Pages — ✅ COMPLETE

| Module | File | Capabilities |
|--------|------|-------------|
| **Supervisor** | `Supervisor/Attendance.tsx` | Full attendance table, filters (date/status/search), real-time Echo listener, scanner integration, stat cards |
| **Control Room** | `ControlRoom/Attendance/Index.tsx` | Previous-week attendance, Tuesday-only edit window, Super Admin override, filters (search/status/site/date) |
| **Control Room** | `ControlRoom/Attendance/Edit.tsx` | Edit individual attendance record |
| **Zone Commander** | `ZoneCommander/Attendance.tsx` | Basic mark present / check out, site selection, stat cards, photo evidence |

**Resolution:** Single `resources/js/Pages/Attendance/Index.tsx` with `mode` prop (`supervisor`, `control-room`, `zone-commander`). Shared table layout, role-based action columns. Old files deleted.

### PHASE 3: Unify Downs Pages — ✅ COMPLETE

| Module | File | Capabilities |
|--------|------|-------------|
| **Admin** | `Admin/Downs/Index.tsx` | Report down (form with site/guard search), escalate, resolve, abscond, guard details modal |
| **Control Room** | `ControlRoom/Downs/Index.tsx` | Report down (dialog), escalate, resolve, abscond, guard details modal, deploy cover, stat cards, pagination |
| **Zone Commander** | `ZoneCommander/Downs.tsx` | Report down (modal), escalate, resolve, deploy cover, guard search, site search |

**Resolution:** Unified `resources/js/Pages/Downs/Index.tsx` with `mode` prop (`admin`, `control-room`, `zone-commander`). Three role-specific report forms embedded in same file. All old module-specific files deleted. Controllers unchanged (Admin/DownsController, ControlRoom/DownsController, ZoneCommander/DownsController each render `Downs/Index` with appropriate mode).

### PHASE 4: Unify Reports Pages — 🔴 IN PROGRESS

| Module | File | Capabilities |
|--------|------|-------------|
| **Supervisor** | `Supervisor/Reports.tsx` (24KB) | Date range filter, stat cards, attendance breakdown chart, absence leaders, attendance records table, PDF/CSV export, email report |
| **Control Room** | `ControlRoom/Reports/Index.tsx` | Rendered via `ControlRoom\ReportsController` — route `control-room.reports` |
| **Zone Commander** | `ZoneCommander/Reports.tsx` | Rendered via `ZoneCommander\ReportsController` — route `zone.reports` |
| **Admin** | `Admin/Reports.tsx` | Rendered via `Admin\ReportsController` — route `admin.reports` |

**Current state:**
- Unified `resources/js/Pages/Reports/Index.tsx` already exists with:
  - Generic report generation UI (date range, report type dropdown, guard/site filters)
  - Attendance, shifts, guard performance, and site coverage report tables
  - Uses `ReportsController@index` and `ReportsController@generate` (routes defined in `routes/modules/reports.php`)
  - Route name: `reports.index`
  - Still lacks: Supervisor-specific features (stat cards, attendance breakdown chart, absence leaders, PDF/CSV export, email report)
- All old module-specific Reports pages still exist: `Supervisor/Reports.tsx`, `ControlRoom/Reports/Index.tsx`, `ZoneCommander/Reports.tsx`, `Admin/Reports.tsx`

**Proposed target:** Enhance single `resources/js/Pages/Reports/Index.tsx` with:
- `mode` prop: `supervisor`, `control-room`, `zone-commander`, `admin`
- Supervisor features: stat cards, attendance breakdown chart, absence leaders
- Export features (PDF/CSV)
- Email report capability
- Role-scoped data (already handled by `ReportsController`)

**Phase 4 Implementation Steps:**

| Step | Description | Status |
|------|-------------|--------|
| 1 | Read and analyze all 4 old Reports pages (`Supervisor/`, `ControlRoom/`, `ZoneCommander/`, `Admin/`) | 🔲 |
| 2 | Define ReportsMode type and feature-flag matrix | 🔲 |
| 3 | Merge Supervisor-specific features (stats cards, chart, absence leaders) into unified `Reports/Index.tsx` | 🔲 |
| 4 | Merge Control Room, Zone Commander, and Admin-specific features | 🔲 |
| 5 | Update all controllers to pass `mode` prop | 🔲 |
| 6 | Delete old module-specific Reports files | 🔲 |
| 7 | Verify all routes render unified page with correct mode | 🔲 |

---

## Supporting Optimizations (enabling the consolidation)

### FIX-C01: Shared StatusBadge component (prerequisite for unification)
**Why:** Every duplicate page defines its own `getStatusBadge()`, `getStatusColor()`, `getAttendanceBadge()`, `getPerformanceColor()` etc. To unify, we need a single badge component that all roles can use.
**Create:** `resources/js/Components/Guards/StatusBadge.tsx`
```tsx
<StatusBadge status="present" type="attendance" />
<StatusBadge status="active" type="guard" />
<StatusBadge status="permanent" type="guard_type" />
<StatusBadge status="suspended" type="guard" variant="outlined" />
```

### FIX-C02: Shared GuardFilterBar component
**Why:** Every guards page has search + status filter but with different field sets. Extract to one configurable component.
**Create:** `resources/js/Components/Guards/GuardFilterBar.tsx` with props for which filters to show (search, status, guard type, zone, client, supervisor, sort, risk level).

### FIX-C03: Shared GuardListItem component
**Why:** Each guards page renders guard info differently. One component ensures consistent layout, with slots for action buttons.
**Create:** `resources/js/Components/Guards/GuardListItem.tsx` that accepts `actions` slot and mode.

### FIX-C04: Eliminate `app()` service locator pattern
**File:** `app/Http/Controllers/Guards/SupervisorController.php`
**Why:** Blocks service extraction. Inject `GuardScopingService` and `SiteScanLockService` via constructor.

### FIX-C05: Extract AttendanceService from SupervisorController
**File:** `app/Http/Controllers/Guards/SupervisorController.php` → extract checkIn/checkOut/bulkCheckIn/bulkCheckOut/manualAttendance
**Why:** These are needed by multiple controllers (supervisor, control room, zone commander). Extracting into `App\Services\Supervisor\AttendanceService` means one implementation, consumed by all.

### FIX-C06: Single aggregation query for guard stats
**File:** `app/Http/Controllers/Guards/SupervisorController.php`, `buildGuardStats()`
**Issue:** 6 separate COUNT queries. Replace with one `SUM(CASE...)` query.

### FIX-AUTO01: Auto-attendance — mark absent guards at end of day
**Files:** `app/Services/AttendanceService.php` + `app/Console/Commands/AutoMarkAbsentGuards.php`
**Issue:** If a supervisor does not manually mark guards present or absent, attendance records stay blank. The system should auto-mark all active guards as absent at a configurable cutoff time.
**Goal:**
- Add `autoMarkAbsent(string $date)` to `AttendanceService` — creates `absent` records for all active guards who have no attendance record for that date.
- Create `AutoMarkAbsentGuards` artisan command (runs via scheduler daily at e.g. 23:00).
- Register in `app/Console/Kernel.php` schedule.
- Gate with a `Setting` flag (`auto_mark_absent`) so super admins can enable/disable it.
- Respect `guard_type` exemptions (e.g. `reliever` guards might be excluded since they're on-call).

### FIX-C07: Delete dead code
**Files:**
- `routes/modules/supervisor.php` — empty comment only
- `resources/js/Pages/Supervisor/Guards.tsx` — superseded by `Guards/Index.tsx`

### FIX-C08: Fix layout imports and semicolons
**Files:** `Attendance.tsx`, `Assignments.tsx`, `Guards.tsx`, `GuardShow.tsx`, `Reports.tsx`, `Profile.tsx`
**Issue:** Import `AuthenticatedLayout` (old layout) without semicolons.

### FIX-C09: Standardize `route()` usage over hardcoded paths
**Files:** `Overview.tsx`, `Assignments.tsx`
**Why:** Hardcoded `/supervisor/attendance` breaks if routes change.

---

## What Stays Module-Specific

| Feature | Reason |
|---------|--------|
| **Supervisor Overview** | Role-specific KPI dashboard — no equivalent in other modules |
| **Supervisor Analytics** | Guard performance + site coverage — unique to supervisors/sergeants |
| **Supervisor Scanner** | QR scanning for attendance site lock — supervisor-specific workflow |
| **Zone Commander Dashboard** | Zone-level KPI, different from supervisor |
| **Control Room Monitoring** | Real-time map + camera feeds — unique to control room |
| **Finance/HR Dashboards** | Finance-specific metrics, HR-specific actions |
| **Assignments Page** | Reassign/unassign guard sites — admin/control-room specific (Supervisor/Assignments.tsx may be superseded by ControlRoom/Assignments) |

---

## Implementation Order

| Phase | Fix ID | Description | Effort | Dependencies | Status |
|-------|--------|-------------|--------|-------------|--------|
| **Prep** | FIX-C07 | Delete dead code (route file, duplicate page) | Low | None | ✅ |
| **Prep** | FIX-C09 | Standardize route() usage | Low | None | ✅ |
| **Prep** | FIX-C08 | Fix layout imports + semicolons | Low | None | ✅ |
| **Prep** | FIX-C01 | Create shared StatusBadge component | Low | None | ✅ |
| **Prep** | FIX-C02 | Create shared GuardFilterBar | Low | None | ✅ |
| **Prep** | FIX-C03 | Create shared GuardListItem | Low | None | ✅ |
| **Backend** | FIX-C04 | Constructor injection for services | Medium | None | ✅ |
| **Backend** | FIX-C05 | Extract AttendanceService | Medium | FIX-C04 | ❌ Not started |
| **Backend** | FIX-C06 | Single aggregation query for stats | Medium | None | ✅ |
| **Phase 1** | — | Unify Guards pages (6 → 1) | High | FIX-C01..C03, C04, C05 | ✅ |
| **Phase 2** | — | Unify Attendance pages (4 → 1) | High | FIX-C01, C05 | ✅ |
| **Phase 3** | — | Unify Downs pages (3 → 1) | High | FIX-C01 | ✅ |
| **Phase 4** | — | Unify Reports pages (4 → 1) | High | FIX-C01 | 🔴 In Progress |

---

## File Deletion Plan (After Consolidation)

### Guards (Phase 1) — ✅ All deleted
- `resources/js/Pages/Supervisor/Guards.tsx` ✅
- `resources/js/Pages/Supervisor/Guards/Index.tsx` ✅
- `resources/js/Pages/Admin/Guards/Index.tsx` ✅
- `resources/js/Pages/ControlRoom/Guards/Index.tsx` ✅
- `resources/js/Pages/ZoneCommander/Guards.tsx` ✅
- `resources/js/Pages/Operations/Guards/Index.tsx` ✅
- `resources/js/Pages/Training/Guards/Index.tsx` ✅

### Attendance (Phase 2) — ✅ All deleted
- `resources/js/Pages/Supervisor/Attendance.tsx` ✅
- `resources/js/Pages/ControlRoom/Attendance/Index.tsx` ✅
- `resources/js/Pages/ControlRoom/Attendance/Edit.tsx` ✅
- `resources/js/Pages/ZoneCommander/Attendance.tsx` ✅

### Downs (Phase 3) — ✅ All deleted
- `resources/js/Pages/Admin/Downs/Index.tsx` ✅
- `resources/js/Pages/ControlRoom/Downs/Index.tsx` ✅
- `resources/js/Pages/ZoneCommander/Downs.tsx` ✅

### Reports (Phase 4) — 🔴 To delete
- `resources/js/Pages/Supervisor/Reports.tsx` ⬜
- `resources/js/Pages/ControlRoom/Reports/Index.tsx` ⬜
- `resources/js/Pages/ZoneCommander/Reports.tsx` ⬜
- `resources/js/Pages/Admin/Reports.tsx` ⬜

### Routes cleanup
- `routes/modules/supervisor.php` (dead) ✅

---

## Mode Definitions

### Guards Mode (Phase 1 — Unified)

```typescript
type GuardsMode = 
  | 'view-only'        // Read-only guard directory — search, filter, view details
  | 'attendance-basic' // Mark present/absent + assign site + check-out
  | 'attendance-full'  // Full check-in/out, bulk, backdate, time overrides
  | 'control-room'     // Attendance + status changes + assignments + limited CRUD + import/export
  | 'admin'            // Everything: full CRUD, compliance, assignments, all status changes
```

### Attendance Mode (Phase 2 — Unified)

```typescript
type AttendanceMode = 
  | 'supervisor'    // Full attendance table, filters, Echo listener, scanner, stats
  | 'control-room'  // Previous-week attendance, Tuesday-only edit, Super Admin override
  | 'zone-commander' // Basic mark present/check-out, site selection, photo evidence
```

### Downs Mode (Phase 3 — Unified)

```typescript
type DownMode = 
  | 'admin'           // Embedded form (site/guard search), escalate, resolve, abscond
  | 'control-room'    // Dialog form, escalate, resolve, abscond, deploy cover, pagination
  | 'zone-commander'  // Modal form, escalate, resolve, deploy cover, guard/site search
```

### Reports Mode (Phase 4 — Proposed)

```typescript
type ReportsMode =
  | 'supervisor'       // Full: stats cards, chart, absence leaders, attendance table, export, email
  | 'control-room'     // Operational metrics, incident reports, shift completion
  | 'zone-commander'   // Zone-level attendance, site coverage
  | 'admin'            // Full system-wide reports, compliance, financial
```

### Complete Role-to-Mode Mapping (Guards)

Every non-client role gets access to the unified Guards page. Based on each role's operational needs:

| # | Role Group | Mode | Has Guards Page Today? | Rationale |
|---|-----------|------|----------------------|-----------|
| 1 | **Super Admin** | `admin` | ❌ (uses submodule links) | Full control — same capabilities as Admin |
| 2 | **Admin** | `admin` | ✅ `admin.guards.index` | Full CRUD, compliance, export |
| 3 | **Control Room Operator** | `control-room` | ✅ `control-room.guards` | Status changes, assignments, CRUD, export |
| 4 | **Operations Officer** | `control-room` | ✅ (shares control-room nav) | Same as control room operator |
| 5 | **Supervisor** | `attendance-full` | ✅ `supervisor.guards` | Full attendance with backdate + bulk |
| 6 | **Sergeant** | `attendance-full` | ✅ (shares supervisor nav) | Same as supervisor |
| 7 | **Zone Commander** | `attendance-basic` | ✅ `zone.guards.index` | Present/absent + deploy to site |
| 8 | **Operations Manager** | `view-only` | ✅ `operations.guards.index` | Guard roster for field deployments |
| 9 | **Training** | `view-only` | ✅ `training.guards.index` | Guards Directory for training programs |
| 10 | **HR** | `view-only` | ❌ **NEW** | Guard lookup for employees, disciplinary, benefits |
| 11 | **Finance** | `view-only` | ❌ **NEW** | Guard list for payroll context |
| 12 | **Asset Manager** | `view-only` | ❌ **NEW** | Guard list for asset handover context |
| 13 | **Business Dev** | `view-only` | ❌ **NEW** | Guard data for contract proposals |
| 14 | **Front Desk / Assistant** | `view-only` | ❌ **NEW** | Guard lookup for visitor check-in |
| 15 | **Marketing** | `view-only` | ❌ **NEW** | Lowest operational need — completeness |
| 16 | **Front Office** | `view-only` | ❌ **NEW** | Guard lookup for executive support |
| 17 | **Task Tracker** | `view-only` | ❌ **NEW** | Know which guards exist for task assignment |
| — | **Client** | **NO ACCESS** | — | Explicitly excluded |

### View-Only Capabilities

`view-only` mode provides a read-only guard directory:

- **Search & filter** — by name, employee ID, status, guard type
- **Sort** — by name, employee ID, status
- **Guard list display** — name, employee ID, phone, status badge, guard type badge, on-duty indicator
- **Attendance info (read-only)** — today's check-in time, check-out time, site, hours worked
- **View details modal** — read-only guard details including compliance info

Specifically **excluded** from `view-only`: no action buttons of any kind (check-in/out, present/absent, status changes), no bulk operations, no add/edit, no import/export, no site/supervisor assignments.

Each mode maps to a set of feature flags:

| Feature | view-only | attendance-basic | attendance-full | control-room | admin |
|---------|-----------|-----------------|----------------|--------------|-------|
| Search & filter | ✅ | ✅ | ✅ | ✅ | ✅ |
| View details | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quick Present | ❌ | ✅ | ✅ | ✅ | ✅ |
| Quick Absent | ❌ | ✅ | ✅ | ✅ | ✅ |
| Check-in (with site/time/backdate) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Check-out | ❌ | ✅ | ✅ | ✅ | ✅ |
| Bulk check-in/out | ❌ | ❌ | ✅ | ❌ | ✅ |
| Bulk mark covered | ❌ | ❌ | ❌ | ✅ | ❌ |
| Assign site | ❌ | ✅ | ❌ | ✅ | ✅ |
| Assign supervisor | ❌ | ❌ | ❌ | ✅ | ✅ |
| Suspend guard | ❌ | ❌ | ❌ | ✅ | ✅ |
| Dismiss guard | ❌ | ❌ | ❌ | ✅ | ✅ |
| Mark resigned/retired | ❌ | ❌ | ❌ | ✅ | ✅ |
| Add new guard | ❌ | ❌ | ❌ | ✅ (limited) | ✅ |
| Edit guard (3-edit limit) | ❌ | ❌ | ❌ | ✅ (limited) | ✅ |
| Import guards | ❌ | ❌ | ❌ | ✅ | ✅ |
| Export guards | ❌ | ❌ | ❌ | ✅ | ✅ |
| Compliance tracking | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Current Status (Checklist)

### Preparation (Process Before Consolidation)
- [x] FIX-C07: Delete dead `routes/modules/supervisor.php`
- [x] FIX-C07: Delete dead `Supervisor/Guards.tsx`
- [x] FIX-C08: Fix layout imports + missing semicolons
- [x] FIX-C09: Replace hardcoded paths with `route()` named routes

### Shared Components (Prerequisites for Unification)
- [x] FIX-C01: Create `Components/Guards/StatusBadge.tsx`
- [x] FIX-C02: Create `Components/Guards/GuardFilterBar.tsx`
- [x] FIX-C03: Create `Components/Guards/GuardListItem.tsx`

### Backend Refactoring (Before Unification)
- [x] FIX-C04: Constructor injection for services (existing + residual `app()` calls)
- [x] FIX-C06: Single aggregation query for `buildGuardStats()` + `attendanceToday` + `attendanceTrend`

### Consolidation Phases
- [x] PHASE 1: Unify Guards pages (6 → 1) — Supervisor/Sergeant now uses unified `Guards/Index` with `mode='attendance-full'`
- [x] PHASE 2: Unify Attendance pages (4 → 1) — All 3 controllers render `Attendance/Index` with mode prop; old files deleted
- [x] PHASE 3: Unify Downs pages (3 → 1) — Unified `Downs/Index.tsx` exists with `admin`, `control-room`, `zone-commander` modes; all old module-specific files deleted
- [ ] PHASE 4: Unify Reports pages (4 → 1) — Unified `Reports/Index.tsx` exists but lacks Supervisor-specific features (stats, chart, absence leaders, PDF/CSV export, email). Old module-specific files still present.
