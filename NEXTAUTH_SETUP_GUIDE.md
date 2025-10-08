# NextAuth.js Google OAuth Setup Guide

## ✅ Installation Complete

NextAuth.js v5 (beta) has been installed and configured with Google OAuth provider.

## 📋 Required Environment Variables

Add these to your **Vercel Environment Variables** and local `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-production-url.vercel.app

# Google OAuth (You already have these)
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use this Node.js command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Set NEXTAUTH_URL

- **Development**: `http://localhost:3000`
- **Production**: `https://geo-seo-domination-tool.vercel.app`

## 🔧 Files Created/Updated

### 1. Authentication Configuration (`auth.ts`)
- NextAuth v5 configuration
- Google OAuth provider setup
- User database integration
- Session management with JWT
- Auto-creates users on first sign-in
- Updates last_login timestamp

### 2. API Route (`app/api/auth/[...nextauth]/route.ts`)
- Handles all OAuth callbacks
- `/api/auth/signin` - Sign in page
- `/api/auth/callback/google` - Google OAuth callback
- `/api/auth/session` - Current session
- `/api/auth/signout` - Sign out

### 3. Sign In Page (`app/auth/signin/page.tsx`)
- Beautiful, professional UI
- Single "Continue with Google" button
- Security features highlighted
- Feature list displayed
- Mobile responsive
- Dark mode support

### 4. Middleware (`middleware.ts`)
- Protects routes requiring authentication
- Redirects unauthenticated users to sign-in
- Maintains security headers
- Edge Runtime compatible

### 5. Database Schema (`database/users-schema.sql`)
- `users` table for OAuth data
- Stores: email, name, image, provider info
- Tracks: created_at, last_login, is_active
- Indexed for performance

## 🔐 Security Features

### OAuth 2.0 Flow
- Industry-standard authentication
- Never handles user passwords
- Google manages security
- Automatic token refresh

### Session Management
- JWT-based sessions (stateless)
- 30-day session expiration
- Secure cookie storage
- CSRF protection built-in

### Route Protection
- Middleware automatically protects:
  - `/dashboard` - Main dashboard
  - `/companies` - Company management
  - `/audits` - SEO audits
  - `/keywords` - Keyword tracking
  - `/rankings` - Ranking reports
  - `/reports` - Generated reports
  - `/crm` - CRM system
  - `/projects` - Project management
  - `/resources` - Resource library
  - `/settings` - User settings
  - `/onboarding` - Onboarding flow

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- XSS Protection
- Strict-Transport-Security (HSTS)
- Referrer-Policy
- Permissions-Policy

## 🚀 How to Use

### For Users

1. Visit any protected page (e.g., `/dashboard`)
2. Redirected to `/auth/signin`
3. Click "Continue with Google"
4. Google OAuth consent screen appears
5. Grant permissions
6. Redirected back to original page
7. Now signed in!

### For Developers

#### Check if user is signed in (Client Component)

```tsx
'use client';
import { useSession } from 'next-auth/react';

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;

  return (
    <div>
      <p>Signed in as {session.user.email}</p>
      <img src={session.user.image} alt={session.user.name} />
    </div>
  );
}
```

#### Check if user is signed in (Server Component)

```tsx
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Welcome {session.user.name}!</div>;
}
```

#### Sign out

```tsx
import { signOut } from 'next-auth/react';

<button onClick={() => signOut()}>Sign Out</button>
```

#### Get user from database

```tsx
import { auth } from '@/auth';
import { db } from '@/database/init';

const session = await auth();
const user = await db.get(
  'SELECT * FROM users WHERE email = ?',
  [session.user.email]
);
```

## 📱 Google OAuth Setup (Already Completed)

You've already configured Google OAuth Client ID with these settings:

- **Authorized JavaScript origins**:
  - `http://localhost:3000`
  - `https://geo-seo-domination-tool.vercel.app`

- **Authorized redirect URIs**:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://geo-seo-domination-tool.vercel.app/api/auth/callback/google`

✅ No changes needed in Google Console!

## 🧪 Testing Checklist

### Local Testing

1. ✅ Set environment variables in `.env.local`:
   ```env
   NEXTAUTH_SECRET=your-secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_OAUTH_CLIENT_ID=your-client-id
   GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
   ```

2. ✅ Start dev server:
   ```bash
   npm run dev
   ```

3. ✅ Visit http://localhost:3000/auth/signin

4. ✅ Click "Continue with Google"

5. ✅ Sign in with Google account

6. ✅ Check if redirected to `/dashboard`

7. ✅ Check user created in database:
   ```bash
   sqlite3 data/geo-seo.db "SELECT * FROM users;"
   ```

8. ✅ Try accessing protected route without signing in

9. ✅ Should redirect to `/auth/signin`

10. ✅ Test sign out functionality

### Production Testing

1. ✅ Set environment variables in Vercel:
   ```
   NEXTAUTH_SECRET=production-secret
   NEXTAUTH_URL=https://geo-seo-domination-tool.vercel.app
   GOOGLE_OAUTH_CLIENT_ID=your-client-id
   GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
   ```

2. ✅ Deploy to Vercel:
   ```bash
   git add .
   git commit -m "Add NextAuth.js Google OAuth authentication"
   git push
   ```

3. ✅ Visit production URL

4. ✅ Test sign-in flow

5. ✅ Verify user stored in Supabase/PostgreSQL

## 🔧 Vercel Environment Variables

Run these commands to set production environment variables:

```bash
# Generate secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set in Vercel
vercel env add NEXTAUTH_SECRET production
# Paste the generated secret when prompted

vercel env add NEXTAUTH_URL production
# Enter: https://geo-seo-domination-tool.vercel.app

# Google OAuth (already set, but verify)
vercel env ls production | grep GOOGLE_OAUTH
```

## 📊 Database Integration

### SQLite (Development)

Users are stored in `data/geo-seo.db` in the `users` table.

**View users**:
```bash
sqlite3 data/geo-seo.db "SELECT id, email, name, provider, created_at FROM users;"
```

### PostgreSQL/Supabase (Production)

Run this SQL in **Supabase SQL Editor**:

```sql
-- Create users table for NextAuth
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  provider TEXT NOT NULL DEFAULT 'google',
  provider_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_account_id);
```

**View users**:
```sql
SELECT id, email, name, provider, created_at FROM users ORDER BY created_at DESC;
```

## 🎨 UI Features

### Sign In Page (`/auth/signin`)

- **Modern Design**: Gradient backgrounds, smooth animations
- **Security Badge**: Highlights OAuth 2.0 security
- **Feature List**: Shows benefits of signing in
- **Google Branding**: Official Google sign-in button
- **Responsive**: Works on mobile, tablet, desktop
- **Dark Mode**: Automatic theme support
- **Loading State**: Shows spinner while authenticating
- **Error Handling**: Displays toast notifications for errors

### Protected Pages

- Automatic redirect to sign-in if not authenticated
- Preserves intended destination with `callbackUrl`
- After sign-in, user returns to original page

## 🔄 Migration from Supabase Auth

### What Changed

❌ **Removed**:
- `@supabase/auth-helpers-nextjs`
- `@supabase/supabase-js` authentication
- Supabase client-side auth
- Email/password sign-up forms

✅ **Added**:
- `next-auth@beta` (NextAuth.js v5)
- Google OAuth 2.0
- JWT session management
- Middleware-based route protection
- Custom users database table

### Benefits

- ✅ No Supabase dependency for auth
- ✅ Works with SQLite (development) and PostgreSQL (production)
- ✅ Industry-standard OAuth 2.0
- ✅ No password management
- ✅ Google handles security
- ✅ Simpler user experience
- ✅ Edge Runtime compatible
- ✅ Better TypeScript support

## 📝 Next Steps

1. **Set environment variables**:
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32

   # Add to .env.local and Vercel
   ```

2. **Test locally**:
   ```bash
   npm run dev
   # Visit http://localhost:3000/auth/signin
   ```

3. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Add NextAuth.js Google OAuth"
   git push
   ```

4. **Verify production**:
   - Visit production URL
   - Test Google sign-in
   - Check user in database

5. **Optional enhancements**:
   - Add user profile page
   - Add sign-out button to nav
   - Add session indicator
   - Add user avatar dropdown

## 🐛 Troubleshooting

### "NEXTAUTH_SECRET is not set"

**Solution**: Generate and set the secret:
```bash
openssl rand -base64 32
# Add to .env.local and Vercel
```

### "Redirect URI mismatch"

**Solution**: Verify in Google Console:
- Authorized redirect URIs must include `/api/auth/callback/google`
- Check both localhost and production URLs

### "User not created in database"

**Solution**: Run database migration:
```bash
node scripts/init-database.js
```

### "Middleware blocking public routes"

**Solution**: Add route to `publicRoutes` array in `middleware.ts`

### "Session not persisting"

**Solution**:
1. Clear browser cookies
2. Verify `NEXTAUTH_SECRET` is set
3. Check cookie domain in production

## 📚 Resources

- [NextAuth.js Documentation](https://authjs.dev/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

**Status**: ✅ Ready for testing
**Last Updated**: October 9, 2025
