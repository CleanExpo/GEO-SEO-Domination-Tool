# Security Implementation Guide

## Overview

This application implements multiple layers of security to protect against common web vulnerabilities:

- ✅ Security Headers (CSP, XSS, Clickjacking protection)
- ✅ CSRF Protection for state-changing requests
- ✅ HTTPS enforcement in production
- ✅ Content Security Policy (CSP)
- ✅ Row Level Security (RLS) at database level
- ✅ Authentication with Supabase Auth
- ✅ Rate limiting on API routes

## Security Headers

Security headers are automatically applied to all responses via `middleware.ts`.

### Content Security Policy (CSP)

Prevents XSS attacks by controlling which resources can be loaded:

```typescript
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.semrush.com https://api.screaming-frog.co.uk;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

**What it does:**
- Scripts: Only from same origin + Vercel analytics
- Styles: Only from same origin (inline allowed for Tailwind)
- Images: From same origin, data URIs, and HTTPS sources
- Connections: Only to Supabase and approved APIs
- Frames: Cannot be embedded in iframes
- Forms: Can only submit to same origin

### X-Frame-Options

Prevents clickjacking attacks:

```
X-Frame-Options: DENY
```

**What it does:**
- Prevents the site from being embedded in iframes
- Protects against clickjacking attacks

### X-Content-Type-Options

Prevents MIME type sniffing:

```
X-Content-Type-Options: nosniff
```

**What it does:**
- Forces browsers to respect the declared Content-Type
- Prevents browsers from interpreting files as different types

### X-XSS-Protection

Legacy XSS protection (for older browsers):

```
X-XSS-Protection: 1; mode=block
```

**What it does:**
- Enables browser's built-in XSS filter
- Blocks the page if XSS attack is detected

### Referrer-Policy

Controls information sent in Referer header:

```
Referrer-Policy: strict-origin-when-cross-origin
```

**What it does:**
- Sends full URL for same-origin requests
- Sends only origin for cross-origin requests
- Sends nothing for downgrade (HTTPS → HTTP)

### Permissions-Policy

Restricts access to browser features:

```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**What it does:**
- Disables camera access
- Disables microphone access
- Disables geolocation access

### Strict-Transport-Security (HSTS)

Forces HTTPS in production:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**What it does:**
- Forces HTTPS for 1 year (31536000 seconds)
- Applies to all subdomains
- Eligible for browser preload list

## CSRF Protection

CSRF (Cross-Site Request Forgery) protection prevents unauthorized state-changing requests.

### How It Works

1. Client requests a CSRF token from `/api/csrf`
2. Server generates token and stores in HTTP-only cookie
3. Client includes token in `x-csrf-token` header for all POST/PUT/PATCH/DELETE requests
4. Server validates that cookie token matches header token

### Setup in Client

#### React Hook (Recommended)

```typescript
'use client'

import { useEffect, useState } from 'react'

export function useCsrfToken() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    async function fetchToken() {
      const res = await fetch('/api/csrf')
      const data = await res.json()
      setToken(data.token)
    }
    fetchToken()
  }, [])

  return token
}
```

#### App-wide Provider

```typescript
// components/providers/CsrfProvider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const CsrfContext = createContext<string | null>(null)

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/csrf')
      .then((res) => res.json())
      .then((data) => setToken(data.token))
  }, [])

  return <CsrfContext.Provider value={token}>{children}</CsrfContext.Provider>
}

export function useCsrf() {
  const token = useContext(CsrfContext)
  if (!token) {
    console.warn('CSRF token not yet loaded')
  }
  return token
}
```

### Using CSRF Protection

#### Option 1: Manual Header Inclusion

```typescript
import { fetchWithCsrf } from '@/lib/security/csrf'

// Automatically includes CSRF token
const response = await fetchWithCsrf('/api/companies', {
  method: 'POST',
  body: JSON.stringify(data),
})
```

#### Option 2: Using with useApi Hook

```typescript
import { useApiPost } from '@/hooks/useApi'
import { addCsrfHeader } from '@/lib/security/csrf'

function MyComponent() {
  const { post, loading } = useApiPost('/api/companies', {
    headers: addCsrfHeader(),
  })

  const handleSubmit = async () => {
    await post(formData)
  }
}
```

#### Option 3: Protecting API Routes

```typescript
// app/api/companies/route.ts
import { withCsrfProtection } from '@/lib/security/csrf'
import { asyncHandler } from '@/lib/middleware/api-error-handler'

export const POST = withCsrfProtection(
  asyncHandler(async (req) => {
    const data = await req.json()
    // Process request - CSRF is already validated
    return NextResponse.json({ success: true })
  })
)
```

#### Option 4: Combining CSRF + Rate Limiting

```typescript
import { withCsrfProtection } from '@/lib/security/csrf'
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limiter'

export const POST = withRateLimit(
  withCsrfProtection(async (req) => {
    // Your logic here
    return NextResponse.json({ success: true })
  }),
  RateLimitPresets.strict
)
```

### CSRF Error Response

When CSRF validation fails:

```json
{
  "error": {
    "message": "Invalid or missing CSRF token",
    "code": "CSRF_TOKEN_INVALID",
    "statusCode": 403
  }
}
```

HTTP Status: **403 Forbidden**

## Environment Variables

### Required for Security

```env
# CSRF Secret (change in production)
CSRF_SECRET=your-random-secret-here-min-32-chars

# Node Environment
NODE_ENV=production

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Generating CSRF Secret

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local
echo "CSRF_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env.local
```

## Testing Security

### Testing CSP

```bash
# Check CSP header
curl -I https://your-app.vercel.app

# Expected:
# Content-Security-Policy: default-src 'self'; ...
```

### Testing CSRF Protection

```bash
# Without CSRF token (should fail)
curl -X POST https://your-app.vercel.app/api/companies \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'

# Expected: 403 Forbidden

# With CSRF token (should succeed)
TOKEN=$(curl -s https://your-app.vercel.app/api/csrf | jq -r '.token')
curl -X POST https://your-app.vercel.app/api/companies \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $TOKEN" \
  -d '{"name":"Test"}'

# Expected: 200 OK
```

### Testing Security Headers

Use these tools to verify security configuration:

1. **Mozilla Observatory**
   - URL: https://observatory.mozilla.org
   - Scans for security headers and best practices

2. **Security Headers**
   - URL: https://securityheaders.com
   - Grades your security header implementation

3. **CSP Evaluator**
   - URL: https://csp-evaluator.withgoogle.com
   - Analyzes your Content Security Policy

## Common Security Vulnerabilities (Prevented)

### ✅ XSS (Cross-Site Scripting)
- **Prevention:** CSP, X-XSS-Protection, React auto-escaping
- **Status:** Protected

### ✅ CSRF (Cross-Site Request Forgery)
- **Prevention:** CSRF tokens on state-changing requests
- **Status:** Protected

### ✅ Clickjacking
- **Prevention:** X-Frame-Options: DENY
- **Status:** Protected

### ✅ MIME Sniffing
- **Prevention:** X-Content-Type-Options: nosniff
- **Status:** Protected

### ✅ Man-in-the-Middle
- **Prevention:** HSTS, HTTPS enforcement
- **Status:** Protected (production)

### ✅ SQL Injection
- **Prevention:** Supabase prepared statements, RLS
- **Status:** Protected

### ✅ Unauthorized Access
- **Prevention:** RLS policies, authentication middleware
- **Status:** Protected

### ⚠️ DDoS
- **Prevention:** Rate limiting (basic), Vercel edge network
- **Status:** Partially protected (consider Cloudflare for advanced)

## Security Checklist

### Before Production:

- [ ] Set `CSRF_SECRET` environment variable
- [ ] Verify `NODE_ENV=production`
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Review CSP policy for your specific needs
- [ ] Test CSRF protection on all forms
- [ ] Run security header scan (securityheaders.com)
- [ ] Review RLS policies in Supabase
- [ ] Enable Supabase database backups
- [ ] Set up monitoring for failed auth attempts
- [ ] Configure rate limiting for all API routes
- [ ] Enable Vercel Web Application Firewall (WAF)

### Ongoing:

- [ ] Rotate CSRF secret quarterly
- [ ] Review access logs for suspicious activity
- [ ] Update dependencies regularly (`npm audit`)
- [ ] Monitor rate limit violations
- [ ] Review and update CSP as needed
- [ ] Test security configuration after major changes

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email: security@yourcompany.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Additional Recommendations

### For Enhanced Security:

1. **Use Cloudflare**
   - DDoS protection
   - WAF (Web Application Firewall)
   - Bot detection
   - Advanced rate limiting

2. **Enable Supabase MFA**
   - Multi-factor authentication for admin accounts
   - TOTP or SMS verification

3. **Implement Audit Logging**
   - Log all sensitive operations
   - Monitor for suspicious patterns
   - Store logs securely

4. **Use Secrets Management**
   - Vercel Environment Variables (encrypted)
   - Never commit secrets to git
   - Rotate secrets regularly

5. **Set up Security Monitoring**
   - Sentry for error tracking
   - Uptime monitoring
   - Security alert notifications

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist#security)
- [CSP Reference](https://content-security-policy.com/)
