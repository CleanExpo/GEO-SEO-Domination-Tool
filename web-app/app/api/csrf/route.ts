import { NextResponse } from 'next/server'
import { generateCsrfToken, setCsrfToken } from '@/lib/security/csrf'

/**
 * GET /api/csrf - Generate and return a CSRF token
 * Client should call this once on app load to get a CSRF token
 */
export async function GET() {
  try {
    // Generate new CSRF token
    const token = generateCsrfToken()

    // Set token in HTTP-only cookie
    await setCsrfToken(token)

    // Return token in response body for client to include in headers
    return NextResponse.json({
      token,
      headerName: 'x-csrf-token',
    })
  } catch (error) {
    console.error('CSRF token generation failed:', error)
    return NextResponse.json(
      {
        error: {
          message: 'Failed to generate CSRF token',
          code: 'CSRF_GENERATION_FAILED',
          statusCode: 500,
        },
      },
      { status: 500 }
    )
  }
}
