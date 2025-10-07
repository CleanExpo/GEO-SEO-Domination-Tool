import type { EEATScores } from '@/types'

interface EEATSignals {
  experience: {
    hasFirstHandContent: boolean
    hasCaseStudies: boolean
    hasOriginalResearch: boolean
    hasTestimonials: boolean
    hasBeforeAfter: boolean
  }
  expertise: {
    hasAuthorCredentials: boolean
    hasCertifications: boolean
    hasIndustryAffiliations: boolean
    yearsOfExperience: number
    hasEducationalBackground: boolean
  }
  authoritativeness: {
    backlinksCount: number
    domainAuthority: number
    hasMediaMentions: boolean
    hasAwards: boolean
    hasSpeakingEngagements: boolean
  }
  trustworthiness: {
    hasHTTPS: boolean
    hasPrivacyPolicy: boolean
    hasContactInfo: boolean
    avgRating: number
    hasTransparentPractices: boolean
    hasNoSecurityIssues: boolean
    hasRegularUpdates: boolean
  }
}

export function calculateEEATScore(signals: EEATSignals): EEATScores {
  // Experience Score (0-100)
  const experienceSignals = signals.experience
  let experienceScore = 0
  if (experienceSignals.hasFirstHandContent) experienceScore += 25
  if (experienceSignals.hasCaseStudies) experienceScore += 20
  if (experienceSignals.hasOriginalResearch) experienceScore += 25
  if (experienceSignals.hasTestimonials) experienceScore += 15
  if (experienceSignals.hasBeforeAfter) experienceScore += 15

  // Expertise Score (0-100)
  const expertiseSignals = signals.expertise
  let expertiseScore = 0
  if (expertiseSignals.hasAuthorCredentials) expertiseScore += 25
  if (expertiseSignals.hasCertifications) expertiseScore += 20
  if (expertiseSignals.hasIndustryAffiliations) expertiseScore += 15
  if (expertiseSignals.yearsOfExperience >= 10) expertiseScore += 25
  else if (expertiseSignals.yearsOfExperience >= 5) expertiseScore += 15
  else if (expertiseSignals.yearsOfExperience >= 2) expertiseScore += 10
  if (expertiseSignals.hasEducationalBackground) expertiseScore += 15

  // Authoritativeness Score (0-100)
  const authSignals = signals.authoritativeness
  let authScore = 0

  // Backlinks scoring
  if (authSignals.backlinksCount >= 1000) authScore += 25
  else if (authSignals.backlinksCount >= 500) authScore += 20
  else if (authSignals.backlinksCount >= 100) authScore += 15
  else if (authSignals.backlinksCount >= 50) authScore += 10

  // Domain Authority scoring
  if (authSignals.domainAuthority >= 60) authScore += 25
  else if (authSignals.domainAuthority >= 40) authScore += 20
  else if (authSignals.domainAuthority >= 30) authScore += 15
  else if (authSignals.domainAuthority >= 20) authScore += 10

  if (authSignals.hasMediaMentions) authScore += 20
  if (authSignals.hasAwards) authScore += 15
  if (authSignals.hasSpeakingEngagements) authScore += 15

  // Trustworthiness Score (0-100)
  const trustSignals = signals.trustworthiness
  let trustScore = 0
  if (trustSignals.hasHTTPS) trustScore += 15
  if (trustSignals.hasPrivacyPolicy) trustScore += 10
  if (trustSignals.hasContactInfo) trustScore += 10

  // Rating scoring
  if (trustSignals.avgRating >= 4.5) trustScore += 25
  else if (trustSignals.avgRating >= 4.0) trustScore += 20
  else if (trustSignals.avgRating >= 3.5) trustScore += 15
  else if (trustSignals.avgRating >= 3.0) trustScore += 10

  if (trustSignals.hasTransparentPractices) trustScore += 15
  if (trustSignals.hasNoSecurityIssues) trustScore += 15
  if (trustSignals.hasRegularUpdates) trustScore += 10

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (experienceScore * 0.25 + expertiseScore * 0.25 + authScore * 0.25 + trustScore * 0.25)
  )

  return {
    experience: Math.min(experienceScore, 100),
    expertise: Math.min(expertiseScore, 100),
    authoritativeness: Math.min(authScore, 100),
    trustworthiness: Math.min(trustScore, 100),
    overall: Math.min(overall, 100),
  }
}

export function getEEATRecommendations(scores: EEATScores) {
  const recommendations = []

  if (scores.experience < 80) {
    recommendations.push({
      category: 'Experience',
      priority: scores.experience < 50 ? 'high' : 'medium',
      items: [
        'Add first-hand case studies and customer success stories',
        'Include original research or data from your business',
        'Showcase before/after examples of your work',
        'Feature detailed customer testimonials with specifics',
      ],
    })
  }

  if (scores.expertise < 80) {
    recommendations.push({
      category: 'Expertise',
      priority: scores.expertise < 50 ? 'high' : 'medium',
      items: [
        'Display author credentials and qualifications prominently',
        'Add professional certifications and licenses',
        'Include industry affiliations and memberships',
        'Create detailed author bio pages with expertise areas',
      ],
    })
  }

  if (scores.authoritativeness < 80) {
    recommendations.push({
      category: 'Authoritativeness',
      priority: scores.authoritativeness < 50 ? 'high' : 'medium',
      items: [
        'Build high-quality backlinks from authoritative sources',
        'Get featured in industry publications and media',
        'Publish original research or thought leadership content',
        'Participate in speaking engagements and conferences',
      ],
    })
  }

  if (scores.trustworthiness < 80) {
    recommendations.push({
      category: 'Trustworthiness',
      priority: scores.trustworthiness < 50 ? 'high' : 'medium',
      items: [
        'Ensure HTTPS is properly configured across all pages',
        'Add/update privacy policy and terms of service',
        'Display clear contact information and business hours',
        'Actively collect and respond to customer reviews',
        'Keep content fresh with regular updates',
      ],
    })
  }

  return recommendations
}
