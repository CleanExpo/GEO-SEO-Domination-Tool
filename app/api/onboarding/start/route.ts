/**
 * Start Client Onboarding API
 *
 * POST: Initialize onboarding process for a new client
 * Now enhanced with Bytebot for comprehensive automated research
 */

import { NextRequest, NextResponse } from 'next/server';
import { onboardingOrchestrator } from '@/services/onboarding/onboarding-orchestrator';
import { getBytebotClient } from '@/lib/bytebot-client';
import { getDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'businessName',
      'email',
      'contactName',
      'primaryGoals',
      'targetKeywords',
      'contentTypes',
      'selectedServices'
    ];

    for (const field of requiredFields) {
      if (!body[field] || (Array.isArray(body[field]) && body[field].length === 0)) {
        return Response.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Start traditional onboarding
    const onboardingId = await onboardingOrchestrator.startOnboarding(body);

    // Try to create Bytebot research task (optional - graceful fallback if Bytebot unavailable)
    let bytebotTaskId: string | null = null;
    let bytebotMessage = '';

    try {
      const bytebot = getBytebotClient();
      const bytebotTask = await bytebot.createTask(
        buildOnboardingResearchPrompt(body),
        {
          priority: 'HIGH',
          metadata: {
            onboardingId,
            businessName: body.businessName,
            website: body.website,
            taskType: 'onboarding_research'
          }
        }
      );

      bytebotTaskId = bytebotTask.id;

      // Store Bytebot task reference in database
      const db = getDatabase();
      await db.initialize();

      await db.query(
        `INSERT INTO bytebot_tasks (
          bytebot_task_id, description, task_type, priority,
          onboarding_id, metadata, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bytebotTask.id,
          'Comprehensive onboarding research',
          'onboarding',
          'HIGH',
          onboardingId,
          JSON.stringify({
            businessName: body.businessName,
            website: body.website,
            competitors: body.competitors,
            keywords: body.targetKeywords
          }),
          'RUNNING'
        ]
      );

      bytebotMessage = ' Bytebot is conducting comprehensive research.';
      console.log(`[Onboarding] Bytebot task created: ${bytebotTask.id}`);

    } catch (bytebotError: any) {
      // Bytebot unavailable - continue without it
      console.warn('[Onboarding] Bytebot unavailable, continuing without automated research:', bytebotError.message);
      bytebotMessage = ' Manual research required.';
    }

    return Response.json({
      success: true,
      onboardingId,
      bytebotTaskId,
      message: `Onboarding started successfully.${bytebotMessage}`
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error starting onboarding:', error);
    return Response.json(
      {
        error: 'Failed to start onboarding',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Build comprehensive research prompt for Bytebot
 */
function buildOnboardingResearchPrompt(clientData: any): string {
  return `
# New Client Onboarding Research

## Client Information
- Business Name: ${clientData.businessName}
- Industry: ${clientData.industry}
- Website: ${clientData.website || 'Not provided'}
- Target Locations: ${clientData.targetLocations?.join(', ') || 'Not specified'}

## Primary Goals
${clientData.primaryGoals.map((g: string) => `- ${g}`).join('\n')}

## Target Keywords
${clientData.targetKeywords.map((k: string) => `- ${k}`).join('\n')}

## Competitors
${clientData.competitors?.map((c: string) => `- ${c}`).join('\n') || 'None specified'}

---

## Research Tasks

### 1. Client Website Analysis
${clientData.website ? `
- Visit ${clientData.website}
- Run Lighthouse audit (Performance, SEO, Accessibility, Best Practices)
- Capture homepage screenshot
- Extract:
  - Page title and meta description
  - H1-H6 headings structure
  - Main content topics
  - Call-to-action elements
  - Contact information
- Check mobile responsiveness
- Test page load speed
- Identify any technical SEO issues
` : '- No website provided - client needs website development'}

### 2. Google Business Profile Check
- Search Google Maps for: "${clientData.businessName}" in ${clientData.targetLocations?.[0] || 'their area'}
- Check if GBP listing exists
- If found, note:
  - Completeness score (estimate)
  - Review count and average rating
  - Photos count
  - Business hours listed
  - Website link present
  - Posts/updates activity

### 3. Keyword Research & SERP Analysis
For each target keyword:
${clientData.targetKeywords.map((keyword: string) => `
- Search Google for: "${keyword}"
  - Capture SERP screenshot
  - Identify top 10 results
  - Note SERP features (Featured Snippet, People Also Ask, Local Pack, etc.)
  - Check where ${clientData.website || clientData.businessName} ranks (if anywhere)
  - Identify search intent (informational, transactional, navigational)
`).join('\n')}

### 4. Competitor Analysis
${clientData.competitors && clientData.competitors.length > 0 ? `
For each competitor:
${clientData.competitors.map((competitor: string) => `
- Visit ${competitor}
- Capture homepage screenshot
- Extract:
  - Page title and meta description
  - Services/products offered
  - Unique selling propositions
  - Pricing (if visible)
  - Call-to-action strategies
- Run quick Lighthouse audit
- Check their Google Business Profile
- Note estimated organic traffic level (high/medium/low)
`).join('\n')}

### 5. Competitive Keyword Analysis
- For each competitor, identify which of our target keywords they rank for
- Note their approximate positions
- Identify keyword gaps (keywords they rank for that client doesn't)
` : '- No competitors specified for analysis'}

### 6. Local SEO Analysis (if applicable)
${clientData.targetLocations && clientData.targetLocations.length > 0 ? `
For each location: ${clientData.targetLocations.join(', ')}
- Check local pack results for top keywords
- Identify competing businesses in local pack
- Check citation consistency (NAP - Name, Address, Phone)
- Look for directory listings (Yelp, Yellow Pages, etc.)
` : '- No specific locations targeted'}

---

## Deliverables

Create a comprehensive onboarding report with:

1. **Executive Summary**: 3-5 key findings about client's current online presence

2. **Technical SEO Assessment**: Current website health and issues to address

3. **Competitive Landscape**: How client compares to competitors

4. **Keyword Opportunities**: Best keywords to target based on competition and search volume

5. **Local SEO Status**: Current local search visibility and GBP status

6. **Recommended Action Items**:
   - Top 5 immediate priorities
   - Quick wins (can be done in first 30 days)
   - Long-term strategy (3-6 month goals)

7. **Screenshots**: All relevant screenshots organized by category

Format the report clearly with sections, bullet points, and specific data points.
Save all screenshots to the desktop for reference.
`.trim();
}

