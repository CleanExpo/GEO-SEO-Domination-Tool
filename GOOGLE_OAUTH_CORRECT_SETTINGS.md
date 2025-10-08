# Google OAuth Configuration - CORRECT SETTINGS

## Issue Identified
Your Google OAuth redirect URIs are incorrect for NextAuth v5. The screenshot shows outdated callback paths.

## Correct Configuration

### Authorized JavaScript Origins
Add these exact URLs in your Google Cloud Console OAuth client:
```
http://localhost:3000
https://geo-seo-domination-tool.vercel.app
https://geo-seo-domination-tool-git-main-unite-group.vercel.app
```

**Remove**: `http://localhost:3001` (wrong port)

### Authorized Redirect URIs
Add these exact URLs:
```
http://localhost:3000/api/auth/callback/google
https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
https://geo-seo-domination-tool-git-main-unite-group.vercel.app/api/auth/callback/google
```

**Key Changes**:
- Path should be `/api/auth/callback/google` (NOT just `/api/auth/callback`)
- Must match NEXTAUTH_URL in `.env.local` (currently `http://localhost:3000`)

## Steps to Fix

1. **Go to Google Cloud Console**:
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID for "Web application"

2. **Update Authorized JavaScript Origins**:
   ```
   http://localhost:3000
   https://geo-seo-domination-tool.vercel.app
   https://geo-seo-domination-tool-git-main-unite-group.vercel.app
   ```

3. **Update Authorized Redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://geo-seo-domination-tool.vercel.app/api/auth/callback/google
   https://geo-seo-domination-tool-git-main-unite-group.vercel.app/api/auth/callback/google
   ```

4. **Click "Save"** (note: changes may take 5 minutes to propagate)

5. **Verify Environment Variables** (already correct in your `.env.local`):
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<your-secret>"
   GOOGLE_OAUTH_CLIENT_ID="<your-client-id>"
   GOOGLE_OAUTH_CLIENT_SECRET="<your-client-secret>"
   ```

## Current Setup Status

✅ NextAuth v5 configured correctly in `auth.ts`
✅ API route handler exists at `app/api/auth/[...nextauth]/route.ts`
✅ Signin page configured at `app/auth/signin/page.tsx`
✅ Middleware protecting routes correctly in `middleware.ts`
✅ Environment variables set in `.env.local`

❌ Google OAuth redirect URIs need updating (shown in screenshot)

## Testing After Fix

1. Wait 5 minutes after saving Google OAuth changes
2. Clear browser cookies/cache
3. Navigate to: http://localhost:3000/auth/signin
4. Click "Continue with Google"
5. Should redirect to Google consent screen
6. After authorization, should redirect back to `/dashboard`

## Common Issues

**Error: "redirect_uri_mismatch"**
- Check Google OAuth settings match exactly
- Verify NEXTAUTH_URL in .env.local matches JavaScript origins
- Clear browser cache

**Error: "Access blocked: Authorization Error"**
- Check OAuth consent screen configuration
- Add your email as test user if app not published

**Database Error on Sign-in**
- Check users table exists (run `npm run db:init`)
- Verify DATABASE_URL or SQLite database created

## Production Deployment (Vercel)

Add these environment variables in Vercel project settings:
```
NEXTAUTH_URL=https://geo-seo-domination-tool.vercel.app
NEXTAUTH_SECRET=<same-secret-as-local>
GOOGLE_OAUTH_CLIENT_ID=<same-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<same-client-secret>
```

Redeploy after adding environment variables.
