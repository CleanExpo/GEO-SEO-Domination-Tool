import axios from 'axios';

// Google Search Console API Client
// Docs: https://developers.google.com/webmaster-tools/search-console-api-original

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';

export interface GSCSearchAnalyticsQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'searchAppearance')[];
  rowLimit?: number; // Max 25,000
  startRow?: number;
  aggregationType?: 'auto' | 'byPage' | 'byProperty';
  dataState?: 'final' | 'all';
}

export interface GSCSearchAnalyticsRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCSearchAnalyticsResponse {
  rows?: GSCSearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface GSCSitemapStatus {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  type?: string;
  lastDownloaded?: string;
  warnings?: number;
  errors?: number;
}

export interface GSCUrlCrawlErrorCount {
  count: number;
  timestamp: string;
}

export interface GSCCoverageIssue {
  url: string;
  issue: string;
  lastCrawl?: string;
}

export class GoogleSearchConsoleService {
  private apiKey: string;
  private accessToken?: string; // For OAuth flows

  constructor(apiKey: string, accessToken?: string) {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  /**
   * Get search analytics data (impressions, clicks, CTR, position)
   * @param siteUrl - Verified site URL (e.g., "https://example.com/")
   * @param query - Query parameters
   */
  async getSearchAnalytics(
    siteUrl: string,
    query: GSCSearchAnalyticsQuery
  ): Promise<GSCSearchAnalyticsResponse> {
    try {
      const url = `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await axios.post(url, query, {
        headers,
        params: this.accessToken ? {} : { key: this.apiKey },
      });

      return response.data;
    } catch (error: any) {
      console.error('[GSC] Search analytics error:', error.response?.data || error.message);
      throw new Error(`GSC search analytics failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get overall performance metrics for the last 28 days
   */
  async getOverallMetrics(siteUrl: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const query: GSCSearchAnalyticsQuery = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      rowLimit: 1,
    };

    const data = await this.getSearchAnalytics(siteUrl, query);

    if (!data.rows || data.rows.length === 0) {
      return {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        avgPosition: 0,
      };
    }

    const row = data.rows[0];
    return {
      impressions: row.impressions,
      clicks: row.clicks,
      ctr: row.ctr,
      avgPosition: row.position,
    };
  }

  /**
   * Get top keywords by impressions
   */
  async getTopKeywords(siteUrl: string, limit: number = 10) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const query: GSCSearchAnalyticsQuery = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: limit,
    };

    const data = await this.getSearchAnalytics(siteUrl, query);

    return (data.rows || []).map(row => ({
      keyword: row.keys?.[0] || '',
      position: row.position,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
    }));
  }

  /**
   * Get top pages by clicks
   */
  async getTopPages(siteUrl: string, limit: number = 10) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const query: GSCSearchAnalyticsQuery = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['page'],
      rowLimit: limit,
    };

    const data = await this.getSearchAnalytics(siteUrl, query);

    return (data.rows || []).map(row => ({
      url: row.keys?.[0] || '',
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Get mobile vs desktop traffic split
   */
  async getDeviceSplit(siteUrl: string) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const query: GSCSearchAnalyticsQuery = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['device'],
      rowLimit: 10,
    };

    const data = await this.getSearchAnalytics(siteUrl, query);

    const devices = (data.rows || []).reduce((acc: any, row) => {
      const device = row.keys?.[0] || 'unknown';
      acc[device] = {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
      };
      return acc;
    }, {});

    return devices;
  }

  /**
   * List sitemaps submitted to GSC
   */
  async listSitemaps(siteUrl: string): Promise<GSCSitemapStatus[]> {
    try {
      const url = `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/sitemaps`;

      const headers: any = {};
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await axios.get(url, {
        headers,
        params: this.accessToken ? {} : { key: this.apiKey },
      });

      return response.data.sitemap || [];
    } catch (error: any) {
      console.error('[GSC] List sitemaps error:', error.response?.data || error.message);
      throw new Error(`GSC list sitemaps failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get sitemap details (errors, warnings)
   */
  async getSitemap(siteUrl: string, sitemapUrl: string): Promise<GSCSitemapStatus> {
    try {
      const url = `${GSC_API_BASE}/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;

      const headers: any = {};
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await axios.get(url, {
        headers,
        params: this.accessToken ? {} : { key: this.apiKey },
      });

      return response.data;
    } catch (error: any) {
      console.error('[GSC] Get sitemap error:', error.response?.data || error.message);
      throw new Error(`GSC get sitemap failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get indexation status summary
   */
  async getIndexationStatus(siteUrl: string) {
    try {
      // Note: This requires the new Search Console API (Inspection API)
      // For now, we estimate from sitemaps data
      const sitemaps = await this.listSitemaps(siteUrl);

      const totalSubmitted = sitemaps.reduce((sum, sitemap) => {
        // Estimate: sitemaps don't always return count directly
        return sum + (sitemap.errors || 0) + (sitemap.warnings || 0);
      }, 0);

      const totalErrors = sitemaps.reduce((sum, sitemap) => sum + (sitemap.errors || 0), 0);
      const totalWarnings = sitemaps.reduce((sum, sitemap) => sum + (sitemap.warnings || 0), 0);

      return {
        submittedPages: totalSubmitted,
        errors: totalErrors,
        warnings: totalWarnings,
        sitemaps: sitemaps.length,
      };
    } catch (error: any) {
      console.error('[GSC] Indexation status error:', error.message);
      return {
        submittedPages: 0,
        errors: 0,
        warnings: 0,
        sitemaps: 0,
      };
    }
  }

  /**
   * Get comprehensive baseline vitals from GSC
   */
  async getBaselineVitals(siteUrl: string) {
    try {
      console.log(`[GSC] Fetching baseline vitals for ${siteUrl}`);

      const [
        overallMetrics,
        topKeywords,
        topPages,
        deviceSplit,
        indexation,
      ] = await Promise.all([
        this.getOverallMetrics(siteUrl),
        this.getTopKeywords(siteUrl, 10),
        this.getTopPages(siteUrl, 10),
        this.getDeviceSplit(siteUrl),
        this.getIndexationStatus(siteUrl),
      ]);

      return {
        impressions: overallMetrics.impressions,
        clicks: overallMetrics.clicks,
        ctr: overallMetrics.ctr,
        avgPosition: overallMetrics.avgPosition,
        topKeywords,
        topPages,
        deviceSplit,
        indexedPages: indexation.submittedPages,
        coverageIssues: indexation.errors + indexation.warnings,
        sitemaps: indexation.sitemaps,
        capturedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[GSC] Baseline vitals error:', error.message);
      throw error;
    }
  }
}

// Export factory function
export function createGSCService(apiKey?: string, accessToken?: string): GoogleSearchConsoleService | null {
  if (!apiKey && !accessToken) {
    console.warn('[GSC] No API key or access token provided');
    return null;
  }

  return new GoogleSearchConsoleService(apiKey || '', accessToken);
}
