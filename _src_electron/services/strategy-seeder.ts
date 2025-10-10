import Database from 'better-sqlite3'

// Seed the database with AI Search SEO strategies from the template
export function seedAISearchStrategies(db: Database.Database) {
  const insertStrategy = db.prepare(`
    INSERT INTO seo_strategies (strategy_name, category, principle, implementation_details, tools_resources, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertCaseStudy = db.prepare(`
    INSERT INTO strategy_case_studies (strategy_id, case_study_title, industry, implementation, results_achieved, metrics)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const strategies = [
    {
      name: 'AI Search Revolution',
      category: 'ai_optimization',
      principle: 'Adapt SEO for AI-driven tools and search engines. Focus on visibility in Conversational and AI tools (Perplexity, ChatGPT, Google AI Overviews) by formatting content for LLMs and topic relevance.',
      implementation: `1. Identify conversational topic queries surfaced by AI search
2. Write content with high-quality, detailed experience and structure
3. Ensure all topics covered based on what Perplexity and similar tools use
4. Check Perplexity's "background searches" to model topics
5. Cover topics fully, not just keywords`,
      tools: ['Perplexity', 'Google AI Overviews', 'ChatGPT'],
      priority: 'critical',
      caseStudy: {
        title: 'Lawn Care E-commerce Brand AI Visibility',
        industry: 'Lawn Care / E-commerce',
        implementation: 'Focused on AI search visibility through comprehensive topic coverage and conversational content formatting',
        results: '120% year-on-year traffic growth despite industry-wide declines',
        metrics: { traffic_growth: '120%', industry_trend: 'declining' },
      },
    },
    {
      name: 'Topic Cluster Content Format',
      category: 'content',
      principle: 'Move beyond individual keywords to strategic topic clusters and pillar content with subtopic support.',
      implementation: `1. Organize content sections around natural language topic clusters
2. Create pillar pieces supported by related, detailed posts
3. Implement strong internal linking between pillar and supporting content
4. Structure content for AI comprehension and topic authority`,
      tools: ['Internal linking tools', 'Content mapping software', 'Topic research tools'],
      priority: 'high',
      caseStudy: {
        title: 'Global Skincare Brand Topic Cluster Success',
        industry: 'Skincare / E-commerce',
        implementation: 'Built comprehensive topic clusters with pillar content and supporting articles with strategic internal linking',
        results: '451% organic traffic growth; 8.5% eCommerce revenue growth',
        metrics: { traffic_growth: '451%', revenue_growth: '8.5%' },
      },
    },
    {
      name: 'Buyer Journey Mapping & Psychographics',
      category: 'content',
      principle: 'Rethink audience and keyword research for complex buyer journeys, focus on psychographic profiles not just demographics.',
      implementation: `1. Identify buyer journey stages in detail
2. Build psychographic personas (motivations, fears, objections, values)
3. Run customer surveys and analyze motivations
4. Conduct phone interviews and Reddit research
5. Tailor content tone and topics to audience preferences`,
      tools: ['Facebook surveys', 'Reddit', 'Phone interview tools', 'Survey platforms'],
      priority: 'high',
      caseStudy: {
        title: 'Mortgage Client Psychographic Targeting',
        industry: 'Mortgage / Financial Services',
        implementation: 'Developed 6 psychographic customer profiles through surveys and interviews, created personalized content for each',
        results: 'Organic sessions increased from 778 to 150,000 (20,000% YoY growth)',
        metrics: { session_growth: '20000%', sessions_from: 778, sessions_to: 150000 },
      },
    },
    {
      name: 'Content-Driven Commerce',
      category: 'content',
      principle: 'Embed commercial actions (lead forms, product add-to-cart, quote requests) directly into content pages to capture traffic lost to AI answers.',
      implementation: `1. Add conversion actions directly aligned with content topic
2. Create contextual links to products/services
3. Embed product recommendations within educational content
4. Use action-oriented, useful content to drive conversions
5. Capture intent before users leave to AI tools`,
      tools: ['On-page CTA tools', 'eCommerce product embed widgets', 'Lead capture forms'],
      priority: 'high',
      caseStudy: {
        title: 'Lawn Care & Skincare Content Commerce',
        industry: 'Multiple (Lawn Care, Skincare)',
        implementation: 'Embedded product CTAs and commerce actions directly into blog content aligned with topics',
        results: 'Significant eCommerce improvements; 8.5% revenue uplift for skincare brand',
        metrics: { revenue_uplift: '8.5%' },
      },
    },
    {
      name: 'Seasonality Exploitation',
      category: 'content',
      principle: 'Leverage seasonality in search behaviour for strategic content planning, optimize publication around seasonal trends.',
      implementation: `1. Track and map search trends by season
2. Schedule publishing/optimization for each seasonal phase
3. Monitor with keyword tracking tools
4. Create seasonal content calendars
5. Optimize existing content before peak seasons`,
      tools: ['Google Discover', 'Keyword tracking tools', 'Trend analysis tools'],
      priority: 'medium',
      caseStudy: {
        title: 'Lawn Care Seasonal Content Strategy',
        industry: 'Lawn Care',
        implementation: 'Mapped seasonal search patterns and scheduled content releases to match peak interest periods',
        results: 'Ranks top 3 for 4,874 keywords; viral Google Discover hits',
        metrics: { keywords_top3: 4874, discover_traffic: 'viral' },
      },
    },
    {
      name: 'Trust and Authority Boosting',
      category: 'eeat',
      principle: 'Lean heavily into first-party experience, team authority, and proprietary data to become an AI-cited source in your market.',
      implementation: `1. Attribute content to real people with credentials
2. Create industry surveys & petitions
3. Own statistics and expert narratives
4. Build useful calculators/tools
5. Publish unique business data
6. Highlight team expertise and experience`,
      tools: ['Survey platforms', 'Calculator builders', 'Ebook creation tools', 'Staff attribution systems'],
      priority: 'critical',
      caseStudy: {
        title: 'Bathroom Brand Authority Building',
        industry: 'Bathrooms / Home Improvement',
        implementation: 'Used founder stories, conducted industry surveys, created tools and ebooks with staff attribution',
        results: 'Became industry authority; mortgage client ranked for 69,000+ keywords',
        metrics: { keywords_ranked: 69000, authority_status: 'industry_leader' },
      },
    },
    {
      name: 'Integration Effect',
      category: 'technical',
      principle: 'Combine all strategies for compounded impact and add conversion rate optimization, segmented email marketing, paid campaigns.',
      implementation: `1. Implement all AI search strategies together
2. Optimize product pages for conversions
3. Segment email lists by buyer journey stage
4. Run paid ads for key buyer segments
5. Create synergy across all channels
6. Continuously optimize based on data`,
      tools: ['CRO tools', 'Email segmentation platforms', 'PPC platforms', 'Analytics tools'],
      priority: 'high',
      caseStudy: {
        title: 'Multi-Brand Integrated Strategy',
        industry: 'Multiple (Skincare, Mortgage, Bathrooms)',
        implementation: 'Combined all strategies with CRO, segmented email, and paid campaigns for channel synergy',
        results: 'Improved conversions, visibility, and campaign synergy across all clients',
        metrics: { lead_volume_increase: '50%', overall_improvement: 'significant' },
      },
    },
  ]

  for (const strategy of strategies) {
    const result = insertStrategy.run(
      strategy.name,
      strategy.category,
      strategy.principle,
      strategy.implementation,
      JSON.stringify(strategy.tools),
      strategy.priority
    )

    // Insert case study
    insertCaseStudy.run(
      result.lastInsertRowid,
      strategy.caseStudy.title,
      strategy.caseStudy.industry,
      strategy.caseStudy.implementation,
      strategy.caseStudy.results,
      JSON.stringify(strategy.caseStudy.metrics)
    )
  }

}
