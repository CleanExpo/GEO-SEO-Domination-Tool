/**
 * GitHub Webhook Handler
 *
 * Ticket: GITHUB-001
 * Author: Orchestra-Coordinator (Agent-Octo)
 * Date: 2025-10-05
 *
 * Handles GitHub webhook events:
 * - push: Repository push events
 * - pull_request: PR opened/closed/merged
 * - issues: Issue opened/closed
 * - release: Release published
 *
 * Security: HMAC SHA-256 signature verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { GitHubConnectorV2 } from '@/services/api/github-enhanced';
import crypto from 'crypto';

/**
 * Verify webhook signature using HMAC SHA-256
 */
function verifySignature(signature: string | null, body: string): boolean {
  if (!signature) {
    console.error('[GitHub Webhook] No signature provided');
    return false;
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[GitHub Webhook] GITHUB_WEBHOOK_SECRET not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(body).digest('hex')}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error('[GitHub Webhook] Signature verification failed:', error);
    return false;
  }
}

/**
 * Log webhook delivery for auditing
 */
async function logWebhookDelivery(
  deliveryId: string,
  eventType: string,
  payload: any,
  status: 'processing' | 'success' | 'failed'
) {
  // In production, store in database (github_webhook_deliveries table)
  console.log(`[GitHub Webhook] ${deliveryId} | ${eventType} | ${status}`, {
    deliveryId,
    eventType,
    status,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle push events
 */
async function handlePushEvent(event: any) {
  const { ref, repository, commits } = event;

  console.log(`[GitHub Webhook] Push to ${repository.full_name} (${ref})`);
  console.log(`[GitHub Webhook] ${commits.length} commits`);

  // TODO: Update repository metadata in database
  // TODO: Create CRM notification for team

  return { message: 'Push event processed', commits: commits.length };
}

/**
 * Handle pull request events
 */
async function handlePullRequestEvent(event: any) {
  const { action, pull_request, repository } = event;

  console.log(
    `[GitHub Webhook] PR #${pull_request.number} ${action} in ${repository.full_name}`
  );
  console.log(`[GitHub Webhook] PR Title: ${pull_request.title}`);

  if (action === 'opened') {
    // TODO: Create CRM task for PR review
    // Example: INSERT INTO crm_tasks (title, description, status, due_date)
    console.log('[GitHub Webhook] TODO: Create CRM task for PR review');
  }

  if (action === 'closed' && pull_request.merged) {
    // PR was merged
    console.log('[GitHub Webhook] PR merged successfully');
  }

  return { message: `PR ${action} processed`, prNumber: pull_request.number };
}

/**
 * Handle issue events
 */
async function handleIssueEvent(event: any) {
  const { action, issue, repository } = event;

  console.log(
    `[GitHub Webhook] Issue #${issue.number} ${action} in ${repository.full_name}`
  );
  console.log(`[GitHub Webhook] Issue Title: ${issue.title}`);

  // TODO: Sync issue to CRM or project management

  return { message: `Issue ${action} processed`, issueNumber: issue.number };
}

/**
 * Handle release events
 */
async function handleReleaseEvent(event: any) {
  const { action, release, repository } = event;

  console.log(
    `[GitHub Webhook] Release ${release.tag_name} ${action} in ${repository.full_name}`
  );

  // TODO: Create release notification

  return { message: `Release ${action} processed`, tag: release.tag_name };
}

/**
 * POST /api/webhooks/github
 * GitHub webhook endpoint
 */
export async function POST(req: NextRequest) {
  try {
    // Get headers
    const signature = req.headers.get('x-hub-signature-256');
    const deliveryId = req.headers.get('x-github-delivery') || 'unknown';
    const eventType = req.headers.get('x-github-event');

    // Read raw body for signature verification
    const body = await req.text();

    // Verify signature
    if (!verifySignature(signature, body)) {
      console.error(`[GitHub Webhook] Invalid signature for delivery ${deliveryId}`);
      await logWebhookDelivery(deliveryId, eventType || 'unknown', {}, 'failed');

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Parse JSON payload
    const event = JSON.parse(body);

    // Log delivery start
    await logWebhookDelivery(deliveryId, eventType || 'unknown', event, 'processing');

    let result;

    // Route to appropriate handler
    switch (eventType) {
      case 'push':
        result = await handlePushEvent(event);
        break;

      case 'pull_request':
        result = await handlePullRequestEvent(event);
        break;

      case 'issues':
        result = await handleIssueEvent(event);
        break;

      case 'release':
        result = await handleReleaseEvent(event);
        break;

      default:
        console.log(`[GitHub Webhook] Unhandled event type: ${eventType}`);
        result = { message: 'Event type not handled' };
    }

    // Log success
    await logWebhookDelivery(deliveryId, eventType || 'unknown', event, 'success');

    return NextResponse.json({
      ok: true,
      deliveryId,
      eventType,
      ...result,
    });
  } catch (error) {
    console.error('[GitHub Webhook] Processing failed:', error);

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/github
 * Health check endpoint
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    service: 'GitHub Webhook Handler',
    timestamp: new Date().toISOString(),
    message: 'Webhook endpoint is active',
  });
}
