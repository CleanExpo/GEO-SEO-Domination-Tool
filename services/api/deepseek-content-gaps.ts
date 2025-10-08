// Lazy-load firecrawl to avoid build-time errors
let _firecrawl: FirecrawlService | null = null;
function getFirecrawl(): FirecrawlService {
  if (!_firecrawl) {
    _firecrawl = new FirecrawlService({
      apiKey: process.env.FIRECRAWL_API_KEY || 'build-time-dummy-key'
    });
  }
  return _firecrawl;
}

export class DeepSeekContentGapAnalysis {
  /**
   * Find content gaps between your site and competitors
   * Replaces: SEMrush Content Gap Tool
   */
  async findContentGaps(
    yourDomain: string,
    competitorDomains: string[],
    options: {
      minOpportunity?: number;
      maxGaps?: number;
    } = {}
  ): Promise<ContentGap[]> {
    const { minOpportunity = 100, maxGaps = 50 } = options;

    console.log(
      `🔍 DeepSeek V3: Finding content gaps for ${yourDomain} vs ${competitorDomains.length} competitors...`
    );

    try {
      // Step 1: Analyze your content
      const yourContent = await this.analyzeWebsiteContent(yourDomain);

      // Step 2: Analyze competitor content
      const competitorContent = await Promise.all(
        competitorDomains.map((domain) => this.analyzeWebsiteContent(domain))
      );

      // Step 3: Use AI to find gaps
      const gaps = await this.identifyGapsWithAI(yourContent, competitorContent, competitorDomains);

      // Step 4: Score and prioritize gaps
      const scoredGaps = gaps
        .filter((gap) => gap.estimatedOpportunity >= minOpportunity)
        .sort((a, b) => b.estimatedOpportunity - a.estimatedOpportunity)
        .slice(0, maxGaps);

      console.log(`✅ DeepSeek V3: Found ${scoredGaps.length} content gap opportunities`);
      return scoredGaps;
    } catch (error) {
      console.error(`❌ DeepSeek V3 Content Gap Analysis Error:`, error);
      throw error;
    }
  }

  /**
   * Analyze website content using web scraping + AI
   */
  private async analyzeWebsiteContent(domain: string): Promise<{
    domain: string;
    topics: string[];
    keywords: string[];
    contentTypes: string[];
    missingTopics: string[];
  }> {
    try {
      // Scrape website
      const scrapedData = await getFirecrawl().scrapeUrl(`https://${domain}`, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      const content = scrapedData.markdown || '';

      // Use AI to analyze content
      const prompt = `Analyze the content strategy for this website:

Domain: ${domain}

Content Sample:
${content.substring(0, 3000)}

Extract and identify:
1. MAIN TOPICS covered (10-15 topics)
2. KEY KEYWORDS used (20-30 keywords)
3. CONTENT TYPES present (Blog Post, Guide, Case Study, Video, etc.)
4. MISSING TOPICS that could be added

Return ONLY valid JSON:
{
  "topics": ["string"],
  "keywords": ["string"],
  "contentTypes": ["string"],
  "missingTopics": ["string"]
}`;

      const response = await deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO content analyst.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0]?.message?.content || '{}');

      return {
        domain,
        topics: analysis.topics || [],
        keywords: analysis.keywords || [],
        contentTypes: analysis.contentTypes || [],
        missingTopics: analysis.missingTopics || [],
      };
    } catch (error) {
      console.error(`Error analyzing content for ${domain}:`, error);
      return {
        domain,
        topics: [],
        keywords: [],
        contentTypes: [],
        missingTopics: [],
      };
    }
  }

  /**
   * Use AI to identify content gaps
   */
  private async identifyGapsWithAI(
    yourContent: any,
    competitorContent: any[],
    competitorDomains: string[]
  ): Promise<ContentGap[]> {
    const prompt = `Identify content gaps and opportunities:

YOUR WEBSITE (${yourContent.domain}):
Topics: ${yourContent.topics.join(', ')}
Keywords: ${yourContent.keywords.join(', ')}

COMPETITORS:
${competitorContent
  .map(
    (comp, i) => `
${i + 1}. ${comp.domain}
   Topics: ${comp.topics.join(', ')}
   Keywords: ${comp.keywords.join(', ')}
`
  )
  .join('\n')}

Find 20-30 content gaps where:
1. Competitors are ranking but you're not
2. Important topics competitors cover that you're missing
3. Keyword opportunities competitors are targeting
4. Content types competitors use that you don't

For each gap, provide:
- Topic/theme
- Related keywords (5-10)
- Which competitors are covering it
- Estimated traffic opportunity (monthly visitors)
- Content difficulty (0-100)
- Recommended content type
- Recommended word count
- Key points to cover
- Target search intent

Return ONLY valid JSON:
{
  "gaps": [
    {
      "topic": "string",
      "keywords": ["string"],
      "competitorsRanking": ["string"],
      "estimatedOpportunity": number,
      "difficulty": number 0-100,
      "contentType": "string",
      "recommendedWordCount": number,
      "keyPoints": ["string"],
      "targetIntent": "Informational|Commercial|Transactional"
    }
  ]
}`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO content strategist specializing in competitive gap analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"gaps":[]}');
    return result.gaps || [];
  }

  /**
   * Generate content brief for a gap
   */
  async generateContentBrief(gap: ContentGap): Promise<{
    title: string;
    metaDescription: string;
    h1: string;
    h2Headings: string[];
    outline: string[];
    targetKeywords: string[];
    relatedQuestions: string[];
    internalLinkOpportunities: string[];
    competitorURLs: string[];
  }> {
    const prompt = `Create a comprehensive content brief for this topic:

Topic: ${gap.topic}
Target Keywords: ${gap.keywords.join(', ')}
Content Type: ${gap.contentType}
Target Word Count: ${gap.recommendedWordCount}
Search Intent: ${gap.targetIntent}
Key Points: ${gap.keyPoints.join(', ')}

Provide:
1. SEO-optimized title (50-60 characters)
2. Meta description (120-160 characters)
3. H1 heading
4. 6-8 H2 headings for outline
5. Detailed outline (20-30 points)
6. Primary and secondary keywords to target
7. Related questions to answer ("People Also Ask")
8. Internal linking opportunities
9. Competitor URLs to analyze

Return ONLY valid JSON with all fields.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO content strategist and writer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  }

  /**
   * Find topic clusters from content gaps
   */
  async identifyTopicClusters(gaps: ContentGap[]): Promise<{
    cluster: string;
    pillarTopic: string;
    supportingContent: string[];
    totalOpportunity: number;
  }[]> {
    const prompt = `Analyze these content gaps and identify topic clusters:

${gaps.map((gap, i) => `${i + 1}. ${gap.topic} (${gap.keywords.join(', ')})`).join('\n')}

Organize into topic clusters where:
1. Each cluster has a pillar topic (comprehensive guide)
2. Supporting content pieces (specific subtopics)
3. Internal linking strategy

Return ONLY valid JSON:
{
  "clusters": [
    {
      "cluster": "string (cluster name)",
      "pillarTopic": "string (main topic)",
      "supportingContent": ["string (subtopic)"],
      "totalOpportunity": number (sum of traffic potential)
    }
  ]
}`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO content strategist.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"clusters":[]}');
    return result.clusters || [];
  }

  /**
   * Prioritize content gaps by ROI
   */
  prioritizeGaps(gaps: ContentGap[]): ContentGap[] {
    return gaps
      .map((gap) => {
        // Calculate ROI score
        const opportunityScore = gap.estimatedOpportunity / 100; // Normalize
        const difficultyPenalty = gap.difficulty / 100;
        const roiScore = opportunityScore * (1 - difficultyPenalty * 0.5);

        return {
          ...gap,
          roiScore,
        };
      })
      .sort((a: any, b: any) => b.roiScore - a.roiScore);
  }
}

export const deepseekContentGaps = new DeepSeekContentGapAnalysis();
