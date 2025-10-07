/**
 * Backlinks API Endpoint
 * GET /api/backlinks - Fetch backlinks for a company
 * POST /api/backlinks - Create a new backlink
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
        b.*,
        c.name as company_name
      FROM backlinks b
      LEFT JOIN companies c ON b.company_id = c.id
      WHERE b.company_id = ?
      ORDER BY b.discovered_at DESC
    `;

    const backlinks = await db.all(query, [companyId]);

    return NextResponse.json({
      success: true,
      backlinks: backlinks || [],
      count: backlinks?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching backlinks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backlinks' },
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
    const { company_id, source_url, target_url, anchor_text, domain_authority, follow_type } = body;

    // Validation
    if (!company_id || !source_url || !target_url) {
      return NextResponse.json(
        { error: 'company_id, source_url, and target_url are required' },
        { status: 400 }
      );
    }

    if (follow_type && !['dofollow', 'nofollow'].includes(follow_type)) {
      return NextResponse.json(
        { error: 'follow_type must be either "dofollow" or "nofollow"' },
        { status: 400 }
      );
    }

    await db.initialize();

    const query = `
      INSERT INTO backlinks (
        company_id, source_url, target_url, anchor_text, domain_authority, follow_type
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await db.run(query, [
      company_id,
      source_url,
      target_url,
      anchor_text || null,
      domain_authority || null,
      follow_type || 'dofollow',
    ]);

    return NextResponse.json({
      success: true,
      message: 'Backlink created successfully',
      backlink_id: result.lastID,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating backlink:', error);
    return NextResponse.json(
      { error: 'Failed to create backlink' },
      { status: 500 }
    );
  } finally {
    await db.close();
  }
}
