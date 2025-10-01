import FirecrawlApp, { ScrapeResponse, CrawlResponse } from '@mendable/firecrawl-js'

export interface FirecrawlConfig {
  apiKey: string
}

export interface ScrapeOptions {
  formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[]
  onlyMainContent?: boolean
  includeTags?: string[]
  excludeTags?: string[]
  waitFor?: number
  timeout?: number
}

export interface CrawlOptions {
  maxDepth?: number
  limit?: number
  allowBackwardLinks?: boolean
  allowExternalLinks?: boolean
  ignoreSitemap?: boolean
  scrapeOptions?: ScrapeOptions
}

export interface ScrapedData {
  url: string
  markdown?: string
  html?: string
  rawHtml?: string
  links?: string[]
  screenshot?: string
  metadata?: {
    title?: string
    description?: string
    keywords?: string
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
  }
  timestamp: Date
}

export class FirecrawlService {
  private app: FirecrawlApp
  private config: FirecrawlConfig

  constructor(config: FirecrawlConfig) {
    this.config = config
    this.app = new FirecrawlApp({ apiKey: config.apiKey })
  }

  // Scrape a single URL
  async scrapeUrl(url: string, options?: ScrapeOptions): Promise<ScrapedData> {
    try {
      const response = await this.app.scrapeUrl(url, {
        formats: options?.formats || ['markdown', 'html', 'links'],
        onlyMainContent: options?.onlyMainContent ?? true,
        includeTags: options?.includeTags,
        excludeTags: options?.excludeTags,
        waitFor: options?.waitFor,
        timeout: options?.timeout,
      })

      // Check if response is an error
      if ('success' in response && !response.success) {
        throw new Error(response.error || 'Failed to scrape URL')
      }

      return {
        url,
        markdown: response.markdown,
        html: response.html,
        rawHtml: response.rawHtml,
        links: response.links,
        screenshot: response.screenshot,
        metadata: response.metadata ? {
          title: response.metadata.title,
          description: response.metadata.description,
          keywords: response.metadata.keywords,
          ogTitle: response.metadata.ogTitle,
          ogDescription: response.metadata.ogDescription,
          ogImage: response.metadata.ogImage,
        } : undefined,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('Error scraping URL:', error)
      throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Crawl an entire website
  async crawlWebsite(
    url: string,
    options?: CrawlOptions,
    onProgress?: (status: string, current: number, total: number) => void
  ): Promise<ScrapedData[]> {
    try {
      const crawlResponse = await this.app.crawlUrl(url, {
        maxDepth: options?.maxDepth || 2,
        limit: options?.limit || 10,
        allowBackwardLinks: options?.allowBackwardLinks ?? false,
        allowExternalLinks: options?.allowExternalLinks ?? false,
        ignoreSitemap: options?.ignoreSitemap ?? false,
        scrapeOptions: {
          formats: options?.scrapeOptions?.formats || ['markdown', 'html'],
          onlyMainContent: options?.scrapeOptions?.onlyMainContent ?? true,
        },
      })

      // Poll for crawl status
      let status = 'scraping'
      const results: ScrapedData[] = []
      let pollCount = 0
      const maxPolls = 60 // 5 minutes max

      while (status === 'scraping' && pollCount < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

        const statusResponse = await this.app.checkCrawlStatus(crawlResponse.id)
        status = statusResponse.status

        if (onProgress) {
          onProgress(
            status,
            statusResponse.completed || 0,
            statusResponse.total || 0
          )
        }

        if (status === 'completed' && statusResponse.data) {
          for (const page of statusResponse.data) {
            results.push({
              url: page.url || url,
              markdown: page.markdown,
              html: page.html,
              rawHtml: page.rawHtml,
              links: page.links,
              screenshot: page.screenshot,
              metadata: page.metadata ? {
                title: page.metadata.title,
                description: page.metadata.description,
                keywords: page.metadata.keywords,
                ogTitle: page.metadata.ogTitle,
                ogDescription: page.metadata.ogDescription,
                ogImage: page.metadata.ogImage,
              } : undefined,
              timestamp: new Date(),
            })
          }
        }

        pollCount++
      }

      if (status !== 'completed') {
        throw new Error('Crawl timed out or failed')
      }

      return results
    } catch (error) {
      console.error('Error crawling website:', error)
      throw new Error(`Failed to crawl ${url}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Scrape multiple URLs
  async scrapeMultipleUrls(urls: string[], options?: ScrapeOptions): Promise<ScrapedData[]> {
    const results: ScrapedData[] = []

    for (const url of urls) {
      try {
        const data = await this.scrapeUrl(url, options)
        results.push(data)
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error)
        // Continue with next URL
      }
    }

    return results
  }

  // Extract structured data from URL
  async extractData(url: string, schema: Record<string, any>): Promise<any> {
    try {
      const data = await this.scrapeUrl(url, {
        formats: ['markdown'],
        onlyMainContent: true,
      })

      // Use AI to extract structured data based on schema
      // This would integrate with Claude or OpenAI
      // For now, returning the scraped data
      return {
        url,
        extractedData: data.metadata,
        rawContent: data.markdown,
      }
    } catch (error) {
      console.error('Error extracting data:', error)
      throw error
    }
  }

  // Scrape for SEO analysis
  async scrapForSEO(url: string): Promise<{
    url: string
    title?: string
    description?: string
    keywords?: string
    headings: { h1: string[], h2: string[], h3: string[] }
    images: { src: string, alt?: string }[]
    links: { internal: string[], external: string[] }
    wordCount: number
    readabilityScore?: number
  }> {
    try {
      const data = await this.scrapeUrl(url, {
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: false,
      })

      // Extract headings from markdown
      const headings = this.extractHeadings(data.markdown || '')

      // Classify links
      const links = this.classifyLinks(url, data.links || [])

      // Extract images (simplified)
      const images = this.extractImages(data.html || '')

      // Calculate word count
      const wordCount = (data.markdown || '').split(/\s+/).length

      return {
        url,
        title: data.metadata?.title,
        description: data.metadata?.description,
        keywords: data.metadata?.keywords,
        headings,
        images,
        links,
        wordCount,
      }
    } catch (error) {
      console.error('Error scraping for SEO:', error)
      throw error
    }
  }

  // Helper: Extract headings from markdown
  private extractHeadings(markdown: string): { h1: string[], h2: string[], h3: string[] } {
    const h1 = markdown.match(/^# (.+)$/gm)?.map(h => h.replace('# ', '')) || []
    const h2 = markdown.match(/^## (.+)$/gm)?.map(h => h.replace('## ', '')) || []
    const h3 = markdown.match(/^### (.+)$/gm)?.map(h => h.replace('### ', '')) || []

    return { h1, h2, h3 }
  }

  // Helper: Classify internal vs external links
  private classifyLinks(baseUrl: string, links: string[]): { internal: string[], external: string[] } {
    const base = new URL(baseUrl)
    const internal: string[] = []
    const external: string[] = []

    for (const link of links) {
      try {
        const linkUrl = new URL(link, baseUrl)
        if (linkUrl.hostname === base.hostname) {
          internal.push(link)
        } else {
          external.push(link)
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return { internal, external }
  }

  // Helper: Extract images from HTML
  private extractImages(html: string): { src: string, alt?: string }[] {
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/g
    const images: { src: string, alt?: string }[] = []
    let match

    while ((match = imgRegex.exec(html)) !== null) {
      images.push({
        src: match[1],
        alt: match[2] || undefined,
      })
    }

    return images
  }

  // Batch scrape with rate limiting
  async batchScrape(
    urls: string[],
    options?: ScrapeOptions,
    batchSize: number = 5,
    delayMs: number = 1000
  ): Promise<Map<string, ScrapedData | Error>> {
    const results = new Map<string, ScrapedData | Error>()

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize)

      const promises = batch.map(async (url) => {
        try {
          const data = await this.scrapeUrl(url, options)
          results.set(url, data)
        } catch (error) {
          results.set(url, error as Error)
        }
      })

      await Promise.all(promises)

      // Delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    return results
  }
}

// Factory function
export const createFirecrawlService = (apiKey: string): FirecrawlService => {
  return new FirecrawlService({ apiKey })
}
