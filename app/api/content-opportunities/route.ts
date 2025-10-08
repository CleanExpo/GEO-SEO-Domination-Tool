/**
 * GET /api/content-opportunities - List all content opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const db = await getDatabase();

    let query = `
      SELECT
        co.*,
        COUNT(cp.id) as content_plans_count,
        c.name as company_name
      FROM content_opportunities co
      LEFT JOIN content_plans cp ON co.id = cp.opportunity_id
      LEFT JOIN companies c ON co.company_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (companyId) {
      query += ` AND co.company_id = ?`;
      params.push(companyId);
    }

    if (status) {
      query += ` AND co.status = ?`;
      params.push(status);
    }

    if (minScore) {
      query += ` AND co.opportunity_score >= ?`;
      params.push(parseFloat(minScore));
    }

    query += `
      GROUP BY co.id
      ORDER BY co.opportunity_score DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);

    const opportunities = await db.all(query, params);

    // Parse JSON fields
    const formatted = opportunities.map((opp: any) => ({
      ...opp,
      intents: JSON.parse(opp.intents || '[]'),
      top_questions: JSON.parse(opp.top_questions || '[]'),
      key_bullets: JSON.parse(opp.key_bullets || '[]'),
      citations: JSON.parse(opp.citations || '[]'),
      source_thread_ids: JSON.parse(opp.source_thread_ids || '[]')
    }));

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM content_opportunities WHERE 1=1`;
    const countParams: any[] = [];

    if (companyId) {
      countQuery += ` AND company_id = ?`;
      countParams.push(companyId);
    }

    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    if (minScore) {
      countQuery += ` AND opportunity_score >= ?`;
      countParams.push(parseFloat(minScore));
    }

    const countResult = await db.get(countQuery, countParams);

    return NextResponse.json({
      opportunities: formatted,
      total: countResult.total,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('Failed to fetch content opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content opportunities', details: error.message },
      { status: 500 }
    );
  }
}
