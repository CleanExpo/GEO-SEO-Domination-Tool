# Google OAuth 404 Error Fix Guide

## Problem Identified

The NextAuth v5 Google OAuth was failing with a 404 error during the callback phase. This was caused by:

1. **Wrong import in signin page** - Using `next-auth/react` instead of server actions
2. **Missing NextAuth v5 configuration** - `trustHost` and `basePath` not explicitly set
3. **Possible Google Cloud Console misconfiguration** - Redirect URI not matching exactly

## Fixes Applied

### 1. Created Server Action for Sign In

**File:** `d:\GEO_SEO_Domination-Tool\app\auth\signin\actions.ts`

```typescript
'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function handleGoogleSignIn() {
  try {
    await signIn('google', { redirectTo: '/dashboard' });
  } catch (error) {
    if (error instanceof AuthError) {
      throw new Error(error.message);
    }
    throw error;
  }
}
```

### 2. Updated Sign In Page

**File:** `d:\GEO_SEO_Domination-Tool\app\auth\signin\page.tsx`

Changed from:
```typescript
import { signIn } from 'next-auth/react'; // ❌ WRONG for NextAuth v5
```

To:
```typescript
import { handleGoogleSignIn } from './actions'; // ✅ CORRECT - Server action
```

### 3. Enhanced NextAuth Configuration

**File:** `d:\GEO_SEO_Domination-Tool\auth.ts`

Added critical NextAuth v5 configuration:

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  trustHost: true, // ✅ Required for NextAuth v5 in development
  basePath: '/api/auth', // ✅ Explicit base path for NextAuth routes
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  // ... rest of configuration
});
```

## Google Cloud Console Configuration

**CRITICAL:** Verify these exact URLs are configured in your Google Cloud Console:

### OAuth 2.0 Client ID Configuration

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add these **Authorized redirect URIs**:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/signin
```

4. Add these **Authorized JavaScript origins**:

```
http://localhost:3000
```

5. **IMPORTANT:** For production, also add:

```
https://yourdomain.com/api/auth/callback/google
https://yourdomain.com/api/auth/signin
```

## Environment Variables

Verify these are set in `.env.local`:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET="WdxA4V/KOamTHuCGfvLs914jNj3SP1J8d6Mq1ZgUI+s="
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_DEBUG=true

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID="810093513411-o6b1eqol277rvgeh3n4ihnrv6vh8qbcj.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="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"
```

## Testing Steps

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open browser to:**
   ```
   http://localhost:3000/auth/signin
   ```

3. **Click "Continue with Google"**

4. **Expected Flow:**
   - Browser redirects to Google OAuth consent screen
   - User approves permissions
   - Google redirects back to: `http://localhost:3000/api/auth/callback/google`
   - NextAuth processes the callback
   - User is redirected to: `http://localhost:3000/dashboard`

5. **Check Server Logs:**
   With `NEXTAUTH_DEBUG=true`, you should see detailed logs in the terminal

## Debugging

### Check NextAuth Routes

Visit these URLs to verify NextAuth is configured correctly:

```
http://localhost:3000/api/auth/providers
http://localhost:3000/api/auth/csrf
http://localhost:3000/api/auth/signin
```

### Common Issues

**Issue 1: 404 from Google**
- **Cause:** Redirect URI not configured in Google Cloud Console
- **Fix:** Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs

**Issue 2: "redirect_uri_mismatch"**
- **Cause:** Exact URL mismatch (check for trailing slashes, http vs https)
- **Fix:** Ensure exact match in Google Cloud Console

**Issue 3: "invalid_client"**
- **Cause:** Wrong Client ID or Client Secret
- **Fix:** Copy credentials again from Google Cloud Console

**Issue 4: NextAuth routes not found**
- **Cause:** Route handler not properly configured
- **Fix:** Verify `app/api/auth/[...nextauth]/route.ts` exists and exports handlers

## Verification Checklist

- [x] Created server action for Google sign in
- [x] Updated signin page to use server action
- [x] Added `trustHost: true` to NextAuth config
- [x] Added `basePath: '/api/auth'` to NextAuth config
- [x] Verified environment variables are set
- [ ] **TODO:** Verify Google Cloud Console redirect URIs
- [ ] **TODO:** Test the complete OAuth flow
- [ ] **TODO:** Verify user is saved to database after sign in

## Next Steps

1. **Verify Google Cloud Console configuration** (most critical)
2. **Test the sign in flow** end-to-end
3. **Check database** to ensure user record is created
4. **Test sign out** functionality

## Additional Resources

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
