import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

/**
 * Test route to verify Sentry integration
 * Visit /api/sentry-test to trigger a test error
 */
export async function GET() {
  try {
    // Add breadcrumb before error
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'About to trigger test error',
      level: 'info',
    });

    // User's test function - this will throw an error
    function myUndefinedFunction() {
      throw new Error('This is a test error from Sentry integration - myUndefinedFunction()');
    }

    myUndefinedFunction();

    return NextResponse.json({ success: true });
  } catch (error) {
    // Capture exception with context
    Sentry.captureException(error, {
      tags: {
        test: true,
        route: 'sentry-test',
      },
      contexts: {
        test: {
          purpose: 'Verify Sentry integration',
          trigger: 'myUndefinedFunction()',
        },
      },
    });

    // Return error response
    return NextResponse.json(
      {
        error: 'Test error captured by Sentry',
        message: error instanceof Error ? error.message : 'Unknown error',
        sentryCapture: 'Error sent to Sentry with tags and context',
      },
      { status: 500 }
    );
  }
}
