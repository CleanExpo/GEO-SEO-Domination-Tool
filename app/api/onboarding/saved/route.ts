/**
 * Saved Onboarding Sessions API
 *
 * GET: List all saved onboarding sessions (alphabetically by business name)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const db = getDatabase();

export async function GET(request: NextRequest) {
  try {
    console.log('[Saved Onboarding] Fetching saved sessions');

    // Fetch all completed or pending onboarding sessions
    // Order alphabetically by business_name
    const result = await db.query(
      `SELECT
        id,
        business_name,
        email,
        industry,
        status,
        company_id,
        created_at,
        completed_at,
        request_data
      FROM onboarding_sessions
      ORDER BY business_name ASC`
    );

    const sessions = result.rows || [];

    console.log('[Saved Onboarding] Found', sessions.length, 'sessions');

    // Format response with client details
    const savedClients = sessions.map(session => {
      // Parse request_data (might be object or string)
      let requestData;
      if (session.request_data) {
        requestData = typeof session.request_data === 'string'
          ? JSON.parse(session.request_data)
          : session.request_data;
      }

      return {
        id: session.id,
        businessName: session.business_name,
        email: session.email,
        industry: session.industry || requestData?.industry || 'Unknown',
        status: session.status,
        companyId: session.company_id,
        createdAt: session.created_at,
        completedAt: session.completed_at,
        // Include full form data for reloading
        formData: requestData
      };
    });

    return NextResponse.json({
      success: true,
      clients: savedClients,
      count: savedClients.length
    });

  } catch (error: any) {
    console.error('[Saved Onboarding] ERROR:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch saved clients',
      message: error.message
    }, { status: 500 });
  }
}
