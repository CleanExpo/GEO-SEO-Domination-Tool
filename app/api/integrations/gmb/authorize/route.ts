/**
 * GMB OAuth Authorization Endpoint
 * Initiates the OAuth flow by redirecting to Google
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in first' },
        { status: 401 }
      );
    }

    // Get OAuth credentials from environment
    const clientId = process.env.GMB_CLIENT_ID;
    const redirectUri = process.env.GMB_REDIRECT_URI || 
      `${request.nextUrl.origin}/api/integrations/gmb/callback`;

    if (!clientId) {
      console.error('GMB_CLIENT_ID not configured');
      return NextResponse.json(
        { error: 'GMB OAuth not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Get optional parameters
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    const organisationId = searchParams.get('organisation_id');

    // Build state parameter (contains user context)
    const state = Buffer.from(
      JSON.stringify({
        user_id: user.id,
        company_id: companyId,
        organisation_id: organisationId,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Build Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/business.manage');
    authUrl.searchParams.set('access_type', 'offline'); // Get refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
    authUrl.searchParams.set('state', state);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('GMB OAuth authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
