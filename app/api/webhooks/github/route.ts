/**
 * API Route: GitHub Webhooks Handler
 * POST /api/webhooks/github - Process GitHub webhook events
 * Handles: push, pull_request, issues, release events
 * Phase 3: WEBHOOK-001
 */

import { NextRequest, NextResponse } from 'next/server';
import { GitHubSyncService } from '@/services/github-sync';

const githubSync = new GitHubSyncService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// WEBHOOK HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    // Get webhook event type
    const eventType = request.headers.get('x-github-event');
    const signature = request.headers.get('x-hub-signature-256');
    const deliveryId = request.headers.get('x-github-delivery');

    if (!eventType) {
      return NextResponse.json({ error: 'Missing X-GitHub-Event header' }, { status: 400 });
    }

    // Parse payload
    const payload = await request.json();
    const payloadString = JSON.stringify(payload);

    // Verify signature (if webhook secret is configured)
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = githubSync.verifyWebhookSignature(payloadString, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Log webhook event
    console.log(`Received GitHub webhook: ${eventType} (delivery: ${deliveryId})`);

    // Route to appropriate handler
    switch (eventType) {
      case 'push':
        await githubSync.handlePushEvent(payload);
        break;

      case 'pull_request':
        await githubSync.handlePullRequestEvent(payload);
        break;

      case 'issues':
        await githubSync.handleIssuesEvent(payload);
        break;

      case 'release':
        await githubSync.handleReleaseEvent(payload);
        break;

      case 'ping':
        return NextResponse.json({ message: 'Pong! Webhook configured successfully' }, { status: 200 });

      default:
        console.log(`Unhandled event type: ${eventType}`);
        return NextResponse.json({ message: `Event type ${eventType} not handled` }, { status: 200 });
    }

    return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing GitHub webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
