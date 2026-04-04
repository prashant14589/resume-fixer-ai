# Resume Fixer AI

AI-powered resume analysis and rewrite system built with Expo (React Native) + Supabase Edge Functions.

This project is designed to help candidates improve ATS readiness while preserving trust:

- deterministic scoring for consistency,
- constrained AI rewrites for quality,
- strict anti-hallucination guardrails,
- benchmark-based regression validation.

---

## 1) Product Purpose

Resume Fixer AI has two core outcomes:

1. **Evaluate**: score a resume against ATS-style dimensions (bullet quality, quantification, keywords, structure, formatting).
2. **Improve**: generate safer rewrites that are role-aware, non-fabricated, and aligned to evidence in the original resume.

The system is intentionally conservative. It avoids “impressive but fake” output and prioritizes integrity over inflated ATS gains.

---

## 2) Guiding Design Principles

### A. Trust before polish

Rewrites should never invent metrics, achievements, employers, tenure, or technologies not grounded in source text (and optionally JD).

### B. Determinism where possible

Scoring and baseline diagnostics should be deterministic and reproducible, independent of LLM behavior.

### C. Targeted AI usage

LLM rewriting is used only for narrow transformations (summary, weak bullets, skills optimization) with strict sanitization and post-checking.

### D. Graceful parsing fallback

Real-world resumes are noisy and inconsistently formatted. Parser logic includes robust fallback extraction paths.

### E. Regression-first development

A benchmark sample suite validates score ranges and parser behavior after each major change.

---

## 3) High-Level Architecture

## Frontend (Expo / React Native)

- Input resume text / upload workflow
- Calls edge functions for analysis and rewrite
- Displays ATS score, breakdown, issues, preview, and improved resume sections

Key frontend areas:

- `src/services/resumeApi.ts` (analysis endpoint integration)
- `src/services/resumeFixApi.ts` (rewrite endpoint integration)
- `src/services/supabase.ts` (Supabase client wiring)
- UI in `src/components/*` and `src/AppShell.tsx`

## Backend (Supabase Edge Functions)

- `analyze-resume`: deterministic scoring + parser output + preview rewrite
- `generate-resume-fix`: full rewrite pipeline with safety constraints
- Shared modules in `supabase/functions/_shared/*`

## Shared Engine

- `atsEvaluator.ts`: deterministic ATS scoring + issue signals
- `resumeParser.ts`: resilient extraction of summary / skills / experience
- `rewritePrompts.ts`: structured prompts with anti-fabrication rules

---

## 4) Request/Response Flow

### Analyze flow (`analyze-resume`)

1. Extract resume text
2. Parse sections (summary, skills, experience)
3. Score using deterministic evaluator
4. Generate preview rewrite for weakest bullet (AI if key available, fallback if not)
5. Return score, breakdown, parsed sections, issues, weak bullets

### Rewrite flow (`generate-resume-fix`)

1. Extract and parse resume
2. Baseline deterministic scoring
3. Select weak bullets (capped and quant-aware)
4. Call AI for:
   - summary rewrite
   - targeted bullet rewrites
   - skills optimization
5. Run sanitizers:
   - remove invented/fabricated metric phrases
   - limit skills to allowed grounded set
   - enforce summary quality and non-empty fallback
6. Re-score improved resume
7. Return improved resume + score delta + diagnostics

---

## 5) ATS Scoring Model

Scoring dimensions (0–100 each):

- **bullet**: achievement quality of bullets
- **quant**: measurable impact signals
- **keyword**: role/JD keyword alignment
- **structure**: section and layout completeness
- **formatting**: readability and ATS parse-friendliness

Weighted total is returned as `atsScore`.

### Bullet scoring intent

A bullet should ideally show:

- action,
- specific task/context,
- outcome/impact.

Vague/responsibility-only bullets are penalized.

### Quantification intent

Quant score rewards explicit numbers and impact units while allowing limited proxy credit for outcome-bearing language when hard numbers are absent.

---

## 6) Trust & Safety Guardrails

These controls are central to this codebase.

### 6.1 No fabricated metrics

- Removed forced metric injection behavior.
- Added sanitization to strip AI-generated metric-like constructions when absent in source.
- “Improve wording” is allowed; “invent impact” is not.

### 6.2 Targeted rewrites only

- Rewrite only weakest bullets (bounded count).
- Keep strong bullets untouched.
- Avoid over-editing that changes candidate truth.

### 6.3 Skills anti-hallucination

- Skills rewriting is constrained to allowed sets.
- Missing JD keywords are only considered when JD is actually provided.
- No JD => no role-preset keyword inflation in output skills list.

### 6.4 Parser hardening

- Handles unnumbered projects and malformed layouts.
- Filters personal-info lines from role/company inference.
- Fallback extraction prevents empty results.

### 6.5 Summary guarantees

- Empty/generic summary outputs are prevented via fallback generator.
- Summary is grounded in parsed skills and role context.

---

## 7) Why Certain Trade-offs Were Chosen

### Deterministic evaluator + constrained AI

Pure LLM scoring is flexible but inconsistent. Pure rules-based rewrite is rigid. This project blends both:

- rules for scoring and enforcement,
- AI for language quality and synthesis,
- sanitization to keep outputs trustworthy.

### Conservative optimization over aggressive optimization

An inflated score with fabricated claims may look good short-term but breaks user trust and can harm candidates in interviews. The system intentionally chooses conservative, defensible improvements.

### Fallback-heavy parsing

Recruiter and student resumes are often messy. Parser fallback logic improves robustness and keeps UX stable even with poor formatting.

---

## 8) Repository Structure

- `src/` — app UI + client services
- `supabase/functions/analyze-resume/` — analysis edge function
- `supabase/functions/generate-resume-fix/` — rewrite edge function
- `supabase/functions/_shared/` — shared parser/scorer/prompts
- `supabase/functions/_tests/` — benchmark sample validator
- `supabase/migrations/` — DB migrations
- `docs/` — setup and operational notes

---

## 9) Environment & Configuration

Create `.env` from `.env.example` and set relevant values.

Typical variables include:

- Supabase URL and anon key (frontend)
- Edge function service context (Supabase)
- `OPENAI_API_KEY` (for live rewrite/preview paths)

If `OPENAI_API_KEY` is absent, certain flows gracefully fallback to deterministic/mock behavior.

---

## 10) Local Development

### App

1. Install dependencies
2. Start Expo web
3. Open local URL shown by Expo

### Type-check

Run TypeScript checks before commits.

### Edge functions

Test functions locally via Supabase workflow or deploy to your project and call function URLs.

---

## 11) Benchmarking & Validation Strategy

The project includes benchmark samples to prevent regressions.

Validation goals:

- score ranges remain stable for representative resumes,
- parser extracts expected core sections,
- weak/fresh resumes are not over-scored,
- strong resumes remain strong,
- safety guardrails stay intact.

Recommended validation moments:

- after parser rule changes,
- after scoring rubric changes,
- after prompt/sanitizer updates,
- before production deployment.

---

## 12) API Contract (Conceptual)

### Analyze response includes

- `atsScore`
- `breakdown`
- `issues`
- `missingKeywords` (JD-aware)
- `weakBullets`
- `preview`
- parsed `improvedResume` (baseline parsed form)

### Generate response includes

- baseline + improved score context
- rewritten summary/skills/bullets with safety-enforced output
- issue summaries and actionable rewrite impact

---

## 13) Operational Considerations

### Observability

- Log parse failures and AI response anomalies.
- Record retries / error classes for external API calls.

### Reliability

- Keep deterministic fallback output even if AI call fails.
- Enforce timeout handling and retry strategy where needed.

### Security

- Keep API keys server-side only.
- Avoid exposing privileged keys in client bundles.

---

## 14) Deployment Notes

### Supabase

- Deploy/update both edge functions and shared modules.
- Ensure environment variables are configured in project settings.
- Re-test live endpoints with benchmark samples after each deploy.

### Frontend

- Validate API base URLs and function routing.
- Verify web/native behavior for resume input and output rendering.

---

## 15) Play Store Path (Next Phase)

Planned checklist for Android release:

1. Finalize app metadata (name, icon, splash, privacy details)
2. Confirm production env wiring
3. Build signed Android AAB
4. Internal testing track upload
5. QA passes (runtime, network failures, edge cases)
6. Store listing + screenshots + policy forms
7. Rollout strategy (internal → closed → production)

This project is now structured to support that release path once final QA and production deployment checks are complete.

---

## 16) Future Improvements

- Optional PDF/DOCX parser integration in edge layer
- Richer JD matching model with explainable keyword groups
- User feedback loop for accepted/rejected rewrites
- Personalization by seniority/domain
- Export templates tailored by region/industry

---

## 17) Contribution Guidelines (Suggested)

When changing scoring/parser/sanitizers:

1. Keep changes minimal and scoped.
2. Preserve trust guardrails.
3. Re-run benchmark validation.
4. Type-check before merge.
5. Document behavior changes in PR description.

---

## 18) Project Status

Current state:

- deterministic ATS scoring implemented,
- rewrite safety controls implemented,
- parser robustness significantly improved,
- benchmark suite available and used for regression checks,
- ready for GitHub publication and Play Store preparation workflow.

If you are onboarding to this repository, start with:

1. `docs/START_HERE.md`
2. `supabase/functions/_shared/atsEvaluator.ts`
3. `supabase/functions/generate-resume-fix/index.ts`
4. benchmark files in `supabase/functions/_tests/`

---

Built for practical ATS improvement with explicit trust boundaries.
