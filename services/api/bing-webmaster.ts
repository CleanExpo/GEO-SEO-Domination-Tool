import axios from 'axios';

// Bing Webmaster Tools API Client
// Docs: https://learn.microsoft.com/en-us/bingwebmaster/getting-access

const BING_API_BASE = 'https://ssl.bing.com/webmaster/api.svc/json';

export interface BingUrlStatistics {
  CrawledUrls: number;
  IndexedUrls: number;
  InlinksCount: number;
}

export interface BingQueryStats {
  Query: string;
  Impressions: number;
  Clicks: number;
}

export interface BingPageStats {
  Url: string;
  Impressions: number;
  Clicks: number;
}

export interface BingSeoReport {
  SeoScore: number;
  Issues: Array<{
    Severity: 'High' | 'Medium' | 'Low';
    IssueType: string;
    Count: number;
  }>;
}

export interface BingCrawlStats {
  CrawlDate: string;
  CrawledPages: number;
  CrawlErrors: number;
  BlockedUrls: number;
}

export interface BingLinksData {
  TotalInboundLinks: number;
  TotalLinkingDomains: number;
  Links: Array<{
    SourceUrl: string;
    TargetUrl: string;
    AnchorText: string;
    LinkDate: string;
  }>;
}

export class BingWebmasterService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get URL statistics (crawled, indexed, inlinks)
   */
  async getUrlStatistics(siteUrl: string): Promise<BingUrlStatistics> {
    try {
      const response = await axios.get(`${BING_API_BASE}/GetUrlStatistics`, {
        params: {
          apikey: this.apiKey,
          siteUrl,
        },
      });

      return response.data.d || {};
    } catch (error: any) {
      console.error('[Bing] URL statistics error:', error.response?.data || error.message);
      throw new Error(`Bing URL statistics failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Get query statistics (keywords, impressions, clicks)
   */
  async getQueryStats(siteUrl: string): Promise<BingQueryStats[]> {
    try {
      const response = await axios.get(`${BING_API_BASE}/GetQueryStats`, {
        params: {
          apikey: this.apiKey,
          siteUrl,
        },
      });

      return response.data.d || [];
    } catch (error: any) {
      console.error('[Bing] Query stats error:', error.response?.data || error.message);
      throw new Error(`Bing query stats failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Get page statistics (URLs, impressions, clicks)
   */
  async getPageStats(siteUrl: string): Promise<BingPageStats[]> {
    try {
      const response = await axios.get(`${BING_API_BASE}/GetPageStats`, {
        params: {
          apikey: this.apiKey,
          siteUrl,
        },
      });

      return response.data.d || [];
    } catch (error: any) {
      console.error('[Bing] Page stats error:', error.response?.data || error.message);
      throw new Error(`Bing page stats failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Get SEO reports and score
   */
  async getSeoReport(siteUrl: string): Promise<BingSeoReport> {
    try {
      const response = await axios.get(`${BING_API_BASE}/GetSeoReport`, {
        params: {
          apikey: this.apiKey,
          siteUrl,
        },
      });

      return response.data.d || { SeoScore: 0, Issues: [] };
    } catch (error: any) {
      console.error('[Bing] SEO report error:', error.response?.data || error.message);
      throw new Error(`Bing SEO report failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Get crawl statistics
   */
  async getCrawlStats(siteUrl: string): Promise<BingCrawlStats> {
    try {
      const response = await axios.get(`${BING_API_BASE}/GetCrawlStats`, {
        params: {
          apikey: this.apiKey,
          siteUrl,
        },
      });

      return response.data.d || {};
    } catch (error: any) {
      console.error('[Bing] Crawl stats error:', error.response?.data || error.message);
      throw new Error(`Bing crawl stats failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Get inbound links data
   */
  async getLinksData(siteUrl: string, pageSize: number = 100): Promise<BingLinksData> {
    try {
      const response = await axios.get(`${BING_API_BASE}/GetInboundLinks`, {
        params: {
          apikey: this.apiKey,
          siteUrl,
          pageSize,
        },
      });

      return response.data.d || { TotalInboundLinks: 0, TotalLinkingDomains: 0, Links: [] };
    } catch (error: any) {
      console.error('[Bing] Links data error:', error.response?.data || error.message);
      throw new Error(`Bing links data failed: ${error.response?.data?.Message || error.message}`);
    }
  }

  /**
   * Get comprehensive baseline vitals from Bing
   */
  async getBaselineVitals(siteUrl: string) {
    try {
      console.log(`[Bing] Fetching baseline vitals for ${siteUrl}`);

      const [urlStats, queryStats, pageStats, seoReport, crawlStats, linksData] = await Promise.all([
        this.getUrlStatistics(siteUrl),
        this.getQueryStats(siteUrl),
        this.getPageStats(siteUrl),
        this.getSeoReport(siteUrl),
        this.getCrawlStats(siteUrl),
        this.getLinksData(siteUrl, 100),
      ]);

      // Calculate overall metrics
      const totalImpressions = queryStats.reduce((sum, q) => sum + q.Impressions, 0);
      const totalClicks = queryStats.reduce((sum, q) => sum + q.Clicks, 0);
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Top queries by impressions
      const topQueries = queryStats
        .sort((a, b) => b.Impressions - a.Impressions)
        .slice(0, 10)
        .map(q => ({
          query: q.Query,
          impressions: q.Impressions,
          clicks: q.Clicks,
          ctr: q.Impressions > 0 ? (q.Clicks / q.Impressions) * 100 : 0,
        }));

      // Top pages by clicks
      const topPages = pageStats
        .sort((a, b) => b.Clicks - a.Clicks)
        .slice(0, 10)
        .map(p => ({
          url: p.Url,
          clicks: p.Clicks,
          impressions: p.Impressions,
          ctr: p.Impressions > 0 ? (p.Clicks / p.Impressions) * 100 : 0,
        }));

      return {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: Math.round(ctr * 100) / 100,
        seoScore: seoReport.SeoScore || 0,
        pagesIndexed: urlStats.IndexedUrls || 0,
        crawlErrors: crawlStats.CrawlErrors || 0,
        blockedUrls: crawlStats.BlockedUrls || 0,
        mobileFriendly: true, // Bing doesn't provide direct mobile-friendly test
        backlinks: linksData.TotalInboundLinks || 0,
        linkingDomains: linksData.TotalLinkingDomains || 0,
        crawlRate: crawlStats.CrawledPages || 0,
        lastCrawlDate: crawlStats.CrawlDate || new Date().toISOString(),
        topQueries,
        topPages,
        seoIssues: seoReport.Issues || [],
        capturedAt: new Date().toISOString(),
        rawData: {
          urlStats,
          queryStats: queryStats.slice(0, 20),
          pageStats: pageStats.slice(0, 20),
          seoReport,
          crawlStats,
          linksData: {
            ...linksData,
            Links: linksData.Links?.slice(0, 20), // Store first 20 links
          },
        },
      };
    } catch (error: any) {
      console.error('[Bing] Baseline vitals error:', error.message);
      throw error;
    }
  }
}

// Export factory function
export function createBingService(apiKey?: string): BingWebmasterService | null {
  if (!apiKey) {
    console.warn('[Bing] No API key provided');
    return null;
  }

  return new BingWebmasterService(apiKey);
}
