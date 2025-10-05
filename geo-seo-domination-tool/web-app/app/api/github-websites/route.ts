import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { githubEditorService } from '@/services/github/github-editor-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's GitHub connections
    const { data: connections, error } = await supabase
      .from('github_website_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch GitHub connections:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('GitHub connections API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'connect') {
      // Connect new repository
      const {
        repo_owner,
        repo_name,
        branch = 'main',
        access_token,
        deployment_platform = 'vercel',
        site_url,
        company_id,
      } = body;

      if (!repo_owner || !repo_name || !access_token || !site_url) {
        return NextResponse.json(
          { error: 'Missing required fields: repo_owner, repo_name, access_token, site_url' },
          { status: 400 }
        );
      }

      // Test connection first
      const testConnection = {
        id: '',
        user_id: user.id,
        company_id: company_id || null,
        repo_owner,
        repo_name,
        branch,
        access_token,
        deployment_platform,
        site_url,
      };

      const isValid = await githubEditorService.testConnection(testConnection as any);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Failed to connect to repository. Check access token and repository name.' },
          { status: 400 }
        );
      }

      // Get repository info to detect framework
      const repoInfo = await githubEditorService.getRepoInfo(testConnection as any);

      // Detect framework by checking package.json
      let framework = 'unknown';
      let router_type = null;

      try {
        const packageJson = await githubEditorService.getFileContent(
          testConnection as any,
          'package.json'
        );

        const pkg = JSON.parse(packageJson.content);

        if (pkg.dependencies?.next || pkg.devDependencies?.next) {
          framework = 'nextjs';

          // Detect Next.js router type
          const hasAppDir = await githubEditorService.getFileContent(
            testConnection as any,
            'app/layout.tsx'
          ).catch(() => null);

          router_type = hasAppDir ? 'app_router' : 'pages_router';
        } else if (pkg.dependencies?.gatsby) {
          framework = 'gatsby';
        } else if (pkg.dependencies?.react) {
          framework = 'react';
        }
      } catch (error) {
        console.log('Could not detect framework:', error);
      }

      // Save connection to database
      const { data: connection, error: insertError } = await supabase
        .from('github_website_connections')
        .insert([
          {
            user_id: user.id,
            company_id: company_id || null,
            repo_owner,
            repo_name,
            branch,
            access_token, // TODO: Encrypt this in production
            deployment_platform,
            site_url,
            framework,
            router_type,
            status: 'active',
            last_tested_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Failed to save connection:', insertError);
        return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        connection,
        message: 'Repository connected successfully',
      });
    } else if (action === 'test') {
      // Test existing connection
      const { connection_id } = body;

      if (!connection_id) {
        return NextResponse.json({ error: 'Missing connection_id' }, { status: 400 });
      }

      // Get connection
      const { data: connection, error } = await supabase
        .from('github_website_connections')
        .select('*')
        .eq('id', connection_id)
        .eq('user_id', user.id)
        .single();

      if (error || !connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      }

      // Test connection
      const isValid = await githubEditorService.testConnection(connection as any);

      if (isValid) {
        // Update last_tested_at
        await supabase
          .from('github_website_connections')
          .update({
            status: 'active',
            last_tested_at: new Date().toISOString(),
            connection_error: null,
          })
          .eq('id', connection_id);

        return NextResponse.json({
          success: true,
          message: 'Connection test successful',
        });
      } else {
        // Update status to error
        await supabase
          .from('github_website_connections')
          .update({
            status: 'error',
            connection_error: 'Failed to access repository',
          })
          .eq('id', connection_id);

        return NextResponse.json({
          success: false,
          error: 'Failed to connect to repository. Check access token.',
        }, { status: 400 });
      }
    } else if (action === 'sync') {
      // Sync repository information (get pages, detect changes, etc.)
      const { connection_id } = body;

      if (!connection_id) {
        return NextResponse.json({ error: 'Missing connection_id' }, { status: 400 });
      }

      // Get connection
      const { data: connection, error } = await supabase
        .from('github_website_connections')
        .select('*')
        .eq('id', connection_id)
        .eq('user_id', user.id)
        .single();

      if (error || !connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
      }

      // Get all pages in repository
      const pages = await githubEditorService.getNextJsPages(connection as any);

      // Update last_sync_at
      await supabase
        .from('github_website_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection_id);

      return NextResponse.json({
        success: true,
        pages,
        message: `Found ${pages.length} pages`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('GitHub websites API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get connection_id from URL
    const url = new URL(request.url);
    const connection_id = url.pathname.split('/').pop();

    if (!connection_id) {
      return NextResponse.json({ error: 'Missing connection_id' }, { status: 400 });
    }

    // Delete connection
    const { error } = await supabase
      .from('github_website_connections')
      .delete()
      .eq('id', connection_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete connection:', error);
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Connection deleted successfully',
    });
  } catch (error) {
    console.error('GitHub websites DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
