// Share of Local Voice (SoLV) Calculator

export interface SoLVData {
  keyword: string
  location: string
  position: number | null // null if not in pack
  checkedAt: Date
}

export interface SoLVResult {
  totalKeywords: number
  totalLocations: number
  totalPossibleAppearances: number
  actualAppearances: number
  soLVPercentage: number
  averagePosition: number
  keywordsInTop3: number
  keywordsNotRanking: number
}

export function calculateSoLV(trackingData: SoLVData[]): SoLVResult {
  if (trackingData.length === 0) {
    return {
      totalKeywords: 0,
      totalLocations: 0,
      totalPossibleAppearances: 0,
      actualAppearances: 0,
      soLVPercentage: 0,
      averagePosition: 0,
      keywordsInTop3: 0,
      keywordsNotRanking: 0,
    }
  }

  const uniqueKeywords = new Set(trackingData.map(d => d.keyword))
  const uniqueLocations = new Set(trackingData.map(d => d.location))

  const totalKeywords = uniqueKeywords.size
  const totalLocations = uniqueLocations.size
  const totalPossibleAppearances = totalKeywords * totalLocations * 3 // Top 3 positions

  const appearancesInPack = trackingData.filter(d => d.position !== null && d.position <= 3).length
  const keywordsInTop3 = trackingData.filter(d => d.position !== null && d.position <= 3).length
  const keywordsNotRanking = trackingData.filter(d => d.position === null).length

  const rankedPositions = trackingData
    .filter(d => d.position !== null)
    .map(d => d.position as number)

  const averagePosition = rankedPositions.length > 0
    ? rankedPositions.reduce((sum, pos) => sum + pos, 0) / rankedPositions.length
    : 0

  const soLVPercentage = (appearancesInPack / totalPossibleAppearances) * 100

  return {
    totalKeywords,
    totalLocations,
    totalPossibleAppearances,
    actualAppearances: appearancesInPack,
    soLVPercentage: Math.round(soLVPercentage * 100) / 100,
    averagePosition: Math.round(averagePosition * 100) / 100,
    keywordsInTop3,
    keywordsNotRanking,
  }
}

export function getSoLVRecommendations(result: SoLVResult) {
  const recommendations = []

  if (result.soLVPercentage < 30) {
    recommendations.push({
      priority: 'critical',
      title: 'Critical: Very Low Local Visibility',
      description: 'Your Share of Local Voice is critically low. Immediate action needed to improve local pack presence.',
      actions: [
        'Optimize Google Business Profile completely (100% completion)',
        'Focus on primary category optimization',
        'Increase review velocity (target 4+ reviews per month)',
        'Build NAP citations on top directories',
        'Create location-specific landing pages',
      ],
    })
  } else if (result.soLVPercentage < 50) {
    recommendations.push({
      priority: 'high',
      title: 'Below Average Local Visibility',
      description: 'Your local pack presence needs improvement to compete effectively.',
      actions: [
        'Analyze top-ranking competitors in local pack',
        'Improve GBP post frequency (weekly minimum)',
        'Enhance review rating and response rate',
        'Add more service area keywords',
        'Build industry-specific citations',
      ],
    })
  } else if (result.soLVPercentage < 70) {
    recommendations.push({
      priority: 'medium',
      title: 'Good Visibility, Room for Growth',
      description: 'You have decent local visibility but can improve further.',
      actions: [
        'Expand keyword targeting to related terms',
        'Add more geo-modifiers to content',
        'Increase service area coverage',
        'Create neighborhood-specific content',
        'Maintain review velocity',
      ],
    })
  }

  if (result.averagePosition > 2) {
    recommendations.push({
      priority: 'high',
      title: 'Improve Pack Position',
      description: 'Average position can be improved to rank higher in the local pack.',
      actions: [
        'Optimize for proximity by adding service areas',
        'Improve relevance with better category selection',
        'Boost prominence through more reviews and engagement',
      ],
    })
  }

  if (result.keywordsNotRanking > result.totalKeywords * 0.3) {
    recommendations.push({
      priority: 'high',
      title: 'Many Keywords Not Ranking',
      description: `${result.keywordsNotRanking} keywords are not appearing in local pack.`,
      actions: [
        'Review keyword difficulty and competition',
        'Create dedicated landing pages for non-ranking keywords',
        'Improve on-page optimization for these terms',
        'Consider if keywords are too competitive or not locally relevant',
      ],
    })
  }

  return recommendations
}
