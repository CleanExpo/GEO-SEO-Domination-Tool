import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { searchConsoleService } from '@/services/google/search-console-service';

// GET /api/gsc - List connected GSC sites
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: connections, error } = await supabase
      .from('gsc_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ connections });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch GSC connections' },
      { status: 500 }
    );
  }
}

// POST /api/gsc - Connect new GSC site or sync rankings
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, site_url, access_token, company_id } = body;

    if (action === 'connect') {
      // Connect new GSC site
      if (!site_url || !access_token) {
        return NextResponse.json(
          { error: 'site_url and access_token are required' },
          { status: 400 }
        );
      }

      // Verify access to the site
      const hasAccess = await searchConsoleService.verifySiteAccess(site_url, access_token);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Cannot access this site. Please verify ownership in Google Search Console.' },
          { status: 403 }
        );
      }

      // Get site permission level
      const sites = await searchConsoleService.listSites(access_token);
      const siteInfo = sites.find(s => s.siteUrl === site_url);

      // Save connection
      const { data: connection, error } = await supabase
        .from('gsc_connections')
        .insert([
          {
            user_id: user.id,
            company_id: company_id || null,
            site_url,
            access_token, // In production, encrypt this!
            permission_level: siteInfo?.permissionLevel || 'unknown',
            status: 'active',
            last_synced_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return NextResponse.json(
            { error: 'This site is already connected' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ connection }, { status: 201 });
    }

    if (action === 'sync') {
      // Sync rankings for existing connection
      const { connection_id } = body;

      if (!connection_id) {
        return NextResponse.json(
          { error: 'connection_id is required' },
          { status: 400 }
        );
      }

      // Get connection
      const { data: connection, error: connError } = await supabase
        .from('gsc_connections')
        .select('*')
        .eq('id', connection_id)
        .eq('user_id', user.id)
        .single();

      if (connError || !connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      }

      // Fetch rankings from Google
      const rankings = await searchConsoleService.getRankings(
        connection.site_url,
        connection.access_token,
        {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['query', 'page', 'country', 'device'],
          rowLimit: 25000,
        }
      );

      // Save to database
      const today = new Date().toISOString().split('T')[0];
      const rankingInserts = rankings.map(rank => ({
        user_id: user.id,
        company_id: connection.company_id,
        gsc_connection_id: connection.id,
        keyword: rank.keyword,
        page_url: rank.page,
        country: rank.country || 'aus',
        device: rank.device || 'mobile',
        position: rank.position,
        clicks: rank.clicks,
        impressions: rank.impressions,
        ctr: rank.ctr,
        check_date: today,
      }));

      // Bulk insert (use upsert to avoid duplicates)
      const { error: insertError } = await supabase
        .from('gsc_rankings')
        .upsert(rankingInserts, {
          onConflict: 'gsc_connection_id,keyword,page_url,country,device,check_date',
        });

      if (insertError) {
        console.error('Failed to save GSC rankings:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      // Update last_synced_at
      await supabase
        .from('gsc_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', connection.id);

      return NextResponse.json({
        message: 'Rankings synced successfully',
        count: rankings.length,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "connect" or "sync"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('GSC API error:', error);
    return NextResponse.json(
      { error: `Failed to process GSC request: ${error}` },
      { status: 500 }
    );
  }
}
