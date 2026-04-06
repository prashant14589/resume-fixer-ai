---
name: resume-testing
description: "Test resume parsing and ATS scoring logic. Use when validating resume analysis, benchmark samples, or scoring accuracy."
---

# Resume Testing

## When to Use

- Validating resume parser changes
- Testing ATS scoring accuracy
- Running benchmark samples

## Procedure

1. Check existing test samples in `supabase/functions/_tests/resumeSamples.ts`
2. Run validation via `supabase/functions/_tests/validateResumeSamples.ts`
3. Compare scores against benchmarks in `docs/RESUME_BENCHMARK_SAMPLES.md`
4. Verify parser output matches expected structure in `src/types/resume.ts`
