import axios from 'axios'

const PSI_API_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export interface LighthouseScores {
  performance: number
  accessibility: number
  best_practices: number
  seo: number
  pwa?: number
}

export class LighthouseService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async auditPage(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<LighthouseScores> {
    try {
      // Build URL with multiple category parameters (required by PSI API)
      const requestedCategories = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'];
      const categoryParams = requestedCategories.map(cat => `category=${cat}`).join('&');
      const apiUrl = `${PSI_API_BASE}?url=${encodeURIComponent(url)}&key=${this.apiKey}&strategy=${strategy}&${categoryParams}`;

      const response = await axios.get(apiUrl)

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
      // Build URL with all categories (required for full audit data)
      const requestedCategories = ['performance', 'accessibility', 'best-practices', 'seo'];
      const categoryParams = requestedCategories.map(cat => `category=${cat}`).join('&');
      const apiUrl = `${PSI_API_BASE}?url=${encodeURIComponent(url)}&key=${this.apiKey}&strategy=${strategy}&${categoryParams}`;

      const response = await axios.get(apiUrl)

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
