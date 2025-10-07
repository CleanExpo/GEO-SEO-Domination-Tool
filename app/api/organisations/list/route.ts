/**
 * API Route: List User's Organisations
 * Returns all organisations the current user belongs to
 *
 * Ticket: TENANT-001
 * Author: Orchestra-Coordinator (Agent-Tenancy)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserOrganisations } from '@/lib/tenant-context';

export async function GET(req: NextRequest) {
  try {
    const organisations = await getUserOrganisations();

    return NextResponse.json({
      organisations,
      count: organisations.length
    });
  } catch (error) {
    console.error('Failed to fetch organisations:', error);
    return NextResponse.json(
      { error: 'Unauthorised or failed to fetch organisations' },
      { status: 401 }
    );
  }
}
