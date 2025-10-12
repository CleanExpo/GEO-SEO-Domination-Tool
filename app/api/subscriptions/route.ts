/**
 * Subscription Management API
 *
 * GET /api/subscriptions?clientId={id}
 * Returns current subscription details and tier access
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

export async function GET(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'clientId required' },
        { status: 400 }
      );
    }

    // Get subscription details
    const subscription = db.prepare(`
      SELECT
        s.id,
        s.tier,
        s.billing_cycle,
        s.status,
        s.current_period_start,
        s.current_period_end,
        s.cancel_at_period_end,
        s.canceled_at,
        s.created_at
      FROM subscriptions s
      WHERE s.client_id = ?
      ORDER BY s.created_at DESC
      LIMIT 1
    `).get(clientId) as any;

    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null,
        tierAccess: null,
        message: 'No subscription found'
      });
    }

    // Get tier access
    const tierAccess = db.prepare(`
      SELECT
        tier,
        features,
        automation_level,
        approval_required,
        granted_at,
        expires_at
      FROM tier_access
      WHERE client_id = ?
    `).get(clientId) as any;

    // Get payment history
    const payments = db.prepare(`
      SELECT
        id,
        amount,
        currency,
        status,
        paid_at,
        created_at
      FROM payments
      WHERE client_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(clientId) as any[];

    // Get usage stats
    const usage = db.prepare(`
      SELECT
        metric_type,
        metric_value,
        limit_value,
        period_start,
        period_end
      FROM usage_tracking
      WHERE client_id = ?
      AND period_end >= datetime('now')
    `).all(clientId) as any[];

    // Calculate days remaining in billing cycle
    const periodEnd = new Date(subscription.current_period_end);
    const now = new Date();
    const daysRemaining = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Parse features
    const features = tierAccess ? JSON.parse(tierAccess.features) : {};

    // Format usage data
    const usageFormatted = usage.reduce((acc: any, u: any) => {
      acc[u.metric_type] = {
        used: u.metric_value,
        limit: u.limit_value,
        unlimited: u.limit_value === null || u.limit_value === -1,
        percentage: u.limit_value > 0 ? Math.round((u.metric_value / u.limit_value) * 100) : 0
      };
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        billingCycle: subscription.billing_cycle,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        daysRemaining,
        cancelAtPeriodEnd: subscription.cancel_at_period_end === 1,
        canceledAt: subscription.canceled_at,
        createdAt: subscription.created_at
      },
      tierAccess: tierAccess ? {
        tier: tierAccess.tier,
        features,
        automationLevel: tierAccess.automation_level,
        approvalRequired: tierAccess.approval_required === 1,
        grantedAt: tierAccess.granted_at,
        expiresAt: tierAccess.expires_at
      } : null,
      usage: usageFormatted,
      paymentHistory: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paidAt: p.paid_at,
        createdAt: p.created_at
      }))
    });

  } catch (error: any) {
    console.error('[Subscriptions API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    db.close();
  }
}
