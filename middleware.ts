import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/auth'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/companies',
  '/audits',
  '/keywords',
  '/rankings',
  '/reports',
  '/crm',
  '/projects',
  '/resources',
  '/settings',
  '/onboarding',
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/error',
  '/api/auth',
  '/terms',
  '/privacy',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next({
      request,
    })
    return addSecurityHeaders(response)
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    const session = await auth()

    if (!session) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  const response = NextResponse.next({
    request,
  })

  return addSecurityHeaders(response)
}

function addSecurityHeaders(response: NextResponse) {

  // Content Security Policy with all AI API domains
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://accounts.google.com https://accounts.google.com/gsi/",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://accounts.google.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.openai.com https://api.perplexity.ai https://api.groq.com https://dashscope-intl.aliyuncs.com https://api.deepseek.com https://api.openrouter.ai https://api.semrush.com https://pagespeedonline.googleapis.com https://api.firecrawl.dev https://api.stripe.com https://accounts.google.com https://*.googleapis.com https://oauth2.googleapis.com",
      "frame-ancestors 'none'",
      "frame-src 'self' https://accounts.google.com",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
    ].join('; ')
  )

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // HSTS (Strict-Transport-Security)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - CRITICAL: must be excluded!)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (images, fonts, etc.)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// Middleware MUST run on Edge Runtime in Vercel
// Removing runtime declaration lets Next.js use Edge Runtime (default for middleware)
