// CRM Dev Events Webhook Endpoint
// Sends development lifecycle events to LocalLift CRM

import { NextRequest, NextResponse } from 'next/server';

interface DevEvent {
  event: string;
  projectId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface CRMConfig {
  baseUrl: string;
  projectId: string;
  bearerToken?: string;
  events: {
    commit: boolean;
    branch: boolean;
    preview: boolean;
  };
}

/**
 * POST /api/v1/dev-events
 * Receives dev events and forwards to CRM
 */
export async function POST(request: NextRequest) {
  try {
    const event: DevEvent = await request.json();

    // Validate event structure
    if (!event.event || !event.projectId || !event.timestamp) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: event, projectId, timestamp' },
        { status: 400 }
      );
    }

    // Load CRM configuration
    const crmConfig = await loadCRMConfig();

    if (!crmConfig) {
      return NextResponse.json(
        { success: false, error: 'CRM integration not configured' },
        { status: 503 }
      );
    }

    // Check if this event type is enabled
    const eventType = event.event.split('.')[1]; // Extract from "dev.commit.new" -> "commit"
    if (eventType && crmConfig.events[eventType as keyof typeof crmConfig.events] === false) {
      return NextResponse.json(
        { success: true, message: 'Event type disabled in CRM config', forwarded: false },
        { status: 200 }
      );
    }

    // Forward to CRM
    const crmResponse = await forwardToCRM(crmConfig, event);

    if (!crmResponse.success) {
      console.error('❌ Failed to forward event to CRM:', crmResponse.error);
      return NextResponse.json(
        { success: false, error: crmResponse.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Event forwarded to CRM',
      forwarded: true,
      crmResponse: crmResponse.data
    });
  } catch (error: any) {
    console.error('❌ Error processing dev event:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/dev-events
 * Health check endpoint
 */
export async function GET() {
  const crmConfig = await loadCRMConfig();

  return NextResponse.json({
    status: 'operational',
    crmIntegration: {
      enabled: !!crmConfig,
      baseUrl: crmConfig?.baseUrl || null,
      projectId: crmConfig?.projectId || null,
      authenticated: !!crmConfig?.bearerToken,
      enabledEvents: crmConfig?.events || {}
    }
  });
}

/**
 * Load CRM configuration from file or environment
 */
async function loadCRMConfig(): Promise<CRMConfig | null> {
  try {
    // Try to load from config file
    const fs = await import('fs');
    const path = await import('path');
    const configPath = path.join(process.cwd(), 'config', 'crm-integration.json');

    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent) as CRMConfig;

      // Override bearer token from environment if available
      if (process.env.LOCALLIFT_API_KEY) {
        config.bearerToken = process.env.LOCALLIFT_API_KEY;
      }

      return config;
    }

    // Fallback to environment variables
    if (process.env.LOCALLIFT_BASE_URL && process.env.LOCALLIFT_PROJECT_ID) {
      return {
        baseUrl: process.env.LOCALLIFT_BASE_URL,
        projectId: process.env.LOCALLIFT_PROJECT_ID,
        bearerToken: process.env.LOCALLIFT_API_KEY,
        events: {
          commit: true,
          branch: true,
          preview: true
        }
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to load CRM config:', error);
    return null;
  }
}

/**
 * Forward event to CRM API
 */
async function forwardToCRM(
  config: CRMConfig,
  event: DevEvent
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Check if bearer token is available
    if (!config.bearerToken) {
      return {
        success: false,
        error: 'CRM bearer token not configured (LOCALLIFT_API_KEY)'
      };
    }

    // Send event to CRM
    const response = await fetch(`${config.baseUrl}/api/v1/dev-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `CRM API returned ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();

    return {
      success: true,
      data
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
