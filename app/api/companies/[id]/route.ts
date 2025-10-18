import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { z } from 'zod';

const companyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  industry: z.string().optional(),
  services: z.array(z.string()).optional(),
  description: z.string().optional(),
  gbp_url: z.string().url().optional(),
  social_profiles: z.record(z.string()).optional(),
});

// GET /api/companies/[id] - Get a single company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDatabase();
    const { id } = await params;

    const company = await db.get('SELECT * FROM companies WHERE id = ?', [id]);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse JSON fields
    if (company.services && typeof company.services === 'string') {
      company.services = JSON.parse(company.services);
    }
    if (company.social_profiles && typeof company.social_profiles === 'string') {
      company.social_profiles = JSON.parse(company.social_profiles);
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Update a company
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDatabase();
    const { id } = await params;
    const body = await request.json();
    const validatedData = companyUpdateSchema.parse(body);

    // Build dynamic UPDATE query
    const fields = Object.keys(validatedData);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = validatedData[field as keyof typeof validatedData];
      // Stringify arrays and objects for JSON fields
      if (field === 'services' || field === 'social_profiles') {
        return JSON.stringify(value);
      }
      return value;
    });

    const sql = `UPDATE companies SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await db.run(sql, [...values, id]);

    // Fetch updated company
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [id]);

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Parse JSON fields
    if (company.services && typeof company.services === 'string') {
      company.services = JSON.parse(company.services);
    }
    if (company.social_profiles && typeof company.social_profiles === 'string') {
      company.social_profiles = JSON.parse(company.social_profiles);
    }

    return NextResponse.json({ company });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}

// DELETE /api/companies/[id] - Delete a company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = getDatabase();
    const { id } = await params;

    // Check if company exists
    const company = await db.get('SELECT id FROM companies WHERE id = ?', [id]);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Delete company (CASCADE will delete related records)
    await db.run('DELETE FROM companies WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
