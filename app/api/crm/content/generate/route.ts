/**
 * Content Generation API Endpoint
 *
 * POST /api/crm/content/generate
 * Generate complete multimedia content packages
 *
 * Combines Deep Research + Visual Content = Industry Leadership
 */

import { NextRequest, NextResponse } from 'next/server';
import { contentGenerationAgent, ContentRequest } from '@/services/agents/content-generation-agent';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'geo-seo.db');

/**
 * Generate content package
 *
 * POST /api/crm/content/generate
 *
 * Body:
 * {
 *   portfolioId?: string,
 *   type: 'blog' | 'white_paper' | 'social_post' | 'video_script' | 'case_study' | 'email_campaign',
 *   topic: string,
 *   industry: string,
 *   targetAudience?: 'consumers' | 'professionals' | 'industry_experts' | 'investors',
 *   targetKeywords?: string[],
 *   tone?: 'professional' | 'educational' | 'conversational' | 'technical' | 'persuasive',
 *   researchDepth?: 1-5,
 *   includeCompetitorAnalysis?: boolean,
 *   includeImages?: boolean,
 *   includeInfographics?: boolean,
 *   includeDiagrams?: boolean,
 *   includeVideo?: boolean,
 *   platform?: 'website' | 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'email',
 *   targetWordCount?: number,
 *   optimizeForSEO?: boolean,
 *   saveToDatabase?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const body = await request.json();

    const {
      portfolioId,
      type,
      topic,
      industry,
      targetAudience,
      targetKeywords,
      tone,
      researchDepth,
      includeCompetitorAnalysis,
      includeImages,
      includeInfographics,
      includeDiagrams,
      includeVideo,
      platform,
      targetWordCount,
      optimizeForSEO,
      saveToDatabase = true
    } = body;

    // Validation
    if (!type || !topic || !industry) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, topic, industry' },
        { status: 400 }
      );
    }

    const validTypes = ['blog', 'white_paper', 'social_post', 'video_script', 'case_study', 'email_campaign'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Build content request
    const contentRequest: ContentRequest = {
      type,
      topic,
      industry,
      targetAudience,
      targetKeywords,
      tone,
      researchDepth,
      includeCompetitorAnalysis,
      includeImages,
      includeInfographics,
      includeDiagrams,
      includeVideo,
      platform,
      targetWordCount,
      optimizeForSEO
    };

    // Generate content package
    const startTime = Date.now();
    const contentPackage = await contentGenerationAgent.generateContent(contentRequest);
    const generationTime = Date.now() - startTime;

    console.log(`\n✅ Content Generated in ${(generationTime / 1000).toFixed(1)}s`);









    console.log(`   Cost: $${contentPackage.cost.toFixed(4)}`);

    // Save to database
    let contentId: string | undefined;

    if (saveToDatabase) {
      const insertStmt = db.prepare(`
        INSERT INTO content_empire (
          portfolio_id,
          content_type,
          title,
          content,
          summary,
          meta_title,
          meta_description,
          keywords,
          citations,
          originality_score,
          seo_score,
          readability_score,
          overall_quality_score,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      const overallQualityScore = Math.round(
        (contentPackage.seoScore + contentPackage.readabilityScore + contentPackage.originalityScore) / 3
      );

      const result = insertStmt.run(
        portfolioId || null,
        contentPackage.type,
        contentPackage.title,
        contentPackage.content,
        contentPackage.summary,
        contentPackage.meta.title,
        contentPackage.meta.description,
        JSON.stringify(contentPackage.keywords),
        JSON.stringify(contentPackage.citations),
        contentPackage.originalityScore,
        contentPackage.seoScore,
        contentPackage.readabilityScore,
        overallQualityScore
      );

      contentId = result.lastInsertRowid.toString();

      console.log(`   💾 Saved to database (ID: ${contentId})`);

      // Log autonomous action
      if (portfolioId) {
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
          portfolioId,
          'content_generation',
          `Generated ${type}: ${contentPackage.title}`,
          JSON.stringify({
            contentId,
            type,
            wordCount: contentPackage.wordCount,
            seoScore: contentPackage.seoScore,
            cost: contentPackage.cost
          }),
          'completed'
        );
      }
    }

    return NextResponse.json({
      success: true,
      contentId,
      content: {
        id: contentId,
        type: contentPackage.type,
        title: contentPackage.title,
        subtitle: contentPackage.subtitle,
        summary: contentPackage.summary,
        content: contentPackage.content,
        contentHTML: contentPackage.contentHTML,
        featuredImage: contentPackage.featuredImage,
        images: contentPackage.images,
        infographics: contentPackage.infographics,
        diagrams: contentPackage.diagrams,
        video: contentPackage.video,
        keywords: contentPackage.keywords,
        tags: contentPackage.tags,
        citations: contentPackage.citations,
        sources: contentPackage.sources,
        meta: contentPackage.meta,
        publishReady: contentPackage.publishReady
      },
      metrics: {
        seoScore: contentPackage.seoScore,
        readabilityScore: contentPackage.readabilityScore,
        originalityScore: contentPackage.originalityScore,
        credibilityScore: contentPackage.credibilityScore,
        wordCount: contentPackage.wordCount,
        estimatedReadTime: contentPackage.estimatedReadTime,
        generationTime: `${(generationTime / 1000).toFixed(1)}s`,
        cost: contentPackage.cost
      },
      message: `Successfully generated ${type}: "${contentPackage.title}"`
    });

  } catch (error: any) {
    console.error('❌ Content generation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );

  } finally {
    db.close();
  }
}

/**
 * Get generated content by ID or portfolio
 *
 * GET /api/crm/content/generate?id=123
 * GET /api/crm/content/generate?portfolioId=abc&type=blog
 */
export async function GET(request: NextRequest) {
  const db = new Database(dbPath);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const portfolioId = searchParams.get('portfolioId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (id) {
      // Get specific content
      const content = db.prepare('SELECT * FROM content_empire WHERE id = ?').get(id) as any;

      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Content not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        content: parseContent(content)
      });
    }

    // List content with filters
    let query = 'SELECT * FROM content_empire WHERE 1=1';
    const params: any[] = [];

    if (portfolioId) {
      query += ' AND portfolio_id = ?';
      params.push(portfolioId);
    }

    if (type) {
      query += ' AND content_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const contents = db.prepare(query).all(...params) as any[];

    return NextResponse.json({
      success: true,
      total: contents.length,
      contents: contents.map(parseContent)
    });

  } catch (error: any) {
    console.error('❌ Content retrieval error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve content' },
      { status: 500 }
    );

  } finally {
    db.close();
  }
}

/**
 * Parse content from database
 */
function parseContent(row: any) {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    type: row.content_type,
    title: row.title,
    summary: row.summary,
    content: row.content_body,
    contentHTML: row.content_html,
    featuredImage: row.featured_image ? JSON.parse(row.featured_image) : null,
    visualAssets: row.visual_assets ? JSON.parse(row.visual_assets) : null,
    keywords: row.keywords ? JSON.parse(row.keywords) : [],
    citations: row.citations ? JSON.parse(row.citations) : [],
    seoScore: row.seo_score,
    readabilityScore: row.readability_score,
    originalityScore: row.originality_score,
    credibilityScore: row.credibility_score,
    wordCount: row.word_count,
    estimatedReadTime: row.estimated_read_time,
    meta: {
      title: row.meta_title,
      description: row.meta_description
    },
    publishReady: Boolean(row.publish_ready),
    published: Boolean(row.published),
    publishedAt: row.published_at,
    cost: row.generation_cost,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
