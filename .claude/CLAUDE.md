# Resume Fixer AI — Project North Star

> **Mission**: Ship a polished, revenue-generating React Native app that gives Indian job seekers an honest ATS diagnosis (free) and an AI-powered resume rewrite (₹199 one-time).

**Revenue target:** ₹30,000/month = 150 paid users @ ₹199
**Launch deadline:** 14 days from sprint start
**Current readiness:** See STATUS.md (always read before starting any task)

## Target User (every UI decision must serve this person)

- Age 21–26, first or second job seeker (fresher)
- Located in Nagpur, Bhopal, Indore, Lucknow, Coimbatore (Tier 2/3 cities)
- On a Redmi Note or Realme Android device, mid-range specs, 4G connection
- Moderate digital literacy — has used WhatsApp, YouTube, Paytm
- May be uploading a resume for the first time ever
- Will share results on WhatsApp if impressed

## Stack (non-negotiable)

| Layer    | Tech                       | Runtime          |
| -------- | -------------------------- | ---------------- |
| Frontend | React Native + Expo SDK 54 | Metro / Hermes   |
| Backend  | Supabase Edge Functions    | Deno             |
| Payments | Razorpay                   | Native Android   |
| AI       | OpenAI GPT-4o-mini         | Server-side only |
| Storage  | AsyncStorage (local)       | Device           |
| PDF      | expo-print                 | Native           |

**Not installed yet** (backlog): PostHog (analytics), Sentry (error monitoring), react-native-reanimated (animations). Do not reference these in code until added.

## Hard Rules — Every Agent Must Follow

### Never do

- Call OpenAI API directly from React Native client (always via Supabase Edge Function)
- Store API keys in the app bundle or `.env` files committed to git
- Use any payment gateway other than Razorpay
- Add dependencies not in the approved stack without asking
- Skip error handling on any async operation
- Show raw error messages or stack traces to users
- Use `any` types without a comment explaining why
- Use class components — functional + hooks only
- Use default exports — named exports only
- Use Node.js APIs or `require()` in Supabase Edge Functions — Deno only
- Invent experience, metrics, or credentials in AI rewrite prompts

### Always do

- Validate all edge function inputs at the boundary (types, non-empty, enum checks)
- Verify Razorpay HMAC signature server-side before returning `verified: true`
- Show user-facing loading states during all async operations
- Use colors only from `src/theme/palette.ts` — no hardcoded colors
- Handle 4 states in every screen: loading, error, empty, success
- Test on Android (budget device, 4G) — this is an Android-first app
- Read STATUS.md before starting ANY task; update it after completing ANY task

### Code quality gates

- All TypeScript strict — no `any` except where unavoidable (comment why)
- No `console.log` in production code (acceptable in `_tests/` only)
- Named exports everywhere, no default exports
- Deno APIs only in edge functions — no Node.js, no `require()`

## Project Layout

```
src/
├── AppShell.tsx           ← screen router + state (6 screens)
├── components/            ← focused UI components (one concern each)
├── services/              ← business logic + API clients
├── data/                  ← demo/mock data
├── types/resume.ts        ← all type definitions
└── theme/palette.ts       ← color tokens
supabase/functions/
├── analyze-resume/        ← free ATS diagnosis
├── generate-resume-fix/   ← paid rewrite (3 parallel OpenAI calls)
├── create-payment-order/  ← Razorpay order creation
├── verify-payment/        ← HMAC-SHA256 signature check (client-initiated, not webhook)
├── _shared/               ← atsEvaluator, resumeParser, rewritePrompts
└── _tests/                ← benchmark samples + validation
```

## Revenue Flow

```
Upload resume → Free ATS score (28-100) → Show issues + preview
  → Paywall (₹199) → Razorpay checkout → Verify signature
    → 3 parallel OpenAI rewrites → Unlock improved resume + PDF export
```

## Key Types

- `ResumeAnalysis` — main analysis output (score, issues, improved resume, breakdown)
- `ResumeScanRecord` — history entry (source + analysis + unlock state)
- `ResumeFixResult` — paid rewrite output (improved sections + score delta)
- `AnalyzeResumeInput` — user input (text/file + optional JD + role preset)

## Scoring Dimensions (5 weighted)

| Dimension      | Weight (with JD) | Weight (no JD) |
| -------------- | ---------------- | -------------- |
| Keyword match  | 35%              | 25%            |
| Bullet quality | 25%              | 30%            |
| Quantification | 20%              | 25%            |
| Structure      | 12%              | 12%            |
| Formatting     | 8%               | 8%             |

## What Agents Must Know

- **Mock fallback**: `isSupabaseConfigured() === false` → uses deterministic mock data
- **5 role presets**: software-dev, data-analyst, marketing, operations, general
- **Score range**: 28–100 (floor is 28, not 0)
- **Credit system**: 1 credit = 1 paid rewrite, stored in AsyncStorage
- **Platform gates**: Razorpay + PDF export = native Android only
- **No auth layer**: No Supabase Auth, no user_id, no RLS — all data device-local
- **No webhooks**: Payment verification is client-initiated (verify-payment edge function)
- **No server DB for users**: Only migration is `retry_log` (scoring QA)

## Sprint Discipline

Before starting ANY task, read `STATUS.md` to know exactly where we are.
After completing ANY task, update `STATUS.md` with what was done and what's next.
Never assume the current state — always read STATUS.md first.

## Docs (read don't duplicate)

- `docs/START_HERE.md` — getting started
- `docs/SUPABASE_SETUP.md` — env vars + function deployment
- `docs/PAYMENT_SETUP.md` — Razorpay secrets
- `docs/LIVE_AI_SETUP.md` — OpenAI integration
- `docs/RESUME_BENCHMARK_SAMPLES.md` — regression test pack
