/**
 * Content Calendar API Endpoint
 *
 * POST /api/crm/calendar - Generate content calendar
 * GET /api/crm/calendar?portfolioId={id} - Get scheduled posts
 * PATCH /api/crm/calendar/{id} - Update scheduled post
 * DELETE /api/crm/calendar/{id} - Delete scheduled post
 * POST /api/crm/calendar/process - Process due posts (called by cron)
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentCalendarAgent, CalendarRequest, ScheduledPost } from '@/services/agents/content-calendar-agent';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

// ============================================================================
// POST - Generate Content Calendar
// ============================================================================

export async function POST(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const body = await request.json();

    // Check if this is a process request
    if (body.action === 'process') {
      await contentCalendarAgent.processDuePosts();
      return NextResponse.json({
        success: true,
        message: 'Due posts processed successfully'
      });
    }

    // Validate calendar request
    const calendarRequest: CalendarRequest = {
      portfolioId: body.portfolioId,
      startDate: body.startDate,
      endDate: body.endDate,
      platforms: body.platforms || [],
      contentMix: body.contentMix,
      autoGenerate: body.autoGenerate || false,
      frequency: body.frequency || 'weekly'
    };

    if (!calendarRequest.portfolioId) {
      return NextResponse.json(
        { success: false, error: 'portfolioId is required' },
        { status: 400 }
      );
    }

    if (!calendarRequest.startDate || !calendarRequest.endDate) {
      return NextResponse.json(
        { success: false, error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    if (!calendarRequest.platforms || calendarRequest.platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one platform is required' },
        { status: 400 }
      );
    }

    // Verify portfolio exists
    const portfolio = db.prepare('SELECT * FROM company_portfolios WHERE id = ?').get(calendarRequest.portfolioId);
    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Generate calendar
    const report = await contentCalendarAgent.generateCalendar(calendarRequest);

    // Log autonomous action
    if (report.success) {
      db.prepare(`
        INSERT INTO autonomous_actions (
          portfolio_id, action_type, agent_name, description,
          input_data, output_data, status, cost, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        calendarRequest.portfolioId,
        'calendar_generation',
        'content-calendar-agent',
        `Generated ${report.totalPosts} scheduled posts across ${calendarRequest.platforms.length} platforms`,
        JSON.stringify(calendarRequest),
        JSON.stringify({
          totalPosts: report.totalPosts,
          breakdown: report.breakdown,
          platformDistribution: report.platformDistribution
        }),
        'success',
        report.estimatedCost
      );
    }

    return NextResponse.json(report);

  } catch (error: any) {
    console.error('[Calendar API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}

// ============================================================================
// GET - Retrieve Scheduled Posts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const status = searchParams.get('status') || undefined;
    const postId = searchParams.get('id');

    if (!portfolioId && !postId) {
      return NextResponse.json(
        { success: false, error: 'portfolioId or id is required' },
        { status: 400 }
      );
    }

    if (postId) {
      // Get single post
      const db = new Database(dbPath);
      try {
        const post = db.prepare('SELECT * FROM scheduled_posts WHERE id = ?').get(postId) as any;
        if (!post) {
          return NextResponse.json(
            { success: false, error: 'Post not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          post: {
            ...post,
            platforms: JSON.parse(post.platforms || '[]')
          }
        });
      } finally {
        db.close();
      }
    }

    // Get posts for portfolio
    const posts = contentCalendarAgent.getScheduledPosts(portfolioId!, status);

    return NextResponse.json({
      success: true,
      posts,
      count: posts.length
    });

  } catch (error: any) {
    console.error('[Calendar API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Scheduled Post
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = body.id;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const updates: Partial<ScheduledPost> = {};
    if (body.scheduledFor) updates.scheduledFor = body.scheduledFor;
    if (body.topic) updates.topic = body.topic;
    if (body.contentType) updates.contentType = body.contentType;
    if (body.platforms) updates.platforms = body.platforms;
    if (body.status) updates.status = body.status;

    const updated = contentCalendarAgent.updateScheduledPost(postId, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Post not found or no changes made' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully'
    });

  } catch (error: any) {
    console.error('[Calendar API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Scheduled Post
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const deleted = contentCalendarAgent.deleteScheduledPost(parseInt(postId));

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error: any) {
    console.error('[Calendar API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
