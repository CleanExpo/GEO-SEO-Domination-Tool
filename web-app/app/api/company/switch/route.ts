import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient, getUser } from '@/lib/auth/supabase-server';
import { verifyCompanyAccess } from '@/lib/company-context';
import { z } from 'zod';

const switchSchema = z.object({
  companyId: z.string().uuid('Valid company ID required'),
});

/**
 * POST /api/company/switch
 * Switch the active company for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId } = switchSchema.parse(body);

    // Verify user has access to this company
    const hasAccess = await verifyCompanyAccess(companyId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this company' },
        { status: 403 }
      );
    }

    // Set the active company cookie
    const cookieStore = cookies();
    cookieStore.set('active_company_id', companyId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });

    return NextResponse.json({
      success: true,
      companyId,
      message: 'Active company switched successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Switch company error:', error);
    return NextResponse.json(
      { error: 'Failed to switch company' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/company/switch
 * Get the currently active company
 */
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = cookies();
    const activeCompanyId = cookieStore.get('active_company_id')?.value;

    if (!activeCompanyId) {
      return NextResponse.json({
        activeCompanyId: null,
        message: 'No active company set'
      });
    }

    // Verify access to this company
    const hasAccess = await verifyCompanyAccess(activeCompanyId);

    if (!hasAccess) {
      // Clear invalid cookie
      cookieStore.delete('active_company_id');
      return NextResponse.json(
        { error: 'Active company is no longer accessible' },
        { status: 403 }
      );
    }

    return NextResponse.json({ activeCompanyId });
  } catch (error) {
    console.error('Get active company error:', error);
    return NextResponse.json(
      { error: 'Failed to get active company' },
      { status: 500 }
    );
  }
}
