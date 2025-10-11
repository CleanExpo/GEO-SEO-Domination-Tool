/**
 * GMB OAuth Callback Endpoint
 * Handles the OAuth callback from Google and exchanges code for tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { encryptToken } from '@/lib/integrations/token-encryption';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('GMB OAuth error:', error);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings/integrations?gmb_error=${encodeURIComponent(error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings/integrations?gmb_error=missing_parameters`
      );
    }

    // Decode state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings/integrations?gmb_error=invalid_state`
      );
    }

    const { user_id, company_id, organisation_id } = stateData;

    if (!user_id) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings/integrations?gmb_error=invalid_user`
      );
    }

    // Get OAuth credentials
    const clientId = process.env.GMB_CLIENT_ID;
    const clientSecret = process.env.GMB_CLIENT_SECRET;
    const redirectUri = process.env.GMB_REDIRECT_URI || 
      `${request.nextUrl.origin}/api/integrations/gmb/callback`;

    if (!clientId || !clientSecret) {
      console.error('GMB OAuth credentials not configured');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings/integrations?gmb_error=not_configured`
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings/integrations?gmb_error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token || !refresh_token) {
      console.error('Missing tokens in response');
      return NextResponse.redirect(
        `${request.nextUrl.origin}/settings/integrations?gmb_error=missing_tokens`
      );
    }

    // Fetch GMB account information
    let gmbAccountId, gmbAccountName, gmbLocations;
    try {
      const accountsResponse = await fetch(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        if (accountsData.accounts && accountsData.accounts.length > 0) {
          const account = accountsData.accounts[0];
          gmbAccountId = account.name;
          gmbAccountName = account.accountName || account.name;

          // Fetch locations for this account
          const locationsResponse = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${gmbAccountId}/locations`,
            {
              headers: { Authorization: `Bearer ${access_token}` },
            }
          );

          if (locationsResponse.ok) {
            const locationsData = await locationsResponse.json();
            gmbLocations = locationsData.locations || [];
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch GMB account info:', error);
      // Continue anyway - we can fetch this later
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(access_token);
    const encryptedRefreshToken = encryptToken(refresh_token);

    // Store in database
    const supabase = createAdminClient();
    
    // Check if integration already exists for this user
    const { data: existingIntegration } = await supabase
      .from('gmb_integrations')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (existingIntegration) {
      // Update existing integration
      const { error: updateError } = await supabase
        .from('gmb_integrations')
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          gmb_account_id: gmbAccountId,
          gmb_account_name: gmbAccountName,
          gmb_location_ids: gmbLocations?.map((loc: any) => loc.name) || [],
          gmb_locations: gmbLocations || [],
          status: 'active',
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntegration.id);

      if (updateError) {
        console.error('Failed to update integration:', updateError);
        return NextResponse.redirect(
          `${request.nextUrl.origin}/settings/integrations?gmb_error=database_error`
        );
      }
    } else {
      // Create new integration
      const { error: insertError } = await supabase
        .from('gmb_integrations')
        .insert({
          user_id,
          company_id: company_id || null,
          organisation_id: organisation_id || null,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          gmb_account_id: gmbAccountId,
          gmb_account_name: gmbAccountName,
          gmb_location_ids: gmbLocations?.map((loc: any) => loc.name) || [],
          gmb_locations: gmbLocations || [],
          status: 'active',
          last_sync_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Failed to create integration:', insertError);
        return NextResponse.redirect(
          `${request.nextUrl.origin}/settings/integrations?gmb_error=database_error`
        );
      }
    }

    // Success! Redirect back to integrations page
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings/integrations?gmb_success=true`
    );
  } catch (error) {
    console.error('GMB OAuth callback error:', error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings/integrations?gmb_error=unexpected_error`
    );
  }
}
