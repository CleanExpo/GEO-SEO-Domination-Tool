/**
 * GMB Integration Status Endpoint
 * Get current GMB integration status for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase-server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get integration from database
    const supabase = createAdminClient();
    const { data: integration, error } = await supabase
      .from('gmb_integrations')
      .select('id, status, gmb_account_name, gmb_location_ids, gmb_locations, last_sync_at, last_error, created_at')
      .eq('user_id', user.id)
      .single();

    if (error || !integration) {
      return NextResponse.json({
        connected: false,
        integration: null,
      });
    }

    return NextResponse.json({
      connected: true,
      integration: {
        id: integration.id,
        status: integration.status,
        account_name: integration.gmb_account_name,
        location_count: integration.gmb_location_ids?.length || 0,
        locations: integration.gmb_locations || [],
        last_sync: integration.last_sync_at,
        last_error: integration.last_error,
        connected_at: integration.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching GMB status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration status' },
      { status: 500 }
    );
  }
}
