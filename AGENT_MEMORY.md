# Creator Hub Agent Memory

## Edge Function Deployment

- Edge function path: `supabase/functions/create-creator-profile/index.ts`
- Use Deno-compatible package imports in Supabase Edge Functions.
- Correct import for Supabase JS in Deno runtime:
  - `import { createClient } from 'jsr:@supabase/supabase-js';`

## Required Secrets for Edge Function

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Signup flow fix

- Signup now creates the auth user with `supabase.auth.signUp(...)`.
- Then it calls the edge function to insert a row into `creator_profiles`.
- The edge function runs with the service role key and avoids direct browser DB writes.

## Notes

- If deployment fails, check the import path first.
- If runtime insert still fails, verify that the function secret is set and that `creator_profiles` exists.
- Use `https://<project>.supabase.co/functions/v1/create-creator-profile` as the function endpoint.
