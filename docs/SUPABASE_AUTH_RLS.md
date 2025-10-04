# Supabase Auth + RLS Blueprint

This blueprint applies two builders to create a complete authentication system with user profiles:
1. **supabase-auth-pages** → Login/logout UI, protected routes, middleware
2. **supabase-profiles-rls** → User profiles table with Row Level Security

## Prerequisites

### Supabase Project Setup
1. Create project at [supabase.com](https://supabase.com)
2. Navigate to Authentication > Providers
3. Enable Email authentication
4. (Optional) Enable OAuth providers (Google, GitHub, etc.)
5. Configure OAuth redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

### Environment Variables
Set the following in `.env.local` (web-app directory):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Find these values in Supabase Dashboard > Settings > API

### Package Installation
```bash
npm i -w web-app @supabase/supabase-js @supabase/ssr
```

## Apply the Blueprint

### Via API (Blueprints UI)
1. Navigate to `/projects/blueprints`
2. Select "Supabase Auth + Profiles with RLS"
3. Review variable overrides (or use defaults)
4. Click "Preview Blueprint" to see file changes
5. Click "Apply Blueprint" to generate all files

### Via MCP Server (CLI)
```bash
# Assuming geo-builders-mcp server is running
call_mcp apply_blueprint --id supabase-accounts-rls
```

## Generated Files

### Authentication Pages & Middleware
- `web-app/app/login/page.tsx` — Login page with magic link and OAuth
- `web-app/app/account/page.tsx` — Account page with sign-out
- `web-app/app/dashboard/page.tsx` — Protected dashboard
- `web-app/lib/supabaseServer.ts` — Server-side Supabase helper
- `web-app/middleware.ts` — Route protection

### Database Migration
- `web-app/supabase/migrations/<timestamp>_profiles_rls.sql` — Profiles table with RLS

## Setup Steps

### 1. Apply the Blueprint
Use the Blueprints UI or MCP server to generate all files.

### 2. Run Database Migration
Copy the SQL from the migration file and run it in Supabase SQL Editor:
1. Open Supabase Dashboard > SQL Editor
2. Paste the generated SQL
3. Click "Run"
4. Verify the `profiles` table was created with RLS enabled

Alternatively, use Supabase CLI:
```bash
cd web-app
supabase db push
```

### 3. Create Supabase Client
Create `web-app/lib/supabase.ts` (client-side):
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 4. Start Development Server
```bash
npm run dev -w web-app
```

## Testing

### Test Magic Link Authentication
1. Navigate to `http://localhost:3000/login`
2. Enter your email address
3. Click "Send magic link"
4. Check your email for the sign-in link
5. Click the link to authenticate
6. You should be redirected to `/dashboard`

### Test OAuth Authentication
1. Navigate to `http://localhost:3000/login`
2. Click "Sign in with Google" (or other provider)
3. Complete OAuth flow
4. You should be redirected to `/dashboard`

### Test Route Protection
1. Sign out from `/account` page
2. Try to access `/dashboard` directly
3. You should be redirected to `/login`

### Test RLS Policies
1. Sign up a new user
2. Open Supabase Dashboard > Table Editor > profiles
3. Verify a new profile row was created automatically
4. Try to query another user's profile via API (should fail):
   ```typescript
   const { data } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', 'another-users-id'); // Returns empty (RLS blocks access)
   ```

### Test Profile Auto-creation
1. Sign up via `/login` with a new email
2. Check Supabase Table Editor > profiles
3. A new row should appear with `id` matching `auth.users.id`

## Customization

### Change Paths
Edit blueprint variables before applying:
```json
{
  "LOGIN_PATH": "signin",
  "DASHBOARD_PATH": "app",
  "OAUTH_PROVIDERS": "google"
}
```

### Add Profile Fields
Edit the SQL template in `supabase-profiles-rls/templates/profiles.sql.eta`:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,              -- Add new field
  company TEXT,          -- Add new field
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Customize UI
The generated pages use basic Tailwind classes. Modify templates to match your design system.

## Troubleshooting

### "User not found" error
- Check that environment variables are set correctly
- Verify Supabase URL and anon key in `.env.local`
- Restart dev server after adding env vars

### Magic link not arriving
- Check Supabase Dashboard > Authentication > Email Templates
- Verify email provider settings (Supabase uses built-in SMTP for development)
- Check spam folder

### OAuth redirect error
- Verify redirect URLs in provider settings (Google Console, GitHub OAuth Apps, etc.)
- Ensure redirect URL matches: `http://localhost:3000/auth/callback` (dev) or `https://yourdomain.com/auth/callback` (prod)

### RLS blocking legitimate queries
- Verify `auth.uid()` matches the profile `id`
- Check that user is authenticated before querying
- Review RLS policies in Supabase Dashboard > Authentication > Policies

### Profile not auto-created
- Verify trigger was created: Check Supabase SQL Editor
- Run SQL manually:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
- Re-run migration if trigger is missing

## Production Deployment

### Vercel
1. Add environment variables in Vercel Dashboard > Settings > Environment Variables
2. Redeploy the project
3. Update Supabase OAuth redirect URLs with production domain

### Environment Variables (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### Security Checklist
- ✅ RLS enabled on all user-facing tables
- ✅ Anon key is public (safe to expose in client-side code)
- ✅ Service role key is NEVER exposed to client
- ✅ Email rate limiting configured in Supabase
- ✅ OAuth redirect URLs restricted to your domain

## Next Steps

### Add Authorization
Extend RLS policies for role-based access:
```sql
-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';

-- Admin-only policy
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Add Profile Updates
Create API route for profile updates:
```typescript
// app/api/profile/route.ts
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function PATCH(req: Request) {
  const supabase = createSupabaseServerClient();
  const { full_name, avatar_url } = await req.json();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, avatar_url })
    .eq('id', user!.id);

  return Response.json({ ok: !error });
}
```

### Add Email Verification
Configure in Supabase Dashboard > Authentication > Email Templates > Confirm signup

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js SSR with Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr Package](https://github.com/supabase/ssr)
