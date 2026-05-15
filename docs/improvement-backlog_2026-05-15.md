# Improvement Backlog (System-wide) — 2026-05-15

## High impact (implement first)

1. **Invoices: “Pay Now” CTA is a placeholder**
   - **File:** `resources/js/Pages/Client/Invoices.tsx`
   - **Issue:** “Pay Now” does nothing and closes the modal (`// TODO: Add payment link or contact support`).
   - **Goal:** Wire CTA to the correct payment flow (route/contact modal) and keep user context.

2. **Control Room: Down escalation missing notifications**
   - **File:** `app/Http/Controllers/ControlRoom/DownController.php`
   - **Issue:** `// TODO: notifications to stakeholders` inside `escalate()`.
   - **Goal:** Notify stakeholders via the project’s standard notification channel(s) when a down is escalated.

3. **Install flow: initial admin user not created**
   - **File:** `app/Http/Controllers/InstallController.php`
   - **Issue:** `// TODO: Create admin user here or via seeder using $data`
   - **Goal:** Create the initial admin user from install form input securely (hash password) or run an equivalent seeder step.

## Type-safety / code quality

4. **Control Room Flag UI removes `any`**
   - **File:** `resources/js/Pages/ControlRoom/Flags/Show.tsx`
   - **Issue:** `flag: any` and `useForm` cast to `any` with eslint disable.
   - **Goal:** Introduce a `Flag` type and remove unsafe casts.

5. **Scanner modal remove unsafe `(page.props as any)`**
   - **File:** `resources/js/Components/Scanner/ScannerModal.tsx`
   - **Issue:** `(page.props as any).flash` and `(page.props as any).scan`.
   - **Goal:** Type expected Inertia props to avoid runtime assumptions.

## Data quality

6. **Help article seeder has placeholder phone/email**
   - **File:** `database/seeders/HelpArticlesSeeder.php`
   - **Issue:** `+265 XXX XXX XXX`, `info@...`, `sales@...` are placeholders.
   - **Goal:** Replace with config/env-driven values or mark as explicit tokens.

## Optional (UX consistency)

7. **UI styling consistency: gradients / color conventions**
   - **Files:**
     - `resources/js/Pages/Client/Invoices.tsx`
     - `resources/js/Components/Scanner/ScannerModal.tsx`
     - `resources/js/Components/DashboardQRSection.tsx`
   - **Issue:** Some components use gradients / blue-tinted styles that may not match the repo’s desired visual consistency.
   - **Goal:** Standardize styling approach (flat cartoon brutalist vs gradients) across the app.

---

## Proposed implementation sequence
- Phase 1: (1) + (3) + (2)
- Phase 2: (4) + (5)
- Phase 3: (6)
- Phase 4 (optional): (7)
