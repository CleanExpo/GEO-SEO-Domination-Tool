import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import { Comprehensive117PointAnalyzer } from '@/lib/seo-117-point-analyzer';
import { z } from 'zod';

const auditRequestSchema = z.object({
  company_id: z.string().uuid().optional(),
  url: z.string().url('Invalid URL format'),
  competitors: z.array(z.string().url()).optional(),
  target_keywords: z.array(z.string()).optional(),
  include_local_seo: z.boolean().default(true),
});

// POST /api/audits/117-point - Run comprehensive 117-point SEO audit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = auditRequestSchema.parse(body);

    console.log(`[117-Point Audit] Starting comprehensive audit for ${validatedData.url}`);

    // Initialize the 117-point analyzer
    const analyzer = new Comprehensive117PointAnalyzer();

    // Run the comprehensive audit
    const auditResult = await analyzer.analyzeWebsite(validatedData.url, {
      competitors: validatedData.competitors,
      targetKeywords: validatedData.target_keywords,
      includeLocalSEO: validatedData.include_local_seo,
    });

    // Store result in database if company_id provided
    if (validatedData.company_id) {
      const supabase = createAdminClient();

      const dbRecord = {
        company_id: validatedData.company_id,
        url: validatedData.url,
        overall_score: auditResult.overallScore,
        performance_score: auditResult.categoryScores.technical,
        seo_score: auditResult.categoryScores.onPage,
        accessibility_score: auditResult.categoryScores.userExperience,
        metadata: {
          type: '117-point-comprehensive',
          category_scores: auditResult.categoryScores,
          analysis: {
            technical: {
              score: auditResult.analysis.technical.score,
              total_points: 35,
              points_passed: auditResult.analysis.technical.points.filter(p => p.status === 'pass').length,
            },
            onPage: {
              score: auditResult.analysis.onPage.score,
              total_points: 28,
              points_passed: auditResult.analysis.onPage.points.filter(p => p.status === 'pass').length,
            },
            content: {
              score: auditResult.analysis.content.score,
              total_points: 22,
              points_passed: auditResult.analysis.content.points.filter(p => p.status === 'pass').length,
            },
            userExperience: {
              score: auditResult.analysis.userExperience.score,
              total_points: 15,
              points_passed: auditResult.analysis.userExperience.points.filter(p => p.status === 'pass').length,
            },
            localSEO: {
              score: auditResult.analysis.localSEO.score,
              total_points: 17,
              points_passed: auditResult.analysis.localSEO.points.filter(p => p.status === 'pass').length,
            },
          },
          actionable_tasks: auditResult.actionableTasks,
          estimated_impact: auditResult.estimatedImpact,
          competitor_insights: auditResult.competitorInsights,
        },
        issues: auditResult.actionableTasks.filter(t => t.priority === 'Critical' || t.priority === 'High').map(task => ({
          type: 'error',
          category: task.category,
          message: task.task,
          impact: task.priority === 'Critical' ? 'high' : 'medium',
        })),
        recommendations: auditResult.actionableTasks.map(task => task.task),
      };

      const { data, error } = await supabase
        .from('seo_audits')
        .insert([dbRecord])
        .select()
        .single();

      if (error) {
        console.error('[117-Point Audit] Database save failed:', error.message);
        // Continue even if save fails - return results anyway
      } else {
        console.log(`[117-Point Audit] Results saved to database, ID: ${data.id}`);
      }
    }

    // Return comprehensive results
    return NextResponse.json({
      success: true,
      audit: auditResult,
      summary: {
        overallScore: auditResult.overallScore,
        categoryScores: auditResult.categoryScores,
        totalPoints: 117,
        pointsPassed:
          auditResult.analysis.technical.points.filter(p => p.status === 'pass').length +
          auditResult.analysis.onPage.points.filter(p => p.status === 'pass').length +
          auditResult.analysis.content.points.filter(p => p.status === 'pass').length +
          auditResult.analysis.userExperience.points.filter(p => p.status === 'pass').length +
          auditResult.analysis.localSEO.points.filter(p => p.status === 'pass').length,
        criticalTasks: auditResult.actionableTasks.filter(t => t.priority === 'Critical').length,
        estimatedImpact: auditResult.estimatedImpact,
      },
    }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('[117-Point Audit] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run 117-point audit',
      },
      { status: 500 }
    );
  }
}

// GET /api/audits/117-point?company_id=xxx - Get past 117-point audits
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id parameter required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('seo_audits')
      .select('*')
      .eq('company_id', companyId)
      .like('metadata->type', '117-point-comprehensive')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[117-Point Audit] Fetch failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      audits: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('[117-Point Audit] Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audits' },
      { status: 500 }
    );
  }
}
