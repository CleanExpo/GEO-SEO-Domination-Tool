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

    // Fetch only the MOST RECENT onboarding session per business name
    // This prevents showing duplicate test attempts
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
      ORDER BY business_name ASC, created_at DESC`
    );

    const allSessions = result.rows || [];
    console.log('[Saved Onboarding] Found', allSessions.length, 'total sessions');

    // Keep only the most recent session per business name
    const uniqueSessions = new Map();
    for (const session of allSessions) {
      const key = session.business_name.toLowerCase().trim();
      if (!uniqueSessions.has(key)) {
        uniqueSessions.set(key, session);
      }
    }

    const sessions = Array.from(uniqueSessions.values());
    console.log('[Saved Onboarding] Filtered to', sessions.length, 'unique clients');

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

    // Sort alphabetically by business name
    savedClients.sort((a, b) => a.businessName.localeCompare(b.businessName));

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
