# ControlRoom2 — Improvement Suggestions (AI + App Integration) — Explore Mode Findings

## Summary
ControlRoom2 is a Laravel + InertiaJS + React application with a significant role-permission model and an embedded AI assistant built via `alidaaer/laravel-ai-agent`. The AI portion is configured in `config/ai-agent.php`, exposed through widget endpoints under `/ai-agent/*`, and interacts with the domain via tools that read/update `HelpArticle` and generate illustrated SVG “guide images” stored as `Document` records. This report focuses on the AI integration and how it is wired into the web app (routes + UI), and highlights codebase improvement opportunities that a developer will likely hit quickly.

## Architecture
**Primary patterns:** 
- Laravel MVC + route-based authorization
- InertiaJS for React page rendering
- “Tool-based agent” runtime for AI actions (agent classes + tool classes)

### Key AI architecture pieces
1. **Agent classes**
   - `app/AI/Agents/ControlRoomAgent.php`
   - `app/AI/Agents/HelpCenterAgent.php`
   Both extend `LaravelAIAgent\BaseAgent`, define `instructions()`, list `tools()`, and enforce `routeMiddleware()` = `['web']`.

2. **Tools (invoked by the agent runtime)**
   - `app/AI/Tools/FindRelevantHelpArticlesTool.php`  
     Builds a category filter + role filter and returns candidate articles.
   - `app/AI/Tools/CreateOrUpdateHelpArticleTool.php`  
     Upserts a `HelpArticle` by slug/title and updates content, tags, roles, publication flags.
   - `app/AI/Tools/GenerateIllustratedGuideImageTool.php`  
     Generates deterministic SVG “click-path-like” graphics and persists them as a `Document`.
   - `app/AI/Tools/EscalateToHumanAgentTool.php`  
     Creates/updates `ChatSession` + assistant “transfer” message, then notifies potential human agents.

3. **Frontend widget**
   - `resources/js/Components/AI/AIAssistant.tsx`  
     Injects `<script src="/ai-agent/widget.js" />` and renders `<ai-agent-chat ... endpoint="/ai-agent/{slug}/chat" ... />`.

4. **Configuration**
   - `config/ai-agent.php`  
     Controls driver selection, tool discovery, memory, rate limits, widget defaults, and security settings (loop/iteration/tool-call caps, moderation, output sanitization).

5. **Super admin control plane for AI**
   - `routes/web.php` registers UI routes for `/ai-settings/*`
   - `app/Http/Controllers/SuperAdmin/AiSettingsController.php` handles provider and assistant enablement and connectivity testing.
   - `app/Models/AiAssistantSetting.php` stores enabled assistants and “active” assistant slug.

## Directory Structure (relevant excerpts)
```
project-root/
├── app/
│   ├── AI/
│   │   ├── Agents/
│   │   │   ├── ControlRoomAgent.php
│   │   │   └── HelpCenterAgent.php
│   │   └── Tools/
│   │       ├── CreateOrUpdateHelpArticleTool.php
│   │       ├── EscalateToHumanAgentTool.php
│   │       ├── FindRelevantHelpArticlesTool.php
│   │       └── GenerateIllustratedGuideImageTool.php
│   ├── Http/Controllers/SuperAdmin/AiSettingsController.php
│   └── Models/
│       ├── AiAssistantSetting.php
│       ├── HelpArticle.php
│       └── Document.php
├── config/
│   ├── ai-agent.php
│   └── ai.php
└── resources/js/
    └── Components/AI/AIAssistant.tsx
```

## Key Abstractions (most important to understand)

### 1) `ControlRoomAgent` / `HelpCenterAgent`
- **File**: `app/AI/Agents/ControlRoomAgent.php` and `app/AI/Agents/HelpCenterAgent.php`
- **Responsibility**: Provide system-level instructions and declare which tool methods the agent is allowed to call.
- **Interface**:
  - `instructions(): string` — hard-coded prompt rules, including escalation rules
  - `tools(): array` — which tool classes the agent can call
  - `routeMiddleware(): array` — uses `web` middleware
- **Lifecycle**: Instantiated per chat request by the AI package.
- **Used by**: AI agent runtime configured in `config/ai-agent.php`.

**Non-obvious behavior to know:** the agents repeat the same “if you can’t be confident, escalate” logic in text instructions, but enforcement depends on the agent runtime’s tool usage decisions—this is prompt-level policy, not hard server-side constraints.

---

### 2) `FindRelevantHelpArticlesTool`
- **File**: `app/AI/Tools/FindRelevantHelpArticlesTool.php`
- **Responsibility**: Locate published HelpCenter articles by role + category + optional query.
- **Interface**:
  - `find(context, userRole, query): array`
- **Lifecycle**: Pure read tool; no writes.
- **Used by**: Both agents to assemble “references to relevant Help Center articles”.

**Non-obvious behavior:** it uses `whereJsonContains('tags', $query)` for query matching; depending on how tags are stored (array of strings), a user passing a multi-word phrase may yield poor recall because tag matching is equality/contains semantics, not full-text.

---

### 3) `CreateOrUpdateHelpArticleTool`
- **File**: `app/AI/Tools/CreateOrUpdateHelpArticleTool.php`
- **Responsibility**: Upsert HelpArticle based on slug derived from title.
- **Interface**:
  - `upsert(title, content, category, tags, target_roles, video_url, is_published, featured): array`
- **Lifecycle**: Write tool.
- **Used by**: Agents to create guides or update existing ones.

**Improvement opportunities (meaningful for a developer):**
- The slug resolution uses `firstWhere('title', $title)?->slug`, which is unstable: if content changes but title does not, it works; if title changes slightly, it will create a new slug and effectively fork articles. A better invariant is “canonical identity” via slug or deterministic slug; decide which one is authoritative.
- It sets `created_by` only on create, but doesn’t set/validate view_count; sorting in the read tool assumes `view_count` exists and is updated elsewhere.

---

### 4) `GenerateIllustratedGuideImageTool`
- **File**: `app/AI/Tools/GenerateIllustratedGuideImageTool.php`
- **Responsibility**: Render deterministic SVG from steps and persist as a `Document` on `public` disk.
- **Interface**:
  - `generate(title, steps, context): array` → returns `document_id`, `url`, `mime_type`
- **Lifecycle**: Writes both DB (`Document`) and filesystem (`Storage::disk('public')->put(...)`).
- **Used by**: Agents when user asks “what to click” style content.

**Non-obvious behavior:** it writes SVG as a “file” but also sets `file_path=''` initially, then sets it after saving. That can break invariants if any middleware expects `file_path` to exist for new records immediately after `save()`.

---

### 5) `EscalateToHumanAgentTool`
- **File**: `app/AI/Tools/EscalateToHumanAgentTool.php`
- **Responsibility**: Create/update `ChatSession`, insert an assistant transfer message, and notify users (role-based) via notification.
- **Interface**:
  - `escalate(reason, conversation_id): array`
- **Lifecycle**: Writes to `ChatSession` and `ChatMessage`, sends notifications.
- **Used by**: Agents when confidence/safety/permissions require escalation.

**Non-obvious behavior / potential bug risk:**
- It uses `$conversationId = $conversation_id ?: \request()->input('conversation_id');`.
  The AI widget may provide a different param name depending on `laravel-ai-agent`’s widget implementation; if the widget doesn’t send `conversation_id`, the tool generates a random session id, making it harder to tie escalation to the current chat thread.
- It sets session context to `'general'` always, ignoring the caller’s agent context or route slug.

---

### 6) `AIAssistant` React component
- **File**: `resources/js/Components/AI/AIAssistant.tsx`
- **Responsibility**: Choose which assistant widget endpoint to use and pass user role + active assistant metadata to the widget.
- **Interface**:
  - Props: `context`, `className`, `showHelpLink`, `userRole` (note: most props are currently unused)
- **Lifecycle**: Render-time; uses `usePage()` to read `page.props`.

**Non-obvious behavior:** `role` is computed from `(page.props as any)?.auth?.user?.roles?.[0] ?? user_role ?? 'user'`. This assumes:
- `roles` is an array with the first element being role name, not a list of role objects
- shape differs across backends (Spatie typically returns Role objects with `name`)

This can lead to wrong `userRole` passed to widget / agent context.

---

### 7) `AiSettingsController` (SuperAdmin)
- **File**: `app/Http/Controllers/SuperAdmin/AiSettingsController.php`
- **Responsibility**: Admin UI for enabling providers and managing which assistant slug is active.
- **Interface**:
  - `index`, `update`, `enable`, `disable`, `assistants`
  - `enableAssistant`, `disableAssistant`, `setActiveAssistant`
  - `test` and provider-specific connectivity tests
- **Lifecycle**: HTTP request/response.

**Improvement opportunities:**
- `update()` only disables other providers if the incoming `enabled` is truthy and the provider was previously disabled. This is correct for “single active provider” behavior, but the UI should reflect that enabling happens automatically only under certain conditions.
- Connectivity tests for “gemini” use a `models/{model}:generateContent` path with `key` query param, while OpenAI-compatible uses `/chat/completions`. If `alidaaer/laravel-ai-agent` later standardizes request formats, this controller should align with the agent’s actual client implementation to avoid false positives.

---

### 8) `HelpArticle` model
- **File**: `app/Models/HelpArticle.php`
- **Responsibility**: Store published knowledge base entries and enforce slug generation.
- **Interface**:
  - `scopePublished`, `scopeFeatured`, `scopeWithVideo`
  - `getReadingTimeAttribute()` calculates reading time from HTML-stripped content.
  - `scopeForRole($role)` implements target_roles filtering with a runtime schema check.
- **Lifecycle**: Eloquent model.

**Non-obvious behavior / design decision:**
- `scopeForRole` checks `Schema::hasColumn('help_articles', 'target_roles')` at runtime and falls back to “no role filtering” when the column doesn’t exist.
  - This suggests migrations may be optional in some environments or during early rollout.
  - It also means role filtering behavior can silently change between staging/prod based solely on schema drift.

---

### 9) `Document` model (used by image tool)
- **File**: `app/Models/Document.php`
- **Responsibility**: Unified storage record for uploads, with access control (`canAccess`) and metadata.
- **Interface**:
  - `canAccess(User): bool`, `getPermission(User): ?string`
- **Used by**: `GenerateIllustratedGuideImageTool` persists a guide image as a Document.

## Data Flow (AI-specific)
1. User opens an Inertia page that includes the AI widget component.
2. `AIAssistant.tsx` injects `widget.js` and renders `<ai-agent-chat>` pointing to:
   - `/ai-agent/control-room/chat` or `/ai-agent/help-center/chat`
3. The AI widget sends chat messages to backend endpoints created by `config/ai-agent.php` (agents listed in `agents`).
4. The selected agent (`ControlRoomAgent` or `HelpCenterAgent`) uses tool access declared in `tools()`.
5. Tool calls occur:
   - `FindRelevantHelpArticlesTool.find()` returns candidate `HelpArticle`s for referencing
   - `CreateOrUpdateHelpArticleTool.upsert()` writes/updates `HelpArticle`
   - `GenerateIllustratedGuideImageTool.generate()` writes a deterministic SVG to disk and creates a `Document` row
6. If the agent can’t confidently proceed, it calls `EscalateToHumanAgentTool.escalate()` which:
   - creates/updates `ChatSession`
   - inserts an assistant transfer message
   - notifies likely human agents

## Non-Obvious Behaviors & Design Decisions (with concrete improvement suggestions)

### A) Prompt-level escalation vs server-side enforcement
- **What you have:** Agents instruct “MUST escalate instead of guessing.”
- **What’s risky:** The runtime relies on the model’s compliance. There is no hard enforcement that prevents unsafe tool calls or prevents write tools when required context is missing.
- **Suggestion:** add server-side validation guards inside tools (e.g., for `CreateOrUpdateHelpArticleTool` require `category` in allowed list; for escalation require the widget to provide conversation id and otherwise link via last assistant message).

### B) Role propagation assumptions in the React widget
- **Issue:** `AIAssistant.tsx` assumes `page.props.auth.user.roles[0]` contains a role string. With Spatie, shapes vary; often you get role objects.
- **Suggestion:** normalize role on the server (in inertia page props) to pass a guaranteed `userRole` string to the widget, instead of client-side guessing.

### C) Identity and “upsert” semantics for Help Center articles
- **Issue:** upsert chooses identity primarily via title→slug lookup; small title changes can create duplicates.
- **Suggestion:** decide a single canonical key:
  - canonical by slug (recommended), or
  - canonical by stable “article id” (requires tool schema changes)
  - then enforce it in `CreateOrUpdateHelpArticleTool` (and return whether it created vs updated).

### D) Schema drift handling in `HelpArticle::scopeForRole`
- **Issue:** runtime `Schema::hasColumn` fallback can silently disable role filtering.
- **Suggestion:** remove the schema check once migrations are guaranteed; or at least log a warning when role filtering is disabled so staging drift becomes visible.

### E) Persisting SVG images as Documents without asset lifecycle controls
- **Issue:** `GenerateIllustratedGuideImageTool` sets access_level=`private` and writes to `public/ai-guides/{id}/...svg` but does not:
  - ensure cleanup/deletion on document deletion
  - ensure access checks are enforced consistently in download routes
- **Suggestion:** verify `DocumentController::download` uses `canAccess()` and checks `file_path` for the Document record; if it does not, it’s a privacy vulnerability.

## Suggested Reading Order (to improve effectively)
1. `config/ai-agent.php` — understand agent runtime constraints, widget defaults, tool discovery, memory, security knobs.
2. `resources/js/Components/AI/AIAssistant.tsx` — see how widget endpoints and role metadata are passed.
3. `app/AI/Agents/ControlRoomAgent.php` + `app/AI/Agents/HelpCenterAgent.php` — review instruction policy and tool permissions.
4. `app/AI/Tools/*` — understand exactly what the agent can read/write and what validations are missing.
5. `app/Http/Controllers/SuperAdmin/AiSettingsController.php` + `app/Models/AiAssistantSetting.php` — see how providers and active assistant selection are controlled.
6. `app/Models/HelpArticle.php` and `app/Models/Document.php` — understand KB filtering and guide image persistence/access.

## Checklist (what to improve next; high priority)
- [ ] Confirm widget payload includes the param name expected by `EscalateToHumanAgentTool` (`conversation_id`)
- [ ] Normalize `userRole` passed to widget (avoid guessing on the client)
- [ ] Harden `CreateOrUpdateHelpArticleTool` invariants (slug identity policy; validate category/tag/role inputs)
- [ ] Add server-side validation for safe tool execution (don’t rely only on prompt instructions)
- [ ] Verify `DocumentController::download/preview` enforces `Document::canAccess()`
- [ ] Revisit `HelpArticle::scopeForRole` schema drift behavior (log or remove runtime fallback)
- [ ] Ensure `GenerateIllustratedGuideImageTool` sets `file_path` correctly and consistently at create time
