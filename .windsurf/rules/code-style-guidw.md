---
trigger: always_on
---

Always use laravel 12 rules for backend
All frontend are coded in react (tsx) format
always maintain color-theme
Instead of create, show, edit pages, use modals for faster navigation
take a mobile 1st approach for all pages & modals - support down to 375px screens
keep consistency on dark mode, make sure there's no light colors in dark mode
Delete all obsolete code and files whenever changes are made
Avoid reverting to something that was changed unless explicitly instructed

**Responsive Design Standards (375px+ support):**
- Use `px-2 sm:px-4` instead of fixed `px-4` padding
- Use `py-2 sm:py-3` instead of fixed `py-3` padding
- Use `text-xs sm:text-sm` and `text-sm sm:text-base` for font scaling
- Use `gap-2 sm:gap-3` instead of fixed gaps
- Apply `touch-target-min` class to buttons smaller than 44px
- Use `min-w-0` and `truncate` on text containers to prevent overflow
- Modals should use `p-4 sm:p-6` and `rounded-t-xl sm:rounded-xl`
- Grid layouts should use `grid-cols-1 sm:grid-cols-2` breakpoints
- Action buttons should always be visible on mobile (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`)

**Defensive Programming - Handle Stupid User Actions:**
- Always validate and sanitize all user inputs (frontend + backend)
- Never trust client-side data; re-validate everything server-side
- Handle null/undefined gracefully with optional chaining (`?.`) and nullish coalescing (`??`)
- Add type guards for runtime type checking on external data
- Implement proper error boundaries and catch blocks with user-friendly messages
- Guard against race conditions with loading states and request deduplication
- Prevent double-submissions with button disabling during async operations
- Validate file uploads (type, size, content) before processing
- Escape/sanitize all rendered user content to prevent XSS
- Limit API rate and add pagination for large data sets
- Add confirmation dialogs for destructive actions (delete, bulk operations)
- Handle network failures gracefully with retry logic and offline state
- Validate date ranges (start <= end, not in past if restricted)
- Check permissions on every action, not just UI visibility
- Log security events (failed auth, suspicious inputs) for audit trails
- Gracefully degrade when optional features/APIs are unavailable 