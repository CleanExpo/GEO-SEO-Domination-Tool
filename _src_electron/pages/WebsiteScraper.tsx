import { useState } from 'react'

interface ScrapedData {
  url: string
  title?: string
  description?: string
  markdown?: string
  html?: string
  links?: string[]
  metadata?: Record<string, any>
  timestamp: Date
}

interface SEOAnalysis {
  url: string
  title?: string
  description?: string
  keywords?: string
  headings: { h1: string[], h2: string[], h3: string[] }
  images: { src: string, alt?: string }[]
  links: { internal: string[], external: string[] }
  wordCount: number
}

export default function WebsiteScraper() {
  const [mode, setMode] = useState<'single' | 'crawl' | 'batch' | 'seo'>('single')
  const [url, setUrl] = useState('')
  const [urls, setUrls] = useState('')
  const [maxDepth, setMaxDepth] = useState(2)
  const [pageLimit, setPageLimit] = useState(10)
  const [onlyMainContent, setOnlyMainContent] = useState(true)

  const [isScraping, setIsScraping] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' })
  const [scrapedData, setScrapedData] = useState<ScrapedData[]>([])
  const [seoAnalysis, setSeoAnalysis] = useState<SEOAnalysis | null>(null)
  const [selectedData, setSelectedData] = useState<ScrapedData | null>(null)

  const handleScrape = async () => {
    if (!url && !urls) return

    setIsScraping(true)
    setScrapedData([])
    setSeoAnalysis(null)
    setProgress({ current: 0, total: 0, status: 'Starting...' })

    // Simulate scraping process
    try {
      if (mode === 'single') {
        setProgress({ current: 1, total: 1, status: 'Scraping page...' })
        await new Promise(resolve => setTimeout(resolve, 2000))

        const data: ScrapedData = {
          url,
          title: 'Example Page Title',
          description: 'This is an example page description from the scraped website.',
          markdown: '# Example Heading\n\nThis is the main content of the page...\n\n## Subheading\n\nMore content here.',
          html: '<h1>Example Heading</h1><p>This is the main content...</p>',
          links: ['https://example.com/page1', 'https://example.com/page2'],
          metadata: {
            ogTitle: 'Example OG Title',
            ogDescription: 'Example OG Description',
            keywords: 'example, keywords, test',
          },
          timestamp: new Date(),
        }

        setScrapedData([data])
        setSelectedData(data)
        setProgress({ current: 1, total: 1, status: 'Completed' })

      } else if (mode === 'crawl') {
        const totalPages = pageLimit
        for (let i = 1; i <= totalPages; i++) {
          setProgress({ current: i, total: totalPages, status: `Crawling page ${i}/${totalPages}...` })
          await new Promise(resolve => setTimeout(resolve, 1000))

          const data: ScrapedData = {
            url: `${url}/page-${i}`,
            title: `Page ${i} Title`,
            description: `Description for page ${i}`,
            markdown: `# Page ${i}\n\nContent for page ${i}...`,
            timestamp: new Date(),
          }

          setScrapedData(prev => [...prev, data])
        }

        setProgress({ current: totalPages, total: totalPages, status: 'Crawl completed' })

      } else if (mode === 'batch') {
        const urlList = urls.split('\n').filter(u => u.trim())
        for (let i = 0; i < urlList.length; i++) {
          setProgress({ current: i + 1, total: urlList.length, status: `Scraping ${i + 1}/${urlList.length}...` })
          await new Promise(resolve => setTimeout(resolve, 1500))

          const data: ScrapedData = {
            url: urlList[i].trim(),
            title: `Title for ${urlList[i]}`,
            description: `Description for ${urlList[i]}`,
            markdown: `# Content\n\nScraped content from ${urlList[i]}...`,
            timestamp: new Date(),
          }

          setScrapedData(prev => [...prev, data])
        }

        setProgress({ current: urlList.length, total: urlList.length, status: 'Batch completed' })

      } else if (mode === 'seo') {
        setProgress({ current: 1, total: 1, status: 'Analyzing SEO...' })
        await new Promise(resolve => setTimeout(resolve, 2500))

        const analysis: SEOAnalysis = {
          url,
          title: 'Example SEO Page Title - Keywords Here',
          description: 'This is the meta description optimized for search engines with relevant keywords.',
          keywords: 'SEO, optimization, keywords, analysis, ranking',
          headings: {
            h1: ['Main Page Heading'],
            h2: ['First Subheading', 'Second Subheading', 'Third Subheading'],
            h3: ['Detail 1', 'Detail 2', 'Detail 3', 'Detail 4'],
          },
          images: [
            { src: '/hero-image.jpg', alt: 'Hero image with descriptive alt text' },
            { src: '/product-1.jpg', alt: 'Product showcase image' },
            { src: '/banner.jpg', alt: '' },
          ],
          links: {
            internal: ['/about', '/services', '/contact', '/blog', '/products'],
            external: ['https://example.com', 'https://partner.com'],
          },
          wordCount: 1247,
        }

        setSeoAnalysis(analysis)
        setProgress({ current: 1, total: 1, status: 'SEO analysis completed' })
      }

    } catch (error) {
      setProgress({ current: 0, total: 0, status: `Error: ${error}` })
    } finally {
      setIsScraping(false)
    }
  }

  const exportData = (format: 'json' | 'csv' | 'markdown') => {
    if (scrapedData.length === 0 && !seoAnalysis) return

    let content = ''
    let filename = ''

    if (format === 'json') {
      content = JSON.stringify(seoAnalysis || scrapedData, null, 2)
      filename = `scraped-data-${Date.now()}.json`
    } else if (format === 'csv') {
      const headers = 'URL,Title,Description,Word Count,Links\n'
      const rows = scrapedData.map(d =>
        `"${d.url}","${d.title}","${d.description}",${d.markdown?.split(' ').length || 0},${d.links?.length || 0}`
      ).join('\n')
      content = headers + rows
      filename = `scraped-data-${Date.now()}.csv`
    } else if (format === 'markdown') {
      content = scrapedData.map(d => d.markdown).join('\n\n---\n\n')
      filename = `scraped-content-${Date.now()}.md`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Website Scraper</h1>
        <p className="text-muted-foreground">
          Scrape and crawl websites with Firecrawl API - Extract content, analyze SEO, and more
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode Selection */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Scraping Mode</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'single', name: 'Single Page', icon: '📄' },
                { id: 'crawl', name: 'Full Crawl', icon: '🕷️' },
                { id: 'batch', name: 'Batch URLs', icon: '📋' },
                { id: 'seo', name: 'SEO Analysis', icon: '📊' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`p-4 rounded-lg border transition-all ${
                    mode === m.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{m.icon}</div>
                  <div className="text-sm font-medium">{m.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>

            {mode === 'batch' ? (
              <div>
                <label className="block text-sm font-medium mb-2">URLs (one per line)</label>
                <textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder="https://example.com&#10;https://example.com/page1&#10;https://example.com/page2"
                  rows={6}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md font-mono text-sm"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Website URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  />
                </div>

                {mode === 'crawl' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Max Depth</label>
                        <input
                          type="number"
                          value={maxDepth}
                          onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                          min="1"
                          max="5"
                          className="w-full px-3 py-2 bg-background border border-input rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Page Limit</label>
                        <input
                          type="number"
                          value={pageLimit}
                          onChange={(e) => setPageLimit(parseInt(e.target.value))}
                          min="1"
                          max="100"
                          className="w-full px-3 py-2 bg-background border border-input rounded-md"
                        />
                      </div>
                    </div>
                  </>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyMainContent}
                    onChange={(e) => setOnlyMainContent(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Extract only main content (remove headers, footers, ads)</span>
                </label>
              </div>
            )}

            <button
              onClick={handleScrape}
              disabled={isScraping || (!url && !urls)}
              className="mt-6 w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isScraping ? '⏳ Scraping...' : `🚀 Start ${mode === 'seo' ? 'Analysis' : 'Scraping'}`}
            </button>
          </div>

          {/* Progress */}
          {isScraping && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold mb-3">Progress</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {progress.status} ({progress.current}/{progress.total || '?'})
              </p>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-4">Results</h2>

            {scrapedData.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Scraped {scrapedData.length} page{scrapedData.length !== 1 ? 's' : ''}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scrapedData.map((data, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedData(data)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedData === data
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{data.title || 'Untitled'}</div>
                      <div className="text-xs text-muted-foreground truncate">{data.url}</div>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-3">Export Data</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportData('json')}
                      className="flex-1 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => exportData('csv')}
                      className="flex-1 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportData('markdown')}
                      className="flex-1 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
                    >
                      MD
                    </button>
                  </div>
                </div>
              </div>
            )}

            {seoAnalysis && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Title</p>
                  <p className="text-sm font-medium">{seoAnalysis.title}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{seoAnalysis.description}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Word Count</p>
                  <p className="text-2xl font-bold">{seoAnalysis.wordCount}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Headings</p>
                  <div className="text-sm space-y-1">
                    <p>H1: {seoAnalysis.headings.h1.length}</p>
                    <p>H2: {seoAnalysis.headings.h2.length}</p>
                    <p>H3: {seoAnalysis.headings.h3.length}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Links</p>
                  <div className="text-sm space-y-1">
                    <p>Internal: {seoAnalysis.links.internal.length}</p>
                    <p>External: {seoAnalysis.links.external.length}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Images</p>
                  <p className="text-sm">{seoAnalysis.images.length} images</p>
                  <p className="text-xs text-muted-foreground">
                    {seoAnalysis.images.filter(img => !img.alt).length} missing alt text
                  </p>
                </div>
              </div>
            )}

            {!isScraping && scrapedData.length === 0 && !seoAnalysis && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No data yet. Start scraping to see results.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed View Modal */}
      {selectedData && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">{selectedData.title}</h2>
                <p className="text-sm text-muted-foreground">{selectedData.url}</p>
              </div>
              <button
                onClick={() => setSelectedData(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {selectedData.description && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm">{selectedData.description}</p>
              </div>
            )}

            {selectedData.markdown && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Content</h3>
                <pre className="p-4 bg-background rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                  {selectedData.markdown}
                </pre>
              </div>
            )}

            {selectedData.links && selectedData.links.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Links ({selectedData.links.length})</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {selectedData.links.map((link, i) => (
                    <div key={i} className="text-sm text-muted-foreground truncate">
                      {link}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
