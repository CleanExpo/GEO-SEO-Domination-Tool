import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// GET /api/companies - List all companies
export async function GET(request: Request) {
  try {
    const db = getDatabase();
    const { searchParams } = new URL(request.url);

    // Optional filters
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = 'SELECT * FROM companies';
    const params: any[] = [];

    if (search) {
      sql += ' WHERE name LIKE ? OR city LIKE ? OR industry LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const companies = await db.all(sql, params);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM companies';
    if (search) {
      countSql += ' WHERE name LIKE ? OR city LIKE ? OR industry LIKE ?';
    }
    const countParams = search ? params.slice(0, 3) : [];
    const countResult = await db.get<{ total: number }>(countSql, countParams);

    return NextResponse.json({
      companies,
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (countResult?.total || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(request: Request) {
  try {
    const db = getDatabase();
    const body = await request.json();

    // Validate required fields
    const required = ['name', 'address', 'city', 'state', 'zip', 'phone', 'website'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Insert company
    const sql = `
      INSERT INTO companies (
        name, address, city, state, zip, phone, website, email,
        industry, services, description, gbp_url, social_profiles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ${db.getType() === 'postgres' ? 'RETURNING id' : ''}
    `;

    const params = [
      body.name,
      body.address,
      body.city,
      body.state,
      body.zip,
      body.phone,
      body.website,
      body.email || null,
      body.industry || null,
      body.services ? JSON.stringify(body.services) : null,
      body.description || null,
      body.gbp_url || null,
      body.social_profiles ? JSON.stringify(body.social_profiles) : null
    ];

    const result = await db.run(sql, params);
    const companyId = result.lastID;

    // Fetch the created company
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: 'Failed to create company' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies - Delete all companies (requires confirmation)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');

    if (confirm !== 'DELETE_ALL_COMPANIES') {
      return NextResponse.json(
        { error: 'Confirmation required. Add ?confirm=DELETE_ALL_COMPANIES to delete all companies' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = await db.run('DELETE FROM companies');

    return NextResponse.json({
      message: 'All companies deleted successfully',
      deletedCount: result.changes
    });
  } catch (error) {
    console.error('Error deleting companies:', error);
    return NextResponse.json(
      { error: 'Failed to delete companies' },
      { status: 500 }
    );
  }
}
