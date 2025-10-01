/**
 * API Route: Send Notification
 * POST /api/notifications/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEmailService } from '@/services/notifications/email-service';
import { Notification } from '@/services/notifications/notification-types';
import { getDatabase } from '@/lib/db';

/**
 * POST - Send a notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.recipientEmail || !body.subject) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipientEmail, subject' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = [
      'weekly_report',
      'ranking_alert',
      'audit_complete',
      'system_notification',
      'keyword_ranking_change',
      'competitor_alert',
      'citation_issue',
      'scheduled_report',
    ];

    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Construct notification object
    const notification: Notification = {
      id: body.id,
      type: body.type,
      priority: body.priority || 'medium',
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      subject: body.subject,
      data: body.data,
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    };

    // Initialize database connection
    const db = await getDatabase();
    await db.initialize();

    // Create email service
    const emailService = createEmailService(db);

    // Send notification
    const result = await emailService.sendNotification(notification);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Notification sent successfully',
      });
    } else {
      // If queued, return 202 Accepted
      if (result.error?.includes('queued')) {
        return NextResponse.json(
          {
            success: false,
            queued: true,
            message: 'Notification queued for retry',
            error: result.error,
          },
          { status: 202 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          retryable: result.retryable,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send notification API:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get notification queue status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    await db.initialize();

    // Get queue statistics
    const stats = await db.queryOne(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM notification_queue
      WHERE created_at >= datetime('now', '-7 days')
    `);

    return NextResponse.json({
      success: true,
      stats: {
        total: stats?.total || 0,
        pending: stats?.pending || 0,
        queued: stats?.queued || 0,
        sent: stats?.sent || 0,
        failed: stats?.failed || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch queue statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
