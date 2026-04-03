# Live AI Setup

This is the first true AI integration slice.

## What works now

The app can already call a real backend analysis function when Supabase is configured.

The fastest way to test it is:

1. open the upload screen
2. paste resume text
3. run analysis

This avoids PDF and DOCX parsing for now.

## What you need later

### App env

Fill [`.env.example`](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/.env.example) into `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
EXPO_PUBLIC_ANALYZE_ROLE=Software Engineer
```

### Supabase function secret

In the Supabase project, add:

```env
OPENAI_API_KEY=your-openai-key
```

## What the live path does

Client:

- [src/services/resumeApi.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/src/services/resumeApi.ts)

Backend:

- [supabase/functions/analyze-resume/index.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/supabase/functions/analyze-resume/index.ts)

Prompt/schema:

- [src/services/resumePrompt.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/src/services/resumePrompt.ts)

## Current limitation

Live AI works best with pasted resume text right now.

PDF and DOCX parsing is still the next backend step.

## Next technical slice after this

1. upload PDF or DOCX to storage
2. extract resume text on backend
3. call the same `analyze-resume` function with parsed text
4. generate final improved resume sections
5. export PDF
