# AI Context Explained

This note explains what part of the app is already acting like the real AI system and what part is still mocked.

## What exists right now

The app already has the correct AI product shape:

1. user uploads a resume
2. app sends the file into an analysis service layer
3. service returns structured resume analysis data
4. UI renders:
   - ATS score
   - issues
   - before/after improvement
   - paywall
   - final output screen

That shape is the important part because it is how the production app should behave too.

## What is mocked right now

Right now, the intelligence is not coming from OpenAI yet.

Instead:

- [src/services/resumeApi.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/src/services/resumeApi.ts) decides whether to use mock mode or live backend mode
- [src/services/resumeAnalysis.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/src/services/resumeAnalysis.ts) returns a fake but structured AI response
- [src/data/marketingDemo.ts](C:/Users/prash/OneDrive/Documents/New%20project/apps/resume-fixer-ai/src/data/marketingDemo.ts) provides the sample scores, issues, and upgrade copy

So the app already has the AI contract, but not the real model inference yet.

## What the real AI phase will add

In the next phase, we replace the mocked response with a real backend pipeline:

1. upload resume file
2. extract text from PDF or DOCX
3. normalize resume sections
4. send prompt + resume text to OpenAI
5. get strict JSON response
6. map JSON into the exact same UI contract already used now
7. generate final improved resume sections
8. render PDF export

## Why this is the right build order

This app is an outcome product, so the user experience matters first.

If we had connected OpenAI too early:

- we would spend money before the UX is stable
- prompts would keep changing while the UI is still moving
- debugging would be harder

By doing mock mode first, we are locking:

- the product flow
- the paywall timing
- the output contract
- the trust experience

Then we swap in real AI later.

## The real meat of the app

The real moat is not just "call OpenAI".

It is the combination of:

1. a strong prompt and schema for resume analysis
2. good parsing of resume text
3. honest ATS-style scoring logic
4. strong rewrite quality
5. a clean UX that makes the improvement feel real
6. smart monetization timing

So yes, the full AI intelligence comes in the next phase, but we have already built the structure that the real intelligence will plug into.
