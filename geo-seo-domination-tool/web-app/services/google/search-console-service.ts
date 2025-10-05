/**
 * Google Search Console API Service
 *
 * Get REAL ranking data directly from Google - 100% accurate!
 *
 * FREE API with generous quota:
 * - 200 requests per day
 * - Up to 25,000 rows per query
 * - Historical data going back 16 months
 *
 * Data includes:
 * - Exact average position for each keyword
 * - Clicks, impressions, CTR
 * - Device breakdown (mobile, desktop, tablet)
 * - Country breakdown
 * - Page-level performance
 */

export interface GSCRankingRow {
  keyword: string;
  page: string;
  country?: string;
  device?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number; // Exact average position from Google
}

export interface GSCQueryParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'date')[];
  rowLimit?: number; // Max 25000
  startRow?: number; // For pagination
}

class SearchConsoleService {
  private baseURL = 'https://www.googleapis.com/webmasters/v3';

  /**
   * Get ranking data from Google Search Console
   * Requires OAuth token from user
   */
  async getRankings(
    siteUrl: string,
    accessToken: string,
    params?: Partial<GSCQueryParams>
  ): Promise<GSCRankingRow[]> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate = new Date().toISOString().split('T')[0],
      dimensions = ['query', 'page', 'country', 'device'],
      rowLimit = 25000,
      startRow = 0,
    } = params || {};

    const response = await fetch(
      `${this.baseURL}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions,
          rowLimit,
          startRow,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Search Console API error: ${error}`);
    }

    const data = await response.json();

    if (!data.rows || data.rows.length === 0) {
      return [];
    }

    // Map response to typed format
    return data.rows.map((row: any) => {
      const result: GSCRankingRow = {
        keyword: '',
        page: '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: Math.round(row.position * 10) / 10, // Round to 1 decimal
      };

      // Extract dimension values based on requested dimensions
      dimensions.forEach((dim, index) => {
        const value = row.keys[index];
        switch (dim) {
          case 'query':
            result.keyword = value;
            break;
          case 'page':
            result.page = value;
            break;
          case 'country':
            result.country = value;
            break;
          case 'device':
            result.device = value;
            break;
        }
      });

      return result;
    });
  }

  /**
   * Get top performing keywords
   */
  async getTopKeywords(
    siteUrl: string,
    accessToken: string,
    limit = 100
  ): Promise<GSCRankingRow[]> {
    return this.getRankings(siteUrl, accessToken, {
      dimensions: ['query'],
      rowLimit: limit,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
  }

  /**
   * Get top performing pages
   */
  async getTopPages(
    siteUrl: string,
    accessToken: string,
    limit = 100
  ): Promise<GSCRankingRow[]> {
    return this.getRankings(siteUrl, accessToken, {
      dimensions: ['page'],
      rowLimit: limit,
    });
  }

  /**
   * Get rankings for specific keyword
   */
  async getKeywordRankings(
    siteUrl: string,
    accessToken: string,
    keyword: string
  ): Promise<GSCRankingRow[]> {
    const allRankings = await this.getRankings(siteUrl, accessToken, {
      dimensions: ['query', 'page', 'device'],
    });

    return allRankings.filter(row =>
      row.keyword.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Get historical ranking data for a keyword
   */
  async getKeywordHistory(
    siteUrl: string,
    accessToken: string,
    keyword: string,
    days = 90
  ): Promise<Array<{ date: string; position: number; clicks: number; impressions: number }>> {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const response = await fetch(
      `${this.baseURL}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['date', 'query'],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: 'query',
                  expression: keyword,
                  operator: 'equals',
                },
              ],
            },
          ],
          rowLimit: 1000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Search Console API error: ${error}`);
    }

    const data = await response.json();

    if (!data.rows) {
      return [];
    }

    return data.rows.map((row: any) => ({
      date: row.keys[0],
      position: Math.round(row.position * 10) / 10,
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
    }));
  }

  /**
   * Get device breakdown for a keyword
   */
  async getDeviceBreakdown(
    siteUrl: string,
    accessToken: string,
    keyword?: string
  ): Promise<Array<{ device: string; position: number; clicks: number; ctr: number }>> {
    const params: any = {
      dimensions: ['device'],
      rowLimit: 10,
    };

    if (keyword) {
      params.dimensionFilterGroups = [
        {
          filters: [
            {
              dimension: 'query',
              expression: keyword,
              operator: 'equals',
            },
          ],
        },
      ];
    }

    const response = await fetch(
      `${this.baseURL}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Search Console API error: ${error}`);
    }

    const data = await response.json();

    if (!data.rows) {
      return [];
    }

    return data.rows.map((row: any) => ({
      device: row.keys[0],
      position: Math.round(row.position * 10) / 10,
      clicks: row.clicks || 0,
      ctr: row.ctr || 0,
    }));
  }

  /**
   * List all sites user has access to
   */
  async listSites(accessToken: string): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
    const response = await fetch(`${this.baseURL}/sites`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Search Console API error: ${error}`);
    }

    const data = await response.json();

    return data.siteEntry || [];
  }

  /**
   * Verify access to a site
   */
  async verifySiteAccess(siteUrl: string, accessToken: string): Promise<boolean> {
    try {
      const sites = await this.listSites(accessToken);
      return sites.some(site => site.siteUrl === siteUrl);
    } catch (error) {
      return false;
    }
  }
}

export const searchConsoleService = new SearchConsoleService();
