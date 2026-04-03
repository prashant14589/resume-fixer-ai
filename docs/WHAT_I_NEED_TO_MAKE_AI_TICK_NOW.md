# What I Need To Make AI Tick Now

If you want real AI analysis to start working now, I only need a few things.

## Minimum required

1. A Supabase project
2. The Supabase project URL
3. The Supabase publishable key
4. An OpenAI API key

That is enough to make pasted resume text go through real AI analysis.

## What will work immediately after that

- paste resume text in the app
- click analyze
- app sends text to backend
- backend calls OpenAI
- app shows live ATS analysis output

## What will still come after

These are not required for the first live AI test:

1. PDF parsing
2. DOCX parsing
3. final PDF export
4. payment integration

## Simplest founder path

If you want the fastest first success, do this order:

1. create Supabase project
2. add app env values
3. add `OPENAI_API_KEY` to Supabase function secrets
4. test pasted resume text
5. then add PDF and DOCX parsing

## What you can send me when ready

You do not need to understand the backend deeply.

Just send:

1. `EXPO_PUBLIC_SUPABASE_URL`
2. `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

You should never paste your OpenAI secret into the app code. That one belongs in the backend function secrets.
