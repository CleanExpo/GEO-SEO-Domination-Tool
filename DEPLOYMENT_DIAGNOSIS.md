# Deployment Diagnosis - 500 Error

## Current Status
- ✅ Database: All sandbox tables created successfully in Supabase
- ✅ Environment Variables: Added to Vercel (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- ✅ Deployment: Build completes successfully (web-om93kgb8x, web-puwnstpmg both marked "Ready")
- ❌ Runtime: Site returns 500 Internal Server Error

## What's Working
- Build process completes without errors (79 pages generated)
- HTML is being served (curl shows full page markup with metadata)
- Static assets are being generated (JS, CSS)

## What's Failing
- Client-side hydration shows "Internal Server Error"
- Both production and preview URLs return HTTP 500
- Console shows 401 and 500 errors but no JS error details

## Likely Causes

### 1. Middleware Error (Most Likely)
The middleware (`web-app/middleware.ts`) runs on every request and tries to connect to Supabase. Possible issues:
- Environment variables not propagating to Edge Runtime
- Supabase client initialization failing in Edge Runtime
- Auth check causing unhandled exception

### 2. Server-Side Rendering Error
Something in the layout or page components is crashing during SSR:
- Database query failing
- Environment variable missing at runtime
- Import error in server components

### 3. Edge Runtime Compatibility
The middleware uses `export const runtime = 'nodejs'` but might be running in Edge Runtime anyway.

## Next Steps to Debug

### Option 1: Disable Middleware Temporarily
Comment out the entire middleware to see if the site loads:

```typescript
// web-app/middleware.ts
export async function middleware(request: NextRequest) {
  return NextResponse.next()  // Just pass through
}
```

### Option 2: Add Error Logging
Add try-catch with console.error in middleware:

```typescript
try {
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[Middleware] User:', user?.email || 'anonymous')
} catch (error) {
  console.error('[Middleware] Supabase error:', error)
  // Don't block the request
  return NextResponse.next()
}
```

### Option 3: Check Vercel Function Logs
View realtime logs:
```bash
vercel logs web-om93kgb8x-unite-group.vercel.app --follow
```

### Option 4: Test Without Supabase
Temporarily use placeholder Supabase values to see if auth is the issue:

```bash
vercel env rm NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://placeholder.supabase.co
```

## Environment Variables Set
From screenshot, these are configured:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ ANTHROPIC_API_KEY
- ✅ CLIENT_ID
- ✅ CLIENT_SECRET
- ✅ DASHSCOPE_API_KEY
- ✅ DATABASE_PASSWORD
- ✅ DATAFORSEO_API_KEY
- ✅ DOCKER_TOKEN
- ✅ FIRECRAWL_API_KEY
- ✅ GITHUB_TOKEN
- ✅ GOOGLE_API_KEY
- ✅ GOOGLE_CLOUD_PROJECT_ID
- ✅ NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY
- ✅ OPENAI_API_KEY
- ✅ OPENROUTER_API
- ✅ PERPLEXITY_API_KEY
- ✅ POSTGRES_URL
- ✅ SEMRUSH_API_KEY
- ✅ VERCEL_API_KEY

## Hypothesis
The middleware is likely failing silently or the error boundary isn't catching the error properly. The fact that curl returns HTML suggests the initial SSR works, but something fails during the Next.js response streaming or client hydration.

## Recommended Action
1. View Vercel function logs to see the actual error
2. Temporarily simplify middleware to just pass through requests
3. Redeploy and test
