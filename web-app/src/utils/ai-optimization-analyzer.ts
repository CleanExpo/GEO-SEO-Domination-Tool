// AI Search Optimization Analyzer

export interface ContentAnalysis {
  url: string
  ai_readability_score: number
  citation_worthiness_score: number
  optimization_score: number
  key_facts_extracted: string[]
  recommended_improvements: string[]
  structure_quality: number
  authority_signals: string[]
}

export interface AIOptimizationReport {
  overall_score: number
  content_analysis: ContentAnalysis
  perplexity_readiness: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
  chatgpt_readiness: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
  google_ai_readiness: {
    score: number
    strengths: string[]
    weaknesses: string[]
  }
  actionable_recommendations: {
    priority: 'critical' | 'high' | 'medium' | 'low'
    category: string
    recommendation: string
    expected_impact: string
  }[]
}

export function analyzeContentForAI(
  content: string,
  url: string,
  metadata?: {
    title?: string
    description?: string
    author?: string
    publishDate?: string
  }
): ContentAnalysis {
  const analysis: ContentAnalysis = {
    url,
    ai_readability_score: 0,
    citation_worthiness_score: 0,
    optimization_score: 0,
    key_facts_extracted: [],
    recommended_improvements: [],
    structure_quality: 0,
    authority_signals: [],
  }

  // AI Readability Score (0-100)
  let readabilityScore = 0

  // Check for clear structure
  const hasHeadings = /<h[1-6]>/i.test(content)
  const hasParagraphs = /<p>/i.test(content) || content.split('\n\n').length > 3
  const hasBullets = /<ul>|<ol>|<li>/i.test(content)

  if (hasHeadings) readabilityScore += 25
  if (hasParagraphs) readabilityScore += 25
  if (hasBullets) readabilityScore += 25

  // Check for concise, scannable format
  const avgParagraphLength = content.split(/<p>|<\/p>/i).reduce((acc, p) => {
    const words = p.trim().split(/\s+/).length
    return acc + words
  }, 0) / content.split(/<p>|<\/p>/i).length

  if (avgParagraphLength < 100) readabilityScore += 25

  analysis.ai_readability_score = Math.min(readabilityScore, 100)

  // Citation Worthiness Score (0-100)
  let citationScore = 0

  // Check for factual content markers
  const hasStatistics = /\d+%|\d+\s*(percent|million|billion|thousand)/.test(content)
  const hasYear = /20\d{2}/.test(content)
  const hasExpertQuote = /according to|says|states|explains|reports/.test(content)
  const hasData = /study|research|survey|analysis|report|data/.test(content)
  const hasSources = /source:|via|from|published by/.test(content)

  if (hasStatistics) citationScore += 20
  if (hasYear) citationScore += 15
  if (hasExpertQuote) citationScore += 20
  if (hasData) citationScore += 25
  if (hasSources) citationScore += 20

  analysis.citation_worthiness_score = Math.min(citationScore, 100)

  // Extract Key Facts
  const factPatterns = [
    /\d+%[^.]+\./g,
    /study\s+(?:shows|reveals|finds)[^.]+\./gi,
    /according to[^.]+\./gi,
    /research\s+(?:indicates|suggests)[^.]+\./gi,
  ]

  factPatterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      analysis.key_facts_extracted.push(...matches.slice(0, 5))
    }
  })

  // Structure Quality (0-100)
  let structureScore = 0

  const hasIntro = content.substring(0, 500).length > 200
  const hasH1 = /<h1>/i.test(content) || (metadata?.title && metadata.title.length > 0)
  const hasH2 = /<h2>/i.test(content)
  const hasConclusion = /conclusion|summary|in summary|to sum up/i.test(content.substring(content.length - 1000))
  const hasFAQ = /faq|frequently asked|common questions/i.test(content)

  if (hasIntro) structureScore += 20
  if (hasH1) structureScore += 20
  if (hasH2) structureScore += 20
  if (hasConclusion) structureScore += 20
  if (hasFAQ) structureScore += 20

  analysis.structure_quality = Math.min(structureScore, 100)

  // Authority Signals
  if (metadata?.author) {
    analysis.authority_signals.push(`Author attribution: ${metadata.author}`)
  }
  if (metadata?.publishDate) {
    analysis.authority_signals.push(`Published date: ${metadata.publishDate}`)
  }
  if (content.includes('expert') || content.includes('specialist')) {
    analysis.authority_signals.push('Expert terminology present')
  }
  if (/\d+\s*years?\s*(of\s*)?(experience|expertise)/i.test(content)) {
    analysis.authority_signals.push('Experience duration mentioned')
  }

  // Recommendations
  if (analysis.ai_readability_score < 70) {
    analysis.recommended_improvements.push('Improve content structure with clear headings and shorter paragraphs')
  }
  if (analysis.citation_worthiness_score < 70) {
    analysis.recommended_improvements.push('Add more statistics, research citations, and expert quotes')
  }
  if (analysis.structure_quality < 70) {
    analysis.recommended_improvements.push('Enhance content structure with intro, H2 sections, and FAQ')
  }
  if (analysis.authority_signals.length < 2) {
    analysis.recommended_improvements.push('Add author attribution and expertise indicators')
  }
  if (!hasFAQ) {
    analysis.recommended_improvements.push('Add FAQ section with AI-common questions')
  }

  // Overall Optimization Score
  analysis.optimization_score = Math.round(
    (analysis.ai_readability_score * 0.3 +
      analysis.citation_worthiness_score * 0.4 +
      analysis.structure_quality * 0.3)
  )

  return analysis
}

export function generateAIOptimizationReport(contentAnalysis: ContentAnalysis): AIOptimizationReport {
  const recommendations: AIOptimizationReport['actionable_recommendations'] = []

  // Critical recommendations
  if (contentAnalysis.citation_worthiness_score < 50) {
    recommendations.push({
      priority: 'critical',
      category: 'Citations & Facts',
      recommendation: 'Add proprietary data, statistics, and expert citations to increase AI citation potential',
      expected_impact: 'High - AI tools prioritize factual, citable content',
    })
  }

  if (contentAnalysis.ai_readability_score < 50) {
    recommendations.push({
      priority: 'critical',
      category: 'Readability',
      recommendation: 'Restructure content with clear headings, bullet points, and scannable format',
      expected_impact: 'High - AI tools parse structured content more effectively',
    })
  }

  // High priority recommendations
  if (contentAnalysis.authority_signals.length < 3) {
    recommendations.push({
      priority: 'high',
      category: 'Authority',
      recommendation: 'Add author credentials, publication dates, and expertise indicators',
      expected_impact: 'Medium-High - Builds trust signals for AI citations',
    })
  }

  if (!contentAnalysis.key_facts_extracted.length) {
    recommendations.push({
      priority: 'high',
      category: 'Factual Content',
      recommendation: 'Include specific statistics, research findings, and data points',
      expected_impact: 'High - Increases likelihood of being cited as source',
    })
  }

  // Calculate platform readiness scores
  const perplexityScore = Math.round(
    (contentAnalysis.citation_worthiness_score * 0.5 +
      contentAnalysis.ai_readability_score * 0.3 +
      contentAnalysis.structure_quality * 0.2)
  )

  const chatgptScore = Math.round(
    (contentAnalysis.ai_readability_score * 0.4 +
      contentAnalysis.structure_quality * 0.4 +
      contentAnalysis.citation_worthiness_score * 0.2)
  )

  const googleAIScore = Math.round(
    (contentAnalysis.structure_quality * 0.4 +
      contentAnalysis.citation_worthiness_score * 0.35 +
      contentAnalysis.ai_readability_score * 0.25)
  )

  return {
    overall_score: contentAnalysis.optimization_score,
    content_analysis: contentAnalysis,
    perplexity_readiness: {
      score: perplexityScore,
      strengths: perplexityScore > 70 ? ['High citation worthiness', 'Factual content'] : [],
      weaknesses: perplexityScore < 70 ? ['Needs more statistics', 'Improve fact density'] : [],
    },
    chatgpt_readiness: {
      score: chatgptScore,
      strengths: chatgptScore > 70 ? ['Good structure', 'Clear formatting'] : [],
      weaknesses: chatgptScore < 70 ? ['Improve readability', 'Add more sections'] : [],
    },
    google_ai_readiness: {
      score: googleAIScore,
      strengths: googleAIScore > 70 ? ['Well-structured', 'Authority signals'] : [],
      weaknesses: googleAIScore < 70 ? ['Add FAQ section', 'Improve citations'] : [],
    },
    actionable_recommendations: recommendations,
  }
}
