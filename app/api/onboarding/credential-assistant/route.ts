/**
 * Credential Assistant API - Powered by Qwen3
 *
 * Helps clients find their credentials with platform-specific guidance
 * Uses cascading AI (Qwen → Claude) for cost optimization
 */

import { NextResponse } from 'next/server';
import { CascadingAI } from '@/services/api/cascading-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AssistantRequest {
  userQuery: string;
  platform?: string;
  hostingProvider?: string;
  context?: {
    businessType?: string;
    websiteUrl?: string;
    detectedPlatform?: string;
  };
}

interface AssistantResponse {
  message: string;
  steps?: Array<{
    step: number;
    action: string;
    url?: string;
    screenshot?: string;
  }>;
  videoTutorial?: {
    title: string;
    url: string;
    timestamp?: string; // e.g., "2:30" to start at specific time
  };
  autofillSuggestions?: Record<string, string>;
  estimatedTime?: string;
  model: string;
  cost: number;
}

// YouTube video library for credential tutorials
const VIDEO_LIBRARY: Record<string, { title: string; url: string; timestamp?: string }> = {
  // WordPress
  'wordpress-cpanel': {
    title: 'How to Find WordPress Login in cPanel',
    url: 'https://www.youtube.com/watch?v=ABCdef12345', // Replace with real video
    timestamp: '1:45'
  },
  'wordpress-admin': {
    title: 'WordPress Admin Dashboard Tour',
    url: 'https://www.youtube.com/watch?v=XYZabc67890',
  },

  // Facebook
  'facebook-business-id': {
    title: 'How to Find Your Facebook Business ID',
    url: 'https://www.youtube.com/watch?v=FB12345',
    timestamp: '0:30'
  },
  'facebook-access-token': {
    title: 'Generate Facebook Page Access Token',
    url: 'https://www.youtube.com/watch?v=FB67890',
    timestamp: '2:15'
  },

  // Google Business Profile
  'google-business-profile': {
    title: 'Google Business Profile Setup Complete Guide',
    url: 'https://www.youtube.com/watch?v=GBP12345',
  },
  'google-location-id': {
    title: 'Find Your Google Business Location ID',
    url: 'https://www.youtube.com/watch?v=GBP67890',
    timestamp: '1:00'
  },

  // Hosting Providers
  'cpanel-login': {
    title: 'How to Access cPanel - All Hosting Providers',
    url: 'https://www.youtube.com/watch?v=CP12345',
  },
  'godaddy-cpanel': {
    title: 'GoDaddy cPanel Access Tutorial',
    url: 'https://www.youtube.com/watch?v=GD12345',
  },
  'bluehost-cpanel': {
    title: 'Bluehost cPanel Login Guide',
    url: 'https://www.youtube.com/watch?v=BH12345',
  },

  // FTP/SFTP
  'ftp-credentials': {
    title: 'How to Find FTP Credentials in cPanel',
    url: 'https://www.youtube.com/watch?v=FTP12345',
    timestamp: '0:45'
  },
};

export async function POST(req: Request) {
  try {
    const body: AssistantRequest = await req.json();
    const { userQuery, platform, hostingProvider, context } = body;

    if (!userQuery || userQuery.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a question or describe what you need help with' },
        { status: 400 }
      );
    }

    // Build context-aware system prompt
    const systemPrompt = `You are a credential assistant helping business owners find their website and marketing credentials. You provide:
1. Clear, step-by-step instructions (maximum 5 steps)
2. Platform-specific guidance
3. Estimated time to complete
4. Autofill suggestions when possible
5. Friendly, encouraging tone (no technical jargon unless necessary)

Context:
- Platform: ${platform || 'Unknown'}
- Hosting: ${hostingProvider || 'Unknown'}
- Business Type: ${context?.businessType || 'Unknown'}
- Website: ${context?.websiteUrl || 'Unknown'}

Guidelines:
- Be specific with button names and menu locations
- Use visual markers: "Look for the blue button in top-right"
- Provide URLs for developer portals
- Suggest autofill values when possible
- Estimate realistic time (e.g., "2-3 minutes")
- Mention if approval/verification is required

Response Format (JSON):
{
  "message": "Friendly introduction + clear explanation",
  "steps": [
    { "step": 1, "action": "Specific action", "url": "relevant URL if applicable" }
  ],
  "autofillSuggestions": { "fieldName": "suggested value" },
  "estimatedTime": "X minutes"
}`;

    const userPrompt = `Client needs help: "${userQuery}"

${platform ? `Platform detected: ${platform}` : ''}
${hostingProvider ? `Hosting provider: ${hostingProvider}` : ''}
${context?.detectedPlatform ? `Website platform: ${context.detectedPlatform}` : ''}

Provide specific, actionable guidance.`;

    // Use Qwen3 for cost-effective AI assistance
    const cascadingAI = new CascadingAI();
    const result = await cascadingAI.generate(
      systemPrompt,
      userPrompt,
      {
        qwenModel: 'qwen-plus',
        temperature: 0.3,
        maxTokens: 1500,
        jsonMode: true,
        timeout: 15000
      }
    );

    const aiResponse = result.data;

    // Determine relevant video tutorial
    let videoTutorial = undefined;
    const queryLower = userQuery.toLowerCase();

    if (queryLower.includes('wordpress') && queryLower.includes('cpanel')) {
      videoTutorial = VIDEO_LIBRARY['wordpress-cpanel'];
    } else if (queryLower.includes('facebook') && queryLower.includes('business id')) {
      videoTutorial = VIDEO_LIBRARY['facebook-business-id'];
    } else if (queryLower.includes('facebook') && queryLower.includes('token')) {
      videoTutorial = VIDEO_LIBRARY['facebook-access-token'];
    } else if (queryLower.includes('google business')) {
      videoTutorial = VIDEO_LIBRARY['google-business-profile'];
    } else if (queryLower.includes('cpanel') && hostingProvider?.toLowerCase().includes('godaddy')) {
      videoTutorial = VIDEO_LIBRARY['godaddy-cpanel'];
    } else if (queryLower.includes('cpanel') && hostingProvider?.toLowerCase().includes('bluehost')) {
      videoTutorial = VIDEO_LIBRARY['bluehost-cpanel'];
    } else if (queryLower.includes('ftp')) {
      videoTutorial = VIDEO_LIBRARY['ftp-credentials'];
    } else if (queryLower.includes('cpanel')) {
      videoTutorial = VIDEO_LIBRARY['cpanel-login'];
    }

    const response: AssistantResponse = {
      message: aiResponse.message,
      steps: aiResponse.steps,
      autofillSuggestions: aiResponse.autofillSuggestions,
      estimatedTime: aiResponse.estimatedTime,
      videoTutorial,
      model: result.model,
      cost: result.estimatedCost
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Credential Assistant Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get assistance',
        details: error.message,
        fallback: {
          message: "I'm having trouble connecting right now. Here are some general tips:\n\n1. Check your hosting provider's email for login details\n2. Visit your hosting control panel (usually: hosting.yourprovider.com)\n3. Look for 'cPanel' or 'Control Panel' in your account\n4. Contact your hosting support if credentials are lost\n\nWould you like to try asking your question again?"
        }
      },
      { status: 500 }
    );
  }
}
