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

## Production User Journey (Locked)

- No dummy/demo mode for production flows.
- Signup flow is: `Sign up -> username captured -> profile scaffold auto-created -> app access`.
- Creator profile basics must be saved once and auto-loaded from Supabase on next login.
- Primary identity mapping:
  - `auth.users.id` -> `creator_profiles.auth_user_id`
  - `auth.users.id` -> `org_users.user_id` (auto-link by matching email if missing)
- On successful auth, app ensures:
  - `creator_profiles` row exists
  - `creator_dashboard_modules` row exists
  - `org_users.user_id` is linked when matching email exists

## Admin Policy

- `fgdhanush@gmail.com` is super admin and must always access `/admin-dashboard`.
- Admin dashboard must show data from Supabase tables (not local-only fallback when remote is available).
- Support workflow:
  - User raises ticket -> stored in `support_tickets`
  - Admin replies -> stored in `ticket_messages`
  - Admin can view and respond from the Chats section.
