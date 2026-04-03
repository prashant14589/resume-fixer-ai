# Supabase Setup

## 1. Create project

Create a new Supabase project for `resume-fixer-ai`.

## 2. Add env values

Copy [`.env.example`](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/.env.example) to `.env` and fill:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. First backend target

Wire these in order:

1. Storage bucket: `raw-resumes`
2. Edge function: `analyze-resume`
3. App upload flow -> storage upload
4. App analysis call -> edge function

## 4. Local edge function shape

The scaffolded function lives at:

- [supabase/functions/analyze-resume/index.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/supabase/functions/analyze-resume/index.ts)

It currently returns mock JSON so the contract is stable before OpenAI is added.

## 5. Next implementation after env setup

Replace the placeholder in:

- [src/services/resumeApi.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/src/services/resumeApi.ts)

with:

1. upload selected file to Supabase Storage
2. extract or pass resume text to `analyze-resume`
3. map the response to `ResumeAnalysis`
