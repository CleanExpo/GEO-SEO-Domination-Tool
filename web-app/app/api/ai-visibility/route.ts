/**
 * AI Visibility API Endpoint
 * GET /api/ai-visibility - Fetch visibility records for a company
 * POST /api/ai-visibility - Create a new visibility check record
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('company_id');

  if (!companyId) {
    return NextResponse.json(
      { error: 'company_id parameter is required' },
      { status: 400 }
    );
  }

  const db = new DatabaseClient();

  try {
    await db.initialize();

    const query = `
      SELECT
        v.*,
        c.name as company_name
      FROM ai_search_visibility v
      LEFT JOIN companies c ON v.company_id = c.id
      WHERE v.company_id = ?
      ORDER BY v.check_date DESC, v.visibility_score DESC
    `;

    const records = await db.all(query, [companyId]);

    return NextResponse.json({
      success: true,
      records: records || [],
      count: records?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching AI visibility records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI visibility records' },
      { status: 500 }
    );
  } finally {
    await db.close();
  }
}

export async function POST(request: NextRequest) {
  const db = new DatabaseClient();

  try {
    const body = await request.json();
    const {
      company_id,
      query,
      ai_platform,
      is_cited,
      citation_position,
      citation_context,
      citation_url,
      visibility_score,
      check_date,
    } = body;

    // Validation
    if (!company_id || !query || !ai_platform) {
      return NextResponse.json(
        { error: 'company_id, query, and ai_platform are required' },
        { status: 400 }
      );
    }

    const validPlatforms = ['Perplexity', 'ChatGPT', 'Gemini', 'Claude'];
    if (!validPlatforms.includes(ai_platform)) {
      return NextResponse.json(
        {
          error: `Invalid platform: ${ai_platform}. Valid platforms are: ${validPlatforms.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (visibility_score !== undefined && (visibility_score < 0 || visibility_score > 100)) {
      return NextResponse.json(
        { error: 'visibility_score must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (citation_position !== undefined && citation_position < 1) {
      return NextResponse.json(
        { error: 'citation_position must be a positive number' },
        { status: 400 }
      );
    }

    await db.initialize();

    const query_sql = `
      INSERT INTO ai_search_visibility (
        company_id, query, ai_platform, is_cited, citation_position,
        citation_context, citation_url, visibility_score, check_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(query_sql, [
      company_id,
      query,
      ai_platform,
      is_cited ? 1 : 0,
      citation_position || null,
      citation_context || null,
      citation_url || null,
      visibility_score || 0,
      check_date || new Date().toISOString().split('T')[0],
    ]);

    return NextResponse.json(
      {
        success: true,
        message: 'AI visibility record created successfully',
        record_id: result.lastID,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating AI visibility record:', error);
    return NextResponse.json(
      { error: 'Failed to create AI visibility record' },
      { status: 500 }
    );
  } finally {
    await db.close();
  }
}
