/**
 * API Route: Notification Preferences
 * GET/PUT /api/notifications/preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationPreferences } from '@/services/notifications/notification-types';
import { createEmailService } from '@/services/notifications/email-service';
import { getDatabase } from '@/lib/db';

/**
 * GET - Fetch notification preferences for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email or userId parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const query = email
      ? 'SELECT * FROM notification_preferences WHERE email = ?'
      : 'SELECT * FROM notification_preferences WHERE user_id = ?';

    const row = await db.get(query, [email || userId]);

    if (!row) {
      // Return default preferences if none found
      const defaultPreferences: NotificationPreferences = {
        userId: userId || undefined,
        email: email || '',
        enabled: true,
        channels: {
          email: true,
          sms: false,
          push: false,
          inApp: true,
        },
        types: {
          weekly_report: true,
          ranking_alert: true,
          audit_complete: true,
          system_notification: true,
          keyword_ranking_change: true,
          competitor_alert: true,
          citation_issue: true,
          scheduled_report: true,
        },
        frequency: {
          weekly_report: 'weekly',
          ranking_alert: 'immediate',
          audit_complete: 'immediate',
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'America/New_York',
        },
      };

      return NextResponse.json({
        success: true,
        preferences: defaultPreferences,
        isDefault: true,
      });
    }

    const preferences: NotificationPreferences = {
      userId: row.user_id,
      email: row.email,
      enabled: Boolean(row.enabled),
      channels: JSON.parse(row.channels),
      types: JSON.parse(row.types),
      frequency: JSON.parse(row.frequency),
      quietHours: row.quiet_hours ? JSON.parse(row.quiet_hours) : undefined,
      unsubscribeToken: row.unsubscribe_token,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };

    return NextResponse.json({
      success: true,
      preferences,
      isDefault: false,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const emailService = createEmailService(db);

    // Check if preferences exist
    const existing = await db.get(
      'SELECT * FROM notification_preferences WHERE email = ?',
      [body.email]
    );

    const preferences: NotificationPreferences = {
      userId: body.userId,
      email: body.email,
      enabled: body.enabled !== undefined ? body.enabled : true,
      channels: body.channels || {
        email: true,
        sms: false,
        push: false,
        inApp: true,
      },
      types: body.types || {
        weekly_report: true,
        ranking_alert: true,
        audit_complete: true,
        system_notification: true,
        keyword_ranking_change: true,
        competitor_alert: true,
        citation_issue: true,
        scheduled_report: true,
      },
      frequency: body.frequency || {
        weekly_report: 'weekly',
        ranking_alert: 'immediate',
        audit_complete: 'immediate',
      },
      quietHours: body.quietHours,
      unsubscribeToken: existing?.unsubscribe_token || emailService.generateUnsubscribeToken(body.email),
    };

    if (existing) {
      // Update existing preferences
      await db.run(
        `UPDATE notification_preferences
         SET user_id = ?, enabled = ?, channels = ?, types = ?, frequency = ?,
             quiet_hours = ?, updated_at = datetime('now')
         WHERE email = ?`,
        [
          preferences.userId,
          preferences.enabled ? 1 : 0,
          JSON.stringify(preferences.channels),
          JSON.stringify(preferences.types),
          JSON.stringify(preferences.frequency),
          preferences.quietHours ? JSON.stringify(preferences.quietHours) : null,
          preferences.email,
        ]
      );
    } else {
      // Insert new preferences
      await db.run(
        `INSERT INTO notification_preferences
         (user_id, email, enabled, channels, types, frequency, quiet_hours, unsubscribe_token, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          preferences.userId,
          preferences.email,
          preferences.enabled ? 1 : 0,
          JSON.stringify(preferences.channels),
          JSON.stringify(preferences.types),
          JSON.stringify(preferences.frequency),
          preferences.quietHours ? JSON.stringify(preferences.quietHours) : null,
          preferences.unsubscribeToken,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);

    return NextResponse.json(
      {
        error: 'Failed to update notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete/Unsubscribe from notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email && !token) {
      return NextResponse.json(
        { error: 'Email or unsubscribe token is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    let targetEmail = email;

    // If token provided, verify and extract email
    if (token) {
      const emailService = createEmailService(db);
      const tokenData = emailService.verifyUnsubscribeToken(token);

      if (!tokenData) {
        return NextResponse.json(
          { error: 'Invalid or expired unsubscribe token' },
          { status: 400 }
        );
      }

      targetEmail = tokenData.email;
    }

    // Disable all notifications for this email
    await db.run(
      `UPDATE notification_preferences
       SET enabled = 0, updated_at = datetime('now')
       WHERE email = ?`,
      [targetEmail]
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from all notifications',
      email: targetEmail,
    });
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);

    return NextResponse.json(
      {
        error: 'Failed to unsubscribe',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
