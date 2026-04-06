# Architecture Decisions — Resume Fixer AI

> Settled decisions. Do NOT re-debate these. If you think one is wrong, add a note under "Reconsider?" — don't change the code.

---

## ADR-001: Expo SDK 54 + Managed Workflow

**Decision**: Use Expo managed workflow with dev-client for native modules.
**Why**: Fast iteration, OTA updates, single codebase. Razorpay requires `expo-dev-client`.
**Reconsider?**: Only if a native module has no Expo config plugin.

## ADR-002: Supabase Edge Functions (Deno)

**Decision**: All server logic runs as Supabase Edge Functions on Deno runtime.
**Why**: Zero infra management, free tier generous. Four functions: analyze-resume, generate-resume-fix, create-payment-order, verify-payment.
**Constraint**: Deno imports only. No Node.js APIs. No `require()`.
**Reconsider?**: Only if Deno cold-start latency >3s in production.

## ADR-003: OpenAI Server-Side Only

**Decision**: React Native client never calls OpenAI directly. All AI calls go through Supabase Edge Functions which have the key in Vault.
**Why**: Embedding an OpenAI API key in a React Native app exposes it via reverse engineering. Server-side also gives cost control.
**Reconsider?**: Never. This is a security boundary.

## ADR-004: Score Range 28–100

**Decision**: ATS scores floor at 28, not 0.
**Why**: A score of 0 feels broken. 28 communicates "very poor but still a resume." Calibrated against benchmark samples.
**Reconsider?**: Only with new benchmark data from real recruiters.

## ADR-005: Mock Fallback for Development

**Decision**: When `isSupabaseConfigured() === false`, the app uses deterministic mock data.
**Why**: Enables `expo start --web` development without backend secrets.
**Constraint**: Mock scores are hash-based and repeatable — same input = same score.
**Reconsider?**: No. Keep this forever for demo and testing.

## ADR-006: AsyncStorage for Local History

**Decision**: Resume scan history stored in device-local AsyncStorage (max 10 items).
**Why**: No auth required. Privacy-first (data stays on device). Simplest MVP.
**Constraint**: No cross-device sync. No backup.
**Reconsider?**: When adding user accounts / Supabase Auth.

## ADR-007: Razorpay as the Only Payment Gateway

**Decision**: Razorpay exclusively. No Stripe, no PayU, no PayTM.
**Why**: Razorpay is RBI-regulated, supports UPI/NetBanking/Cards, has Indian tax compliance built in, and is what Indian fresher users recognise. Stripe has higher failure rates in India.
**Constraint**: Native Android only (Razorpay SDK). Client-initiated verification (no webhooks).
**Reconsider?**: Only if Razorpay blocks our merchant category.

## ADR-008: Single Payment Tier (₹199)

**Decision**: One-time ₹199 payment unlocks 1 resume rewrite via Razorpay. Not a subscription.
**Why**: Target user (fresher, Tier 2/3) is deeply subscription-averse. One-time payment is easier to justify ("it's like a chai and a vada"). Subscriptions require more trust.
**Constraint**: Native Android only (Razorpay SDK).
**Reconsider?**: Can add subscription model at ₹5L+ MRR.

## ADR-009: 3 Parallel OpenAI Rewrites

**Decision**: Paid rewrite fires 3 parallel GPT-4o-mini calls — summary, bullets, skills.
**Why**: Lowest latency (parallel > sequential). Each call has focused prompt + token limit.
**Constraint**: Max tokens — summary:180, bullets:320, skills:180.
**Reconsider?**: Only if OpenAI rate limits become an issue.

## ADR-010: No Hallucination Policy

**Decision**: All rewrite prompts explicitly forbid inventing experience, metrics, or credentials.
**Why**: Trust is the product. Users must recognize their own resume after rewrite.
**Enforcement**: Prompts say "preserve original metrics", "do NOT add tools/companies not in original."
**Reconsider?**: Never. This is a brand promise.

## ADR-011: Free Preview = 1 Bullet Rewritten, Rest Blurred

**Decision**: Show exactly one rewritten bullet point free. Blur everything else with `expo-blur`.
**Why**: Enough to prove value (user sees the quality of improvement), not enough to capture without paying. Score jump (e.g., 41→83) is always visible — it drives the emotional buy decision.
**Implementation**: `previewWeakestBullet()` in analyze-resume, `BlurView` overlay in AppShell.
**Reconsider?**: Only based on conversion data.

## ADR-012: expo-print for PDF Generation (Client-Side)

**Decision**: Generate PDF on device using expo-print, not on server.
**Why**: Avoids paying for server-side PDF generation, avoids storing final PDF on Supabase storage (privacy), faster delivery to user (no download wait).
**Reconsider?**: Only if PDF formatting needs server-side templates.

## ADR-013: No Backend Resume Storage

**Decision**: Resume data stored only on device (AsyncStorage). No server-side DB for resume text or generated PDFs.
**Why**: DPDP Act 2023 — the less resume data we retain server-side, the simpler compliance is. Resume text is sent transiently to OpenAI via edge functions but never persisted on our servers.
**Constraint**: Only server-side table is `retry_log` (scoring QA). No `payments`, `resumes`, or `consent_logs` tables.
**Reconsider?**: When adding auth + server-side history sync.

## ADR-014: DOCX Support Deferred

**Decision**: MVP accepts PDF upload + paste text. DOCX MIME type is accepted by the picker but returns "not enabled yet" from the edge function.
**Why**: PDF is the standard for Indian job applications. DOCX adds parsing complexity. Ship paste-text + PDF first, add DOCX parser once core flow is stable.
**Reconsider?**: When adding file parsing backend slice.

## ADR-015: PostHog + Sentry Planned (Not Installed)

**Decision**: PostHog for analytics, Sentry for error tracking — chosen but NOT yet in package.json.
**Why**: PostHog gives session replay (critical for understanding where Indian freshers get confused). Sentry has better React Native integration than Firebase Crashlytics. Both have generous free tiers.
**Constraint**: Do not reference in code until packages are installed. Do not add tracking calls to components.
**Reconsider?**: Always open to alternatives before install.

## ADR-016: Theme Palette as Single Source

**Decision**: All colors come from `src/theme/palette.ts`. No hex literals in components.
**Why**: Consistent dark theme. Easy to change palette later.
**Palette**: bg=#07111F, panel=#0F1C2E, text=#F5F7FA, mint=#76E4C3, warning=#FFBF69, danger=#FF7A7A.
**Reconsider?**: Only when adding light mode.

## ADR-017: Named Exports Only

**Decision**: No default exports anywhere in the codebase.
**Why**: Better refactoring, clearer imports, consistent style.
**Reconsider?**: No.

---

_Add new decisions at the bottom. Use format: ADR-NNN: Title → Decision → Why → Reconsider?_
