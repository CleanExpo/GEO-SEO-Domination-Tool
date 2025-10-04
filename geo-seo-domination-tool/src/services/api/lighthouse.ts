import axios from 'axios'
import type { LighthouseScores } from '@/types'

const PSI_API_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export class LighthouseService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async auditPage(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<LighthouseScores> {
    try {
      const response = await axios.get(PSI_API_BASE, {
        params: {
          url,
          key: this.apiKey,
          strategy,
          category: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
        },
      })

      const { lighthouseResult } = response.data
      const categories = lighthouseResult.categories

      return {
        performance: Math.round(categories.performance?.score * 100) || 0,
        accessibility: Math.round(categories.accessibility?.score * 100) || 0,
        best_practices: Math.round(categories['best-practices']?.score * 100) || 0,
        seo: Math.round(categories.seo?.score * 100) || 0,
        pwa: categories.pwa ? Math.round(categories.pwa.score * 100) : undefined,
      }
    } catch (error) {
      console.error('Lighthouse audit error:', error)
      throw error
    }
  }

  async getDetailedAudit(url: string, strategy: 'mobile' | 'desktop' = 'mobile') {
    try {
      const response = await axios.get(PSI_API_BASE, {
        params: {
          url,
          key: this.apiKey,
          strategy,
        },
      })

      const { lighthouseResult } = response.data
      const audits = lighthouseResult.audits

      return {
        scores: {
          performance: Math.round(lighthouseResult.categories.performance?.score * 100) || 0,
          accessibility: Math.round(lighthouseResult.categories.accessibility?.score * 100) || 0,
          best_practices: Math.round(lighthouseResult.categories['best-practices']?.score * 100) || 0,
          seo: Math.round(lighthouseResult.categories.seo?.score * 100) || 0,
        },
        metrics: {
          fcp: audits['first-contentful-paint']?.displayValue,
          lcp: audits['largest-contentful-paint']?.displayValue,
          tbt: audits['total-blocking-time']?.displayValue,
          cls: audits['cumulative-layout-shift']?.displayValue,
          si: audits['speed-index']?.displayValue,
        },
        opportunities: Object.entries(audits)
          .filter(([_, audit]: [string, any]) => audit.score !== null && audit.score < 0.9 && audit.details?.type === 'opportunity')
          .map(([id, audit]: [string, any]) => ({
            id,
            title: audit.title,
            description: audit.description,
            score: audit.score,
            displayValue: audit.displayValue,
          })),
        passed: Object.entries(audits)
          .filter(([_, audit]: [string, any]) => audit.score === 1)
          .map(([id, audit]: [string, any]) => ({
            id,
            title: audit.title,
          })),
      }
    } catch (error) {
      console.error('Detailed Lighthouse audit error:', error)
      throw error
    }
  }
}
