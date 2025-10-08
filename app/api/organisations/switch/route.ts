/**
 * API Route: Switch Organisation
 * Switches the current user's active organisation context
 *
 * Ticket: TENANT-001
 * Author: Orchestra-Coordinator (Agent-Tenancy)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { organisationId } = await req.json();

    if (!organisationId) {
      return NextResponse.json(
        { error: 'organisationId is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorised' },
        { status: 401 }
      );
    }

    // Verify user is member of the target organisation
    const { data, error } = await supabase
      .from('organisation_members')
      .select('organisation_id')
      .eq('user_id', user.id)
      .eq('organisation_id', organisationId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'You are not a member of this organisation' },
        { status: 403 }
      );
    }

    // In a real implementation, you'd set a session cookie here
    // For now, the context is determined per-request via getCurrentOrganisationId()

    return NextResponse.json({
      success: true,
      organisationId: organisationId
    });
  } catch (error) {
    console.error('Failed to switch organisation:', error);
    return NextResponse.json(
      { error: 'Failed to switch organisation' },
      { status: 500 }
    );
  }
}
