import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CSRF_TOKEN_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production'

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const token = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return token
}

/**
 * Get CSRF token from cookies (server-side)
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_NAME)?.value || null
}

/**
 * Set CSRF token in cookie (server-side)
 */
export async function setCsrfToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return false
  }

  return cookieToken === headerToken
}

/**
 * CSRF protection middleware
 */
export function withCsrfProtection(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    // Only check CSRF for state-changing methods
    const stateMethods = ['POST', 'PUT', 'PATCH', 'DELETE']

    if (stateMethods.includes(req.method)) {
      // Validate CSRF token
      if (!validateCsrfToken(req)) {
        return NextResponse.json(
          {
            error: {
              message: 'Invalid or missing CSRF token',
              code: 'CSRF_TOKEN_INVALID',
              statusCode: 403,
            },
          },
          { status: 403 }
        )
      }
    }

    // Execute the handler
    return handler(req, context)
  }
}

/**
 * Client-side hook to get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${CSRF_TOKEN_NAME}=`)
  )

  if (!csrfCookie) return null

  return csrfCookie.split('=')[1]
}

/**
 * Add CSRF token to fetch headers (client-side)
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfTokenFromCookie()

  if (!token) {
    console.warn('CSRF token not found in cookies')
    return headers
  }

  return {
    ...headers,
    [CSRF_HEADER_NAME]: token,
  }
}

/**
 * Fetch wrapper with automatic CSRF token inclusion
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfHeaders = addCsrfHeader(options.headers)

  return fetch(url, {
    ...options,
    headers: csrfHeaders,
  })
}
