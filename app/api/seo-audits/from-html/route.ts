import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { Comprehensive117PointAnalyzer } from '@/lib/seo-117-point-analyzer';
import * as cheerio from 'cheerio';

/**
 * Analyze SEO from provided HTML (for sites that block crawlers)
 * POST /api/seo-audits/from-html
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, url, company_id, targetKeywords, includeLocalSEO } = body;

    if (!html || !url) {
      return NextResponse.json(
        { error: 'html and url are required' },
        { status: 400 }
      );
    }

    console.log(`[SEO Audits from HTML] Analyzing ${url} from provided HTML`);

    const $ = cheerio.load(html);

    // Extract basic data
    const crawlData = {
      html,
      $,
      title: $('title').text(),
      metaDescription: $('meta[name="description"]').attr('content') || '',
      h1Tags: $('h1').map((_, el) => $(el).text()).get(),
      h2Tags: $('h2').map((_, el) => $(el).text()).get(),
      links: $('a[href]').length,
      images: $('img').length,
      imagesWithAlt: $('img[alt]').length,
      scripts: $('script').length,
      stylesheets: $('link[rel="stylesheet"]').length,
    };

    // Run 117-point analysis
    const analyzer = new Comprehensive117PointAnalyzer();
    const result = await analyzer.analyzeWebsite(url, {
      targetKeywords,
      includeLocalSEO,
    });

    // Map to audit format
    const auditResults = {
      url,
      score: result.overallScore,
      title: crawlData.title || 'No title',
      meta_description: crawlData.metaDescription,
      h1_tags: crawlData.h1Tags,
      issues: result.actionableTasks.slice(0, 20).map(task => ({
        type: task.priority === 'Critical' ? 'error' : 'warning',
        category: task.category.toLowerCase(),
        message: task.task,
        impact: task.priority === 'Critical' ? 'high' : task.priority === 'High' ? 'high' : 'medium',
      })),
      performance_score: result.categoryScores.userExperience,
      accessibility_score: result.categoryScores.userExperience,
      seo_score: result.categoryScores.onPage,
      extended_data: {
        comprehensive_analysis: result,
        category_scores: result.categoryScores,
        actionable_tasks: result.actionableTasks,
        estimated_impact: result.estimatedImpact,
        analysis_method: 'from-html',
        note: 'Analyzed from manually provided HTML (site blocks automated crawlers)',
      },
    };

    // Save to database
    const supabase = createAdminClient();
    const dbRecord = {
      company_id: company_id || null,
      url: auditResults.url,
      overall_score: auditResults.score,
      performance_score: auditResults.performance_score,
      seo_score: auditResults.seo_score,
      accessibility_score: auditResults.accessibility_score,
      best_practices_score: result.categoryScores.technical,
      issues: auditResults.issues,
      recommendations: result.actionableTasks.map(t => t.task),
      metadata: {
        title: auditResults.title,
        meta_description: auditResults.meta_description,
        h1_tags: auditResults.h1_tags,
        ...auditResults.extended_data,
      },
    };

    const { data, error } = await supabase
      .from('seo_audits')
      .insert([dbRecord])
      .select()
      .single();

    if (error) {
      console.error('[SEO Audits from HTML] Database insert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[SEO Audits from HTML] Audit completed for ${url}, ID: ${data.id}`);

    return NextResponse.json({
      audit: data,
      analysis: result,
      note: 'Analyzed from provided HTML - bypasses crawler blocking',
    }, { status: 201 });

  } catch (error: any) {
    console.error('[SEO Audits from HTML] Error:', error.message || error);
    return NextResponse.json(
      { error: `Failed to analyze HTML: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
