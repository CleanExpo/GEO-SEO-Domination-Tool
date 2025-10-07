/**
 * Content Gaps API Endpoint
 * GET /api/content-gaps - Fetch content gaps for a company
 * POST /api/content-gaps - Create a new content gap
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
        cg.*,
        c.name as company_name
      FROM content_gaps cg
      LEFT JOIN companies c ON cg.company_id = c.id
      WHERE cg.company_id = ?
      ORDER BY
        CASE cg.priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        cg.search_volume DESC
    `;

    const gaps = await db.all(query, [companyId]);

    return NextResponse.json({
      success: true,
      gaps: gaps || [],
      count: gaps?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching content gaps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content gaps' },
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
    const { company_id, topic, keyword, search_volume, competitor_has_content, priority, status } = body;

    // Validation
    if (!company_id || !topic || !keyword) {
      return NextResponse.json(
        { error: 'company_id, topic, and keyword are required' },
        { status: 400 }
      );
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'priority must be either "low", "medium", or "high"' },
        { status: 400 }
      );
    }

    if (status && !['identified', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be either "identified", "in_progress", or "completed"' },
        { status: 400 }
      );
    }

    await db.initialize();

    const query = `
      INSERT INTO content_gaps (
        company_id, topic, keyword, search_volume, competitor_has_content, priority, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(query, [
      company_id,
      topic,
      keyword,
      search_volume || null,
      competitor_has_content ? 1 : 0,
      priority || 'medium',
      status || 'identified',
    ]);

    return NextResponse.json({
      success: true,
      message: 'Content gap created successfully',
      gap_id: result.lastID,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating content gap:', error);
    return NextResponse.json(
      { error: 'Failed to create content gap' },
      { status: 500 }
    );
  } finally {
    await db.close();
  }
}
