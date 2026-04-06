# Sprint Status — Resume Fixer AI

> Every agent reads this before starting work.
> Every agent updates this after completing work.
> Last updated: 2026-04-06 — P1 DOCX + file upload, P2 loading states, P3 legal docs + footer

## Current readiness: ~82%

## Sprint day: 2

## Next immediate task: Host Privacy Policy + T&C on GitHub Pages, then update LEGAL_URLS in AppShell → Razorpay live mode activation

---

## Done (verified against codebase)

| Feature                                                       | Evidence                                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Project scaffolding (Expo SDK 54 + TypeScript strict)         | `package.json`, `tsconfig.json`                                                         |
| ATS scoring engine (28–100, 5 weighted dimensions)            | `src/services/atsEvaluator.ts` — `clamp(score, 28, 96)`                                 |
| ATS scoring in edge function (server-side)                    | `supabase/functions/_shared/atsEvaluator.ts`                                            |
| Score-conditioned rewrite prompts                             | `supabase/functions/_shared/rewritePrompts.ts` — `buildBulletRewritePrompt(quantScore)` |
| 4 Supabase Edge Functions deployed                            | analyze-resume, generate-resume-fix, create-payment-order, verify-payment               |
| Free preview: 1 bullet rewritten + rest blurred               | `previewWeakestBullet()` + `BlurView` in AppShell.tsx                                   |
| Before/after score display + delta                            | `ScoreCard.tsx` — shows currentScore, improvedScore, "+X point upside"                  |
| Razorpay payment flow (create order → checkout → verify)      | `src/services/payments.ts` — full flow implemented                                      |
| Razorpay HMAC-SHA256 verification (client-initiated)          | `verify-payment/index.ts` — `crypto.subtle` Web Crypto API                              |
| Constant-time HMAC comparison                                 | `verify-payment/index.ts` — `timingSafeEqual()` XOR loop, no `===`                      |
| Input validation in verify-payment                            | `verify-payment/index.ts` — type + non-empty checks on all 3 fields                     |
| Local credit system (1 credit = 1 rewrite)                    | `src/services/entitlement.ts` — AsyncStorage                                            |
| Local history (max 10 items)                                  | `src/services/localHistory.ts` — AsyncStorage                                           |
| PDF export via expo-print                                     | `src/services/pdf.ts`                                                                   |
| WhatsApp share                                                | `src/services/share.ts` — `shareOnWhatsApp()`                                           |
| Before/after card UI                                          | `src/components/BeforeAfterCard.tsx`                                                    |
| Mock fallback for development                                 | `isSupabaseConfigured()` → deterministic mock data                                      |
| Friendly error messages (no stack traces)                     | AppShell.tsx — human-readable error strings                                             |
| Client-side retry (analyze-resume, 2 attempts, 900ms backoff) | `src/services/resumeApi.ts` — `retryAnalyzeResume()`                                    |
| DPDP consent checkbox before upload                           | `src/AppShell.tsx` + `src/services/consent.ts` — stored in AsyncStorage                 |
| Edge function retry/backoff for OpenAI calls (3 attempts)     | `generate-resume-fix/index.ts` — `callJsonOpenAI()` 1s/2s backoff, skips 4xx            |
| Payment failure → explicit error, no credit granted           | `src/AppShell.tsx` `handlePayment()` — two separate try/catch blocks                    |
| DOCX parsing in edge function                                 | `analyze-resume/index.ts` — fflate unzipSync + word/document.xml XML extraction         |
| File upload UI (DOCX + TXT)                                   | `src/AppShell.tsx` — DocumentPicker button, selectedResume state, passed to analyzeResume |
| Loading states: PDF export + WhatsApp share                   | `src/AppShell.tsx` — `isExporting`, `isSharing` states + disabled buttons               |
| Privacy Policy (DPDP Act 2023 compliant)                      | `docs/privacy-policy.md` — OpenAI cross-border transfer disclosed, DPDP rights listed   |
| Terms & Conditions (₹199 pricing + refund policy)             | `docs/terms-and-conditions.md` — refund matrix, disclaimer, liability cap                |
| Legal footer in app                                           | `src/AppShell.tsx` — Privacy Policy + T&C links at bottom of every screen               |

## In Progress

_(none)_

## TODO — P2 Reliability

| Task                                        | Priority | Notes                                 |
| ------------------------------------------- | -------- | ------------------------------------- |
| Expo build succeeds for Android (eas build) | P2       | Not yet tested.                       |

## TODO — P3 Legal (required before live payments)

| Task                                         | Priority | Notes                                                                                                                    |
| -------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Host PP + T&C at public URL                  | P3       | Docs written. Need GitHub Pages (or similar). Update `PRIVACY_POLICY_URL` + `TERMS_URL` constants in `src/AppShell.tsx`. |
| Razorpay dashboard: refund policy added      | P3       | Required to activate live mode. See PAYMENT_SETUP.md.                                                                    |

## TODO — P4 WOW Features (viral + retention)

| Task                                     | Priority | Notes                                                          |
| ---------------------------------------- | -------- | -------------------------------------------------------------- |
| Score counter animation                  | P4       | Requires react-native-reanimated (not installed yet).          |
| Keyword diff view (red/green highlights) | P4       | BeforeAfterCard exists but does plain text, not semantic diff. |
| Shareable score card image               | P4       | react-native-view-shot is installed.                           |

## TODO — P5 Monitoring & Analytics (not installed)

| Task                                 | Priority | Notes                                                                                         |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| PostHog: install + track key events  | P5       | Not in package.json. Track: resume_uploaded, paywall_seen, payment_completed, pdf_downloaded. |
| Sentry: install + DSN + crash alerts | P5       | Not in package.json. Alert on crash-free < 98%.                                               |

## TODO — P6 Testing & Launch

| Task                                             | Priority | Notes                                  |
| ------------------------------------------------ | -------- | -------------------------------------- |
| PDF export tested on real Android (Redmi/Realme) | P6       | Android-first. Budget device, 4G.      |
| k6 load test: 150 VUs, p95 < 12s                 | P6       | See qa-runner.md for corrected script. |
| E2E: upload → pay → download (5/5 runs)          | P6       |                                        |
| E2E: OpenAI timeout → retry → success            | P6       |                                        |
| E2E: payment fail → no access granted            | P6       |                                        |
| Google Play data safety form                     | P6       |                                        |
| Play Store listing copy + screenshots            | P6       |                                        |
| Signed AAB (eas build)                           | P6       |                                        |
| Razorpay live mode + ₹1 real test                | P6       |                                        |

## Backlog (post-launch)

- [ ] Onboarding screen
- [ ] Settings / profile screen
- [ ] Server-side history sync (requires auth)
- [ ] Multiple payment tiers
- [ ] Resume template gallery
- [ ] Hindi language support
- [ ] iOS support

## Known Issues

- Razorpay + PDF export only work on native Android (web throws)
- Score floor is 28 (never 0) — UX should explain this
- History capped at 10 items — no pagination yet
- No auth layer — all data is device-local
- AsyncStorage credits are tamper-able (acceptable for ₹199 MVP)
- `PRIVACY_POLICY_URL` and `TERMS_URL` in AppShell.tsx use placeholder URLs — must be updated before store submission

---

## Session Log

- [2026-04-05] orchestrator — Aligned CLAUDE.md, DECISIONS.md, STATUS.md, and all 6 agent MDs against actual codebase. Readiness upgraded to ~55%. Next: DPDP consent flow + edge function retry logic.
- [2026-04-05] orchestrator/builder/edge-function-dev/security-reviewer — DPDP consent checkbox, edge function 3-attempt retry (1s/2s backoff), two-stage payment error handling, constant-time HMAC, verify-payment input validation. Readiness ~68%. Next: DOCX parsing + Privacy Policy.
- [2026-04-06] orchestrator/builder/edge-function-dev/legal-writer — DOCX parsing (fflate ZIP + XML extraction in analyze-resume), DOCX/TXT file upload UI in AppShell (DocumentPicker, selectedResume state), loading states for PDF export + WhatsApp share (isExporting/isSharing), Privacy Policy (DPDP Act 2023 + OpenAI cross-border disclosure), Terms & Conditions (refund matrix + liability cap), legal footer with links in every screen. Readiness ~82%. Next: Host legal docs at public URL, update URL constants, Razorpay live mode activation.


## Sprint day: 1

## Next immediate task: DOCX parsing in edge function (P1) + Privacy Policy (P3)

---

## Done (verified against codebase)

| Feature                                                       | Evidence                                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Project scaffolding (Expo SDK 54 + TypeScript strict)         | `package.json`, `tsconfig.json`                                                         |
| ATS scoring engine (28–100, 5 weighted dimensions)            | `src/services/atsEvaluator.ts` — `clamp(score, 28, 96)`                                 |
| ATS scoring in edge function (server-side)                    | `supabase/functions/_shared/atsEvaluator.ts`                                            |
| Score-conditioned rewrite prompts                             | `supabase/functions/_shared/rewritePrompts.ts` — `buildBulletRewritePrompt(quantScore)` |
| 4 Supabase Edge Functions deployed                            | analyze-resume, generate-resume-fix, create-payment-order, verify-payment               |
| Free preview: 1 bullet rewritten + rest blurred               | `previewWeakestBullet()` + `BlurView` in AppShell.tsx                                   |
| Before/after score display + delta                            | `ScoreCard.tsx` — shows currentScore, improvedScore, "+X point upside"                  |
| Razorpay payment flow (create order → checkout → verify)      | `src/services/payments.ts` — full flow implemented                                      |
| Razorpay HMAC-SHA256 verification (client-initiated)          | `verify-payment/index.ts` — `crypto.subtle` Web Crypto API                              |
| Constant-time HMAC comparison                                 | `verify-payment/index.ts` — `timingSafeEqual()` XOR loop, no `===`                      |
| Input validation in verify-payment                            | `verify-payment/index.ts` — type + non-empty checks on all 3 fields                     |
| Local credit system (1 credit = 1 rewrite)                    | `src/services/entitlement.ts` — AsyncStorage                                            |
| Local history (max 10 items)                                  | `src/services/localHistory.ts` — AsyncStorage                                           |
| PDF export via expo-print                                     | `src/services/pdf.ts`                                                                   |
| WhatsApp share                                                | `src/services/share.ts` — `shareOnWhatsApp()`                                           |
| Before/after card UI                                          | `src/components/BeforeAfterCard.tsx`                                                    |
| Mock fallback for development                                 | `isSupabaseConfigured()` → deterministic mock data                                      |
| Friendly error messages (no stack traces)                     | AppShell.tsx — human-readable error strings                                             |
| Client-side retry (analyze-resume, 2 attempts, 900ms backoff) | `src/services/resumeApi.ts` — `retryAnalyzeResume()`                                    |
| DPDP consent checkbox before upload                           | `src/AppShell.tsx` + `src/services/consent.ts` — stored in AsyncStorage                 |
| Edge function retry/backoff for OpenAI calls (3 attempts)     | `generate-resume-fix/index.ts` — `callJsonOpenAI()` 1s/2s backoff, skips 4xx            |
| Payment failure → explicit error, no credit granted           | `src/AppShell.tsx` `handlePayment()` — two separate try/catch blocks                    |

## In Progress

_(none)_

## TODO — P1 Core (app has no value without these)

| Task                          | Priority | Notes                                                                                   |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------- |
| DOCX parsing in edge function | P1       | MIME type accepted by picker but analyze-resume returns "not enabled yet". Need parser. |

## TODO — P2 Reliability

| Task                                        | Priority | Notes                                 |
| ------------------------------------------- | -------- | ------------------------------------- |
| Expo build succeeds for Android (eas build) | P2       | Not yet tested.                       |
| Loading states audit                        | P2       | Verify all async paths show spinners. |

## TODO — P3 Legal (required before live payments)

| Task                                         | Priority | Notes                                                    |
| -------------------------------------------- | -------- | -------------------------------------------------------- |
| Privacy Policy (DPDP Act 2023 compliant)     | P3       | See legal-writer.md. Must disclose OpenAI data transfer. |
| Terms & Conditions (₹199 pricing, no-refund) | P3       | See legal-writer.md.                                     |
| Both hosted at public URL                    | P3       | GitHub Pages or similar.                                 |
| Links in app footer + checkout               | P3       |                                                          |
| Razorpay dashboard: refund policy added      | P3       | Required to activate live mode. See PAYMENT_SETUP.md.    |

## TODO — P4 WOW Features (viral + retention)

| Task                                     | Priority | Notes                                                          |
| ---------------------------------------- | -------- | -------------------------------------------------------------- |
| Score counter animation                  | P4       | Requires react-native-reanimated (not installed yet).          |
| Keyword diff view (red/green highlights) | P4       | BeforeAfterCard exists but does plain text, not semantic diff. |
| Shareable score card image               | P4       | react-native-view-shot is installed.                           |

## TODO — P5 Monitoring & Analytics (not installed)

| Task                                 | Priority | Notes                                                                                         |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| PostHog: install + track key events  | P5       | Not in package.json. Track: resume_uploaded, paywall_seen, payment_completed, pdf_downloaded. |
| Sentry: install + DSN + crash alerts | P5       | Not in package.json. Alert on crash-free < 98%.                                               |

## TODO — P6 Testing & Launch

| Task                                             | Priority | Notes                                  |
| ------------------------------------------------ | -------- | -------------------------------------- |
| PDF export tested on real Android (Redmi/Realme) | P6       | Android-first. Budget device, 4G.      |
| k6 load test: 150 VUs, p95 < 12s                 | P6       | See qa-runner.md for corrected script. |
| E2E: upload → pay → download (5/5 runs)          | P6       |                                        |
| E2E: OpenAI timeout → retry → success            | P6       |                                        |
| E2E: payment fail → no access granted            | P6       |                                        |
| Google Play data safety form                     | P6       |                                        |
| Play Store listing copy + screenshots            | P6       |                                        |
| Signed AAB (eas build)                           | P6       |                                        |
| Razorpay live mode + ₹1 real test                | P6       |                                        |

## Backlog (post-launch)

- [ ] Onboarding screen
- [ ] Settings / profile screen
- [ ] Server-side history sync (requires auth)
- [ ] Multiple payment tiers
- [ ] Resume template gallery
- [ ] Hindi language support
- [ ] iOS support

## Known Issues

- Razorpay + PDF export only work on native Android (web throws)
- Score floor is 28 (never 0) — UX should explain this
- History capped at 10 items — no pagination yet
- No auth layer — all data is device-local
- AsyncStorage credits are tamper-able (acceptable for ₹199 MVP)

---

## Session Log

> Append a line after every coding session:
> `[Date] [Agent] — What was completed, what failed, what's next`

- [2026-04-05] orchestrator — Aligned CLAUDE.md, DECISIONS.md, STATUS.md, and all 6 agent MDs against actual codebase. Readiness upgraded to ~55% (many features were already built but untracked). Next: DPDP consent flow + edge function retry logic.
- [2026-04-05] orchestrator/builder/edge-function-dev/security-reviewer — Completed all 3 P1 items + P2 HMAC fix. Created src/services/consent.ts (DPDP), added consent checkbox to home screen (disabled until ticked), restructured handlePayment() into two try/catch blocks (payment cancel ≠ generation fail), added 3-attempt exponential backoff (1s/2s) to callJsonOpenAI in generate-resume-fix, replaced === with timingSafeEqual() in verify-payment + added input validation. Readiness ~68%. Next: DOCX parsing (P1) + Privacy Policy (P3).

| Feature                                                       | Evidence                                                                                |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Project scaffolding (Expo SDK 54 + TypeScript strict)         | `package.json`, `tsconfig.json`                                                         |
| ATS scoring engine (28–100, 5 weighted dimensions)            | `src/services/atsEvaluator.ts` — `clamp(score, 28, 96)`                                 |
| ATS scoring in edge function (server-side)                    | `supabase/functions/_shared/atsEvaluator.ts`                                            |
| Score-conditioned rewrite prompts                             | `supabase/functions/_shared/rewritePrompts.ts` — `buildBulletRewritePrompt(quantScore)` |
| 4 Supabase Edge Functions deployed                            | analyze-resume, generate-resume-fix, create-payment-order, verify-payment               |
| Free preview: 1 bullet rewritten + rest blurred               | `previewWeakestBullet()` + `BlurView` in AppShell.tsx                                   |
| Before/after score display + delta                            | `ScoreCard.tsx` — shows currentScore, improvedScore, "+X point upside"                  |
| Razorpay payment flow (create order → checkout → verify)      | `src/services/payments.ts` — full flow implemented                                      |
| Razorpay HMAC-SHA256 verification (client-initiated)          | `verify-payment/index.ts` — `crypto.subtle` Web Crypto API                              |
| Local credit system (1 credit = 1 rewrite)                    | `src/services/entitlement.ts` — AsyncStorage                                            |
| Local history (max 10 items)                                  | `src/services/localHistory.ts` — AsyncStorage                                           |
| PDF export via expo-print                                     | `src/services/pdf.ts`                                                                   |
| WhatsApp share                                                | `src/services/share.ts` — `shareOnWhatsApp()`                                           |
| Before/after card UI                                          | `src/components/BeforeAfterCard.tsx`                                                    |
| Mock fallback for development                                 | `isSupabaseConfigured()` → deterministic mock data                                      |
| Friendly error messages (no stack traces)                     | AppShell.tsx — human-readable error strings                                             |
| Client-side retry (analyze-resume, 2 attempts, 900ms backoff) | `src/services/resumeApi.ts` — `retryAnalyzeResume()`                                    |

## In Progress

- [ ] `.claude/` agent definitions alignment (this session)

## TODO — P1 Core (app has no value without these)

| Task                                         | Priority | Notes                                                                                                                      |
| -------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| DPDP consent checkbox before upload          | P1       | Legal requirement. Store consent in AsyncStorage (no auth = no server logging). Upload button disabled until consented.    |
| Edge function retry/backoff for OpenAI calls | P1       | Client retry exists but edge functions have no retry. Add 3-attempt exponential backoff (1s/2s/4s) in generate-resume-fix. |
| Payment failure → block access gracefully    | P1       | Verify: if Razorpay checkout fails, no credit is granted. Add explicit error state.                                        |
| DOCX parsing in edge function                | P1       | MIME type accepted by picker but analyze-resume returns "not enabled yet". Need parser.                                    |

## TODO — P2 Reliability

| Task                                        | Priority | Notes                                                                                          |
| ------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Constant-time HMAC comparison               | P2       | `verify-payment/index.ts` uses `===` — vulnerable to timing attacks. See security-reviewer.md. |
| Expo build succeeds for Android (eas build) | P2       | Not yet tested.                                                                                |
| Loading states audit                        | P2       | Verify all async paths show spinners.                                                          |

## TODO — P3 Legal (required before live payments)

| Task                                         | Priority | Notes                                                    |
| -------------------------------------------- | -------- | -------------------------------------------------------- |
| Privacy Policy (DPDP Act 2023 compliant)     | P3       | See legal-writer.md. Must disclose OpenAI data transfer. |
| Terms & Conditions (₹199 pricing, no-refund) | P3       | See legal-writer.md.                                     |
| Both hosted at public URL                    | P3       | GitHub Pages or similar.                                 |
| Links in app footer + checkout               | P3       |                                                          |
| Razorpay dashboard: refund policy added      | P3       | Required to activate live mode. See PAYMENT_SETUP.md.    |

## TODO — P4 WOW Features (viral + retention)

| Task                                     | Priority | Notes                                                          |
| ---------------------------------------- | -------- | -------------------------------------------------------------- |
| Score counter animation                  | P4       | Requires react-native-reanimated (not installed yet).          |
| Keyword diff view (red/green highlights) | P4       | BeforeAfterCard exists but does plain text, not semantic diff. |
| Shareable score card image               | P4       | react-native-view-shot is installed.                           |

## TODO — P5 Monitoring & Analytics (not installed)

| Task                                 | Priority | Notes                                                                                         |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------------------- |
| PostHog: install + track key events  | P5       | Not in package.json. Track: resume_uploaded, paywall_seen, payment_completed, pdf_downloaded. |
| Sentry: install + DSN + crash alerts | P5       | Not in package.json. Alert on crash-free < 98%.                                               |

## TODO — P6 Testing & Launch

| Task                                             | Priority | Notes                                  |
| ------------------------------------------------ | -------- | -------------------------------------- |
| PDF export tested on real Android (Redmi/Realme) | P6       | Android-first. Budget device, 4G.      |
| k6 load test: 150 VUs, p95 < 12s                 | P6       | See qa-runner.md for corrected script. |
| E2E: upload → pay → download (5/5 runs)          | P6       |                                        |
| E2E: OpenAI timeout → retry → success            | P6       |                                        |
| E2E: payment fail → no access granted            | P6       |                                        |
| Google Play data safety form                     | P6       |                                        |
| Play Store listing copy + screenshots            | P6       |                                        |
| Signed AAB (eas build)                           | P6       |                                        |
| Razorpay live mode + ₹1 real test                | P6       |                                        |

## Backlog (post-launch)

- [ ] Onboarding screen
- [ ] Settings / profile screen
- [ ] Server-side history sync (requires auth)
- [ ] Multiple payment tiers
- [ ] Resume template gallery
- [ ] Hindi language support
- [ ] iOS support

## Known Issues

- Razorpay + PDF export only work on native Android (web throws)
- Score floor is 28 (never 0) — UX should explain this
- History capped at 10 items — no pagination yet
- No auth layer — all data is device-local
- HMAC signature comparison is not constant-time (`===`)
- AsyncStorage credits are tamper-able (acceptable for ₹199 MVP)

---

## Session Log

> Append a line after every coding session:
> `[Date] [Agent] — What was completed, what failed, what's next`

- [2026-04-05] orchestrator — Aligned CLAUDE.md, DECISIONS.md, STATUS.md, and all 6 agent MDs against actual codebase. Readiness upgraded to ~55% (many features were already built but untracked). Next: DPDP consent flow + edge function retry logic.
