/**
 * POST /api/content-opportunities/[id]/generate
 * Generates content (article, social pack, newsletter) from an opportunity
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase-admin';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const opportunityId = id;
    const body = await request.json();
    const { contentTypes = ['article', 'social', 'newsletter'] } = body;

    const supabase = createAdminClient();

    // Fetch opportunity
    const { data: opportunity, error: oppError } = await supabase
      .from('content_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // JSONB fields are already parsed
    const topQuestions = opportunity.top_questions || [];
    const keyBullets = opportunity.key_bullets || [];

    // Generate content using Claude
    const claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });
    const generatedContent: any = {};

    // 1. Article Plan
    if (contentTypes.includes('article')) {
      const articlePrompt = `You are a senior editor writing for trade professionals.

Topic: ${opportunity.keyword}
Search Volume: ${opportunity.search_volume}/month
Audience: Trade professionals (8th-grade clarity, expert correctness)
Angle: Resolve the unanswered questions users keep asking in communities.

Top Questions from Reddit:
${topQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Create a comprehensive article plan that includes:

# Article Structure

## Title
[Compelling, SEO-optimized title]

## Meta Description
[150-160 characters, includes primary keyword]

## Canonical Answer (1-3 sentences)
[Direct answer that AI engines can extract and cite]

## Introduction (100-150 words)
- Hook that addresses the pain point
- Preview of what readers will learn
- Why this matters to trade professionals

## Step-by-Step Guide
[Break down into 3-5 main sections, each answering a top question]

## Safety & Compliance Notes
- Australian standards (if applicable)
- US standards (if applicable)
- Common mistakes to avoid

## Tools & Equipment Checklist
[What professionals need to solve this problem]

## Visual Assets Needed
[List diagrams, photos, or illustrations required]

## FAQ Section
${topQuestions.slice(0, 5).map((q: string) => `- ${q}`).join('\n')}

## Citations & Sources
[Standards, industry data, reputable sources]

Keep the tone professional but accessible. Use short paragraphs and bullet points.`;

      const articleResponse = await claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: articlePrompt
        }]
      });

      generatedContent.article = articleResponse.content[0].type === 'text'
        ? articleResponse.content[0].text
        : '';
    }

    // 2. Social Media Pack
    if (contentTypes.includes('social')) {
      const socialPrompt = `Create platform-native social media posts from this topic:

Topic: ${opportunity.keyword}
Canonical Answer: ${opportunity.canonical_answer || 'Professional solution for ' + opportunity.keyword}

Create posts for:

## LinkedIn (120-200 words)
[Professional tone, industry insights, call-to-action]

## Facebook (80-120 words)
[Conversational, helpful, community-focused]

## Instagram Caption (<=150 words)
[Visual hook, value proposition, 5-8 hashtags]

## X/Twitter Thread (5-7 tweets)
[Hook tweet + 4-6 value tweets + CTA]

## 30-Second Short Video Script
**Hook (3 seconds):** [Attention-grabbing question or stat]
**Beat 1 (8 seconds):** [Core problem]
**Beat 2 (8 seconds):** [Solution preview]
**Beat 3 (8 seconds):** [Key takeaway]
**CTA (3 seconds):** [Next step]

Make each post platform-native and actionable.`;

      const socialResponse = await claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: socialPrompt
        }]
      });

      generatedContent.social = socialResponse.content[0].type === 'text'
        ? socialResponse.content[0].text
        : '';
    }

    // 3. Newsletter Item
    if (contentTypes.includes('newsletter')) {
      const newsletterPrompt = `Create a newsletter block for this topic:

Topic: ${opportunity.keyword}
Canonical Answer: ${opportunity.canonical_answer || 'Professional solution for ' + opportunity.keyword}

Create:

## Headline (7-10 words)
[Compelling, benefit-driven]

## Hook (2 sentences)
[Why readers should care right now]

## 3 Key Takeaways
1. [Actionable insight #1]
2. [Actionable insight #2]
3. [Actionable insight #3]

## CTA with Link
[Call-to-action with UTM parameters: ?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_tips]

Keep it scannable and action-oriented.`;

      const newsletterResponse = await claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: newsletterPrompt
        }]
      });

      generatedContent.newsletter = newsletterResponse.content[0].type === 'text'
        ? newsletterResponse.content[0].text
        : '';
    }

    // Save to content_plans table
    const slug = opportunity.keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const result = await db.run(
      `INSERT INTO content_plans
       (opportunity_id, article_plan, social_pack, newsletter_item, focus_keyword, slug, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        opportunityId,
        generatedContent.article || null,
        generatedContent.social || null,
        generatedContent.newsletter || null,
        opportunity.keyword,
        slug,
        'draft'
      ]
    );

    const contentPlanId = result.lastID;

    // Update opportunity status
    await db.run(
      `UPDATE content_opportunities SET status = ? WHERE id = ?`,
      ['planned', opportunityId]
    );

    return NextResponse.json({
      success: true,
      contentPlanId,
      content: generatedContent,
      slug
    });

  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        details: error.message
      },
      { status: 500 }
    );
  }
}
