# Builder: supabase-auth-pages

Adds Supabase authentication UI (magic link + OAuth), protected routes, server-side auth helper, and middleware for Next.js App Router.

**Variables**
- `LOGIN_PATH` (optional) — defaults to `login`
- `DASHBOARD_PATH` (optional) — defaults to `dashboard`
- `OAUTH_PROVIDERS` (optional) — comma-separated list, e.g., `google,github`

**Requires**
- Env: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Package: `@supabase/supabase-js` and `@supabase/ssr`
  ```bash
  npm i -w web-app @supabase/supabase-js @supabase/ssr
  ```

**Generated Files**
- `app/<LOGIN_PATH>/page.tsx` — Login page with email magic link and OAuth buttons
- `app/account/page.tsx` — Account page with user email and sign-out action
- `app/<DASHBOARD_PATH>/page.tsx` — Protected dashboard page
- `lib/supabaseServer.ts` — Server-side Supabase client helper
- `middleware.ts` — Route protection redirecting unauthenticated users to login

**Setup**
1. Create Supabase project at supabase.com
2. Enable email auth in Authentication > Providers
3. Enable OAuth providers (Google, GitHub, etc.) if needed
4. Set environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
5. Install packages and apply builder
6. Configure OAuth redirect URLs in Supabase dashboard

**Local Testing**
- Start dev server: `npm run dev -w web-app`
- Visit `/login` to test magic link
- Check email for sign-in link
- After login, visit `/dashboard` to verify route protection
