# TODO

## Rota phase
- [x] Inspect remaining rota-related files
  - [x] `app/Services/RotaResolver.php`
  - [x] `app/Http/Controllers/ControlRoom/RosterController.php`
  - [x] `resources/js/Pages/ControlRoom/RosterWeekly.tsx`
- [x] Implement deterministic `GuardRotaException` reconciliation in `RosterController@publishWeeklyPlan`
  - [x] Ensure conflicts `ad_hoc_off` vs `work_override` are removed deterministically for each guard/day based on draft intent
  - [x] Fix cleared override behavior to delete exception types corresponding to the cleared previous intent
- [x] Update `RotaResolver`
  - [x] Add `getTemplateDayStatus()`
  - [x] Refactor `getDayStatus()` to support deterministic reconciliation
- [x] Verify manual shift paths match publish/reconciliation logic
  - [x] Confirm `upsertManualShift()` creates the same exception semantics used by weekly planner
  - [x] Align manual off-day/work-day exception cleanup with planner reconciliation
- [ ] Refactor rota frontend into a simpler UI
  - [ ] Review current weekly planner data shape, permissions, and actions
  - [ ] Define the simplified layout and interaction model
  - [ ] Split the page into smaller presentation components
  - [ ] Replace the table-heavy desktop/mobile split with a cleaner responsive roster view
  - [x] Keep existing modals and route contracts intact
  - [ ] Reduce visual noise in header, filters, badges, and action buttons
- [ ] Verify the simplified UI
  - [ ] Run TypeScript/build checks for the updated frontend
  - [ ] Smoke-test the rota page in the browser for layout and interactions
  - [ ] Confirm save/publish/manual edit flows still work
- [ ] Run quick sanity checks
  - [ ] Attempt automated tests (`php artisan test ...`) where available
  - [ ] Route/UI smoke-test for `RosterWeekly` save/publish if possible
  - [ ] PHP syntax check for `RosterController.php`

## Loyalty hardening phase
- [x] Implement integer-based point handling and strict service-layer validation for all point inputs
- [x] Add row-level locking (`lockForUpdate`) around client loyalty balance rows and reward inventory rows during redeem flows
- [x] Make redemption approval/rejection idempotent and status-aware
- [x] Remove nested transaction ambiguity by making one service method own the whole flow
- [x] Replace regex-based rule parsing with explicit structured fields in `loyalty_rules`
- [x] Add safe expiration processing with claimed/processing states to prevent double-expiry
- [x] Tighten authorization with service-level guards
- [x] Add tests for:
  - [x] concurrency (redeem/approval/expiration)
  - [x] duplicate approvals/rejections
  - [x] insufficient balance
  - [x] limited reward inventory exhaustion
  - [x] expiration processing idempotency
- [x] Add Admin UI for setting/updating loyalty rules
- [x] Add Loyalty on/off toggle for admin settings
  - [x] Off removes loyalty-points related items from client dashboard
- [x] Verify loyalty admin UI tests

## Loyalty hardening phase
- [x] Implement integer-based point handling and strict service-layer validation for all point inputs
- [x] Add row-level locking (`lockForUpdate`) around client loyalty balance rows and reward inventory rows during redeem flows
- [x] Make redemption approval/rejection idempotent and status-aware
- [x] Remove nested transaction ambiguity by making one service method own the whole flow
- [x] Replace regex-based rule parsing with explicit structured fields in `loyalty_rules`
- [x] Add safe expiration processing with claimed/processing states to prevent double-expiry
- [x] Tighten authorization with service-level guards
- [x] Add tests for:
  - [x] concurrency (redeem/approval/expiration)
  - [x] duplicate approvals/rejections
  - [x] insufficient balance
  - [x] limited reward inventory exhaustion
  - [x] expiration processing idempotency
- [x] Add Admin UI for setting/updating loyalty rules
- [x] Add Loyalty on/off toggle for admin settings
  - [x] Off removes loyalty-points related items from client dashboard
- [x] Verify loyalty admin UI tests
