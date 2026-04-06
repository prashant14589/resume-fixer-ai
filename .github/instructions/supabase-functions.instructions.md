---
description: "Use when writing or editing Supabase Edge Functions. Covers Deno runtime conventions, shared utilities, and deployment patterns."
applyTo: "supabase/functions/**"
---

# Supabase Edge Functions

- Use Deno-style imports (URL imports or import maps), not Node.js `require`
- Shared code goes in `supabase/functions/_shared/`
- Each function has its own folder with an `index.ts` entry point
- Use `Deno.serve()` for the request handler
- Return proper CORS headers for cross-origin requests
- Validate request bodies at the boundary
