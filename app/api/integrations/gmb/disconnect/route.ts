/**
 * GMB Integration Disconnect Endpoint
 * Removes GMB integration for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase-server';
import { createAdminClient } from '@/lib/auth/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete integration from database
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('gmb_integrations')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to disconnect GMB:', error);
      return NextResponse.json(
        { error: 'Failed to disconnect integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'GMB integration disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting GMB:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
