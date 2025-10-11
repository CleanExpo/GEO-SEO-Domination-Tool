/**
 * Content Deployment API
 *
 * POST /api/crm/deploy
 * Deploy generated content to multiple platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { autoDeployAgent, DeploymentRequest } from '@/services/agents/auto-deploy-agent';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

/**
 * Deploy content to platforms
 *
 * POST /api/crm/deploy
 *
 * Body:
 * {
 *   contentId: string,          // ID from content_empire table
 *   platforms: {
 *     nodejs?: { apiUrl, apiKey, category, tags, status },
 *     wordpress?: { siteUrl, username, applicationPassword, categories, tags },
 *     linkedin?: { accessToken, organizationId },
 *     facebook?: { accessToken, pageId },
 *     twitter?: { apiKey, apiSecret, accessToken, accessSecret },
 *     gmb?: { accessToken, locationId }
 *   },
 *   publishNow?: boolean,
 *   scheduleFor?: string,
 *   portfolioId?: string
 * }
 */
export async function POST(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const body = await request.json();

    const {
      contentId,
      platforms,
      publishNow = true,
      scheduleFor,
      portfolioId
    } = body;

    // Validation
    if (!contentId) {
      return NextResponse.json(
        { success: false, error: 'contentId is required' },
        { status: 400 }
      );
    }

    if (!platforms || Object.keys(platforms).length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one platform must be specified' },
        { status: 400 }
      );
    }

    console.log(`   Platforms: ${Object.keys(platforms).join(', ')}`);

    // Fetch content from database
    const content = db.prepare('SELECT * FROM content_empire WHERE id = ?').get(contentId) as any;

    if (!content) {
      return NextResponse.json(
        { success: false, error: `Content not found: ${contentId}` },
        { status: 404 }
      );
    }

    // Parse content
    const contentPackage = {
      type: content.content_type,
      title: content.title,
      content: content.content,
      contentHTML: content.content_html,
      summary: content.summary,
      featuredImage: content.featured_image ? JSON.parse(content.featured_image) : undefined,
      images: content.visual_assets ? JSON.parse(content.visual_assets).images || [] : [],
      infographics: content.visual_assets ? JSON.parse(content.visual_assets).infographics || [] : [],
      diagrams: content.visual_assets ? JSON.parse(content.visual_assets).diagrams || [] : [],
      video: content.visual_assets ? JSON.parse(content.visual_assets).video : undefined,
      keywords: content.keywords ? JSON.parse(content.keywords) : [],
      tags: content.tags ? JSON.parse(content.tags) : [],
      citations: content.citations ? JSON.parse(content.citations) : [],
      sources: 0,
      seoScore: content.seo_score || 0,
      readabilityScore: content.readability_score || 0,
      originalityScore: content.originality_score || 0,
      credibilityScore: content.credibility_score || 0,
      meta: {
        title: content.meta_title || content.title,
        description: content.meta_description || content.summary,
        keywords: content.keywords ? JSON.parse(content.keywords).join(', ') : '',
        ogImage: content.featured_image ? JSON.parse(content.featured_image).url : undefined
      },
      publishReady: Boolean(content.publish_ready),
      estimatedReadTime: content.estimated_read_time || 5,
      wordCount: content.word_count || 0,
      generatedAt: content.created_at,
      cost: content.generation_cost || 0
    };

    // Deploy to platforms
    const deploymentRequest: DeploymentRequest = {
      contentId,
      content: contentPackage,
      platforms,
      publishNow,
      scheduleFor,
      portfolioId: portfolioId || content.portfolio_id
    };

    const deploymentReport = await autoDeployAgent.deployContent(deploymentRequest);

    // Log deployment results
    if (portfolioId || content.portfolio_id) {
      const pid = portfolioId || content.portfolio_id;

      deploymentReport.results.forEach(result => {
        db.prepare(`
          INSERT INTO autonomous_actions (
            portfolio_id,
            action_type,
            action_name,
            details,
            status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).run(
          pid,
          'content_deployment',
          `Deployed to ${result.platform}`,
          JSON.stringify({
            contentId,
            platform: result.platform,
            postId: result.postId,
            postUrl: result.postUrl,
            success: result.success,
            error: result.error
          }),
          result.success ? 'completed' : 'failed'
        );
      });
    }

    // Update content as published
    if (deploymentReport.successfulDeployments > 0) {
      db.prepare(`
        UPDATE content_empire
        SET published = 1, published_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(contentId);
    }

    return NextResponse.json({
      success: true,
      deployment: deploymentReport,
      message: `Successfully deployed to ${deploymentReport.successfulDeployments}/${deploymentReport.totalPlatforms} platforms`
    });

  } catch (error: any) {
    console.error('❌ Deployment error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to deploy content',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );

  } finally {
    db.close();
  }
}

/**
 * Get deployment history
 *
 * GET /api/crm/deploy?contentId=123
 * GET /api/crm/deploy?portfolioId=abc
 */
export async function GET(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const portfolioId = searchParams.get('portfolioId');

    if (!contentId && !portfolioId) {
      return NextResponse.json(
        { success: false, error: 'contentId or portfolioId is required' },
        { status: 400 }
      );
    }

    let deployments: any[];

    if (contentId) {
      deployments = db.prepare(`
        SELECT * FROM autonomous_actions
        WHERE action_type = 'content_deployment'
        AND json_extract(details, '$.contentId') = ?
        ORDER BY created_at DESC
      `).all(contentId);
    } else {
      deployments = db.prepare(`
        SELECT * FROM autonomous_actions
        WHERE action_type = 'content_deployment'
        AND portfolio_id = ?
        ORDER BY created_at DESC
      `).all(portfolioId);
    }

    return NextResponse.json({
      success: true,
      total: deployments.length,
      deployments: deployments.map(d => ({
        id: d.id,
        portfolioId: d.portfolio_id,
        actionName: d.action_name,
        details: JSON.parse(d.details),
        status: d.status,
        createdAt: d.created_at
      }))
    });

  } catch (error: any) {
    console.error('❌ Deployment history error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve deployment history' },
      { status: 500 }
    );

  } finally {
    db.close();
  }
}
