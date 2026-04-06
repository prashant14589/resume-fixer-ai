# Resume Fixer AI — Project Guidelines

## Stack

- **Frontend**: React Native (Expo SDK 54), TypeScript (strict)
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Payments**: Razorpay
- **AI**: OpenAI / resume analysis pipeline

## Code Style

- TypeScript strict mode — no `any` unless truly unavoidable
- Functional components with hooks, no class components
- Use `expo` modules for native features (file system, sharing, printing)
- Keep services in `src/services/`, components in `src/components/`, types in `src/types/`

## Supabase Edge Functions

- Located in `supabase/functions/`
- Shared utilities go in `supabase/functions/_shared/`
- Tests go in `supabase/functions/_tests/`
- Use Deno APIs and imports (not Node.js) inside edge functions

## Conventions

- Prefer named exports over default exports
- Keep components focused — one concern per file
- Use the existing theme palette from `src/theme/palette.ts`
