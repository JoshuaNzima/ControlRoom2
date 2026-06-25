# Guard Assignments & Site Management — Improvement Plan

## Running checklist
- [x] Identify and fix stale import (QuickAttendanceConfirmModal)
- [x] Extract 4 inline modals from RosterWeekly.tsx
- [x] Create ShellHeader component
- [x] Create ShellTasksPanel component
- [x] Refactor AdminLayout → use ShellHeader + ShellTasksPanel
- [x] Refactor ControlRoomLayout → use ShellHeader + ShellTasksPanel
- [x] Refactor FinanceLayout → use ShellHeader + ShellTasksPanel
- [x] Fix `any` types: add typed `InertiaSharedProps` to `types.ts`
- [x] Create `useDefaults` utility
- [x] Create Layouts/index.ts barrel export
- [x] Dead code cleanup — removed stale `build_output.txt`, `docs/Sergeant improvement.md`

---

## Phase 1 — Consolidate Assignment Model ✅
- [x] **Merge `is_active` + `active`** on `GuardAssignment` — dropped `active` column, all controllers now use `is_active` uniformly
- [x] **Add `source` field** to `GuardShift` — `enum: assignment_generated, weekly_planner, manual_roster_entry`
- [x] **Add centralized shift overlap validation** — model-level `boot()` on `Shift` that throws `ValidationException` on overlapping shifts for the same guard
- [x] **Normalize `GuardAssignment` deactivation** — all 4 controllers consistently set `is_active=false` + `end_date=today()` on deactivation
- [x] **Fix bug** in `RosterController::manualEntryBulk` — wrong variable `$gid` instead of `$guard->id`

## Phase 2 — Fix Site-Client-Assignment Hierarchy ✅
- [x] **Remove blanket "assign to all sites" behavior** from `ClientsController::assignGuard` — now requires `client_site_id`, validates it belongs to the client, and checks for existing assignments before creating
- [x] **Add `sergeant_id` field to `ClientSite`** — migration `2026_06_25_171500` ran, column added with FK to `guards`, `sergeant()` relationship defined on `ClientSite` model. Enables per-site sergeant assignment (overrides client-level sergeant)
- [x] **Add zone-consistency check** — `GuardAssignment::checkZoneConsistency()` static method compares the new site's zone against all other active assignments for the same guard, emitting a warning when they differ. Wired into `ClientsController::assignGuard`

## Phase 3 — Stabilize Zone Coverage Calculations ✅
- [x] **Extract zone recalc from `ClientSite` boot events** into a dedicated `ZoneCoverageService`
- [x] **Add scheduled task** to recalculate all zone required-guard-counts daily (`zones:recalc-required-guards` at 02:30 in Kernel.php)
- [x] **Stop swallowing errors** in zone recalculation — `ClientSite::updateZoneRequiredGuards` now delegates to `ZoneCoverageService::recalculateZone()` which logs full exception details
- [x] **Add "recalculate now" button** in the Control Room zone UI — per-zone "Recalculate" button and "Recalculate All" button in Zone Overview header
- [x] **Remove budget & requisitions from supervisor/sergeant sidebar** — removed `QuickBudgetButton` (import + usage) and "Requisitions" nav link from `SupervisorLayout.tsx`

## Phase 4 — Resolve Sergeant/Supervisor Duality ✅
- [x] **Create unified `getManagedGuardIds()` service** (`GuardScopingService`) that all roles use, replacing per-controller guard-scope logic
- [x] **Consolidate sergeant + supervisor into a single backend role/query path** — both use `Guard.supervisor_id = User.id`. The only remaining distinction is a display label (`getRoleType()` returns `'sergeant'` or `'supervisor'` for the UI). All inline `isSergeant()` branch logic in controllers removed.
- [x] **Reconcile `Client.supervisor_id` (User FK) vs `Client.sergeant_id` (Guard FK)** — `sergeant_id` eliminated from scoping logic. The single FK is `Client.supervisor_id` (User FK). Sergeants find their clients via `Client.supervisor_id` same as supervisors. Legacy fallback via `resolveGuardForUser()` is preserved but marked for removal.
- [x] **Delegate all guard-scoping to `GuardScopingService`** in:
  - `SupervisorController` (3 inline methods, 5 inline `isSergeant()` branches → all service calls)
  - `AssignmentController` (`Guard::forSupervisor()` → service query)
  - `SupervisorAssignmentController` (`Guard::forSupervisor()` → service query)
  - `User::managedGuards()` (inline zone_commander/supervisor branching → single service call)
- [x] **Added `getManagedClientIds()` + `getManagedSiteIds()`** to `GuardScopingService` for unified client/site scoping (used by `guards()`, `analytics()`, `reports()` views)
- [x] **Removed all `Client::where('sergeant_id', ...)` calls** from controllers; replaced with `GuardScopingService::getManagedClientIds()` which uses `Client.supervisor_id` uniformly

### Phase 4 Post-Review Cleanup ✅
- [x] **Removed unused `SergeantController`** — dead import and route deleted from `routes/modules/guards.php`, controller file deleted
- [x] **Refactored `ReportsController`** — replaced `Guard::scopeForSupervisor()` calls with `GuardScopingService` via `applyGuardScoping()` / `applyGuardEntityScoping()` helpers (3 methods: attendance, shifts, guard_performance)
- [x] **Refactored `ShiftController`** — replaced `Guard::scopeForSupervisor()` calls with `GuardScopingService` via `getManagedGuardsQuery()` (4 methods: index, create, edit, and the guard list queries)

## Phase 5 — Clean Up Rota System ✅
- [x] **Add proper model definitions** to `GuardRotaException`, `RotaTemplate`, `RotaTemplateDay` (fillable, casts, relationships) — all three models have fillable, casts, and relationships
- [x] **Simplify exception handling** — `intent` column (enum: off|work|swap) replaces the old `ad_hoc_off` / `work_override` fighting. Migration `2026_06_25_145719` adds the column and backfills. All controller code uses `intent` exclusively (verified: zero stale references in app code).
- [x] **Extract weekly planner publish logic** — `WeeklyPlanPublisherService` extracted from `RosterController::publishWeeklyPlan`, now a dedicated testable service.
- [x] **Add unit tests** (16 tests, 36 assertions) for `RotaResolver::getDayStatus()` covering: no-template, off-intent, work-override-intent, template-fallback, template-work, latest-exception-wins, swap-as-off, legacy-off-day, off-day-outside-range, exception-overrides-legacy, null-intent-fallback, multi-day-range, weekday-cycle, null-end-date, `getTemplateDayStatus` no-template, `getTemplateDayStatus` template-off.
- [x] **Fix `guard()` method name collision** — renamed to `guardRelation()` in `GuardRotaException` to avoid conflict with Eloquent `Model::guard()`
- [x] **Add `rota_template_id`** to Guard model's `$fillable` array
- [x] **Migration to make `exception_type` nullable** — `2026_06_25_161228` allows creating exceptions without the legacy column value

## Phase 6 — UI Consolidation
- [ ] **Remove `SimplifiedWeeklyRosterSection.tsx`** if legacy, or document when each roster component should be used
- [ ] **Standardize guard-to-site assignment modal** — one component used across all views
- [ ] **Add visual coverage gap indicator** — days where a site's assigned guards < required count

---

## Key Findings (context for understanding why)

### Three overlapping assignment mechanisms
`GuardAssignment` (long-term), `GuardShift` (daily shifts), `WeeklyRosterPlanEntry` (drafting layer), and `RelieverRotation` (relievers) all represent "where a guard should be" — and they can disagree.

### `is_active` vs `active` on GuardAssignment — RESOLVED
Both columns existed with the same meaning. Migration `2026_06_25_161500` added `is_active`, copied data from `active`, dropped `active`. All controllers now consistently use `is_active`.

### Centralized overlap validation — ADDED
Model-level `saving` event on `Shift` guards against overlapping shifts. Previously only controllers did spot-checks.

### Blanket site assignment — RESOLVED
`ClientsController::assignGuard` previously assigned a guard to all client sites. Now requires explicit site selection per assignment.

### Zone cross-assignment warning — ADDED
`GuardAssignment::checkZoneConsistency()` warns when a guard is assigned to sites in different zones, surfaced as a flash warning in the UI.

### Zone required guard count — STABILIZED
Recalculated in a dedicated `ZoneCoverageService` with proper error logging. The service is called from `ClientSite` boot events, from the `ZoneController` (store/update/destroy), from a scheduled command (`zones:recalc-required-guards` at 02:30 daily), and from a new "Recalculate Now" / "Recalculate All" button in the zone management UI.

### Sergeant vs Supervisor: same rank, different scope
Confirmed: both are guards promoted one step. They share identical duties, functions, and training. The only operational difference is scope:
- **Supervisor** — anchored to one main site (e.g. a mall or farm), responsible for guards at that location.
- **Sergeant** — roving monitor, moves between multiple sites under a client or zone.

Despite the different labels, their backend logic, permissions, and daily activities are identical. Phase 4 will consolidate them into a single backend role while preserving the display labels for operational clarity.

### Budget & Requisitions removed from supervisor sidebar
The `QuickBudgetButton` component and "Requisitions" nav link have been removed from `SupervisorLayout.tsx`. Budgets and requisitions are now accessible only through their dedicated modules (Finance and Admin), keeping the supervisor/guard-facing dashboard focused on core operations.
