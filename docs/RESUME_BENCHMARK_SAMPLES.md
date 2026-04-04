# Resume Benchmark Samples (Regression Pack)

This pack stores 5 fixed resumes used to validate ATS scoring/parser behavior after each backend change.

## Files

- [supabase/functions/\_tests/resumeSamples.ts](../supabase/functions/_tests/resumeSamples.ts)
- [supabase/functions/\_tests/validateResumeSamples.ts](../supabase/functions/_tests/validateResumeSamples.ts)

## What this validates

1. Score-band stability for weak/average/good fresher profiles.
2. Fairness behavior for non-tech resume.
3. Parser resilience for poor formatting.
4. Quantification and weak-bullet pressure signals.

## Run locally

From repository root:

```bash
deno run --allow-read supabase/functions/_tests/validateResumeSamples.ts
```

## Expected score bands

- Resume 1 (Weak fresher): 30–50
- Resume 2 (Average fresher): 50–70
- Resume 3 (Good fresher): 70–85
- Resume 4 (Non-tech fairness): 35–75
- Resume 5 (Bad formatting edge case): 20–60

## Iterative workflow

1. Apply parser/scoring/rewrite changes.
2. Run the validator script.
3. If any sample fails its band, tune logic and rerun.
4. After passing, deploy and verify API behavior (`analyze-resume`, `generate-resume-fix`) on these same samples.
