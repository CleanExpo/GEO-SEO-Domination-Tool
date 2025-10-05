/**
 * Multi-Source Keyword Research Service
 *
 * Provides keyword data with automatic fallback across multiple providers:
 * 1. SEMrush (primary, requires API credits)
 * 2. DataForSEO (100 free calls/month)
 * 3. Mock data (development fallback)
 */

import axios from 'axios';

export interface KeywordData {
  keyword: string;
  search_volume?: number;
  cpc?: number;
  difficulty?: number;
  competition?: string;
  source: 'semrush' | 'dataforseo' | 'mock' | 'none';
  error?: string;
}

export class KeywordResearchService {
  private semrushKey?: string;
  private dataForSeoKey?: string;

  constructor() {
    this.semrushKey = process.env.SEMRUSH_API_KEY;
    this.dataForSeoKey = process.env.DATAFORSEO_API_KEY;
  }

  /**
   * Get keyword data with automatic fallback
   */
  async getKeywordData(keyword: string): Promise<KeywordData> {
    // Try SEMrush first
    if (this.semrushKey) {
      try {
        const data = await this.fetchFromSEMrush(keyword);
        if (data) return { ...data, source: 'semrush' };
      } catch (error: any) {
        console.warn('SEMrush failed:', error.message);
      }
    }

    // Fallback to DataForSEO
    if (this.dataForSeoKey) {
      try {
        const data = await this.fetchFromDataForSEO(keyword);
        if (data) return { ...data, source: 'dataforseo' };
      } catch (error: any) {
        console.warn('DataForSEO failed:', error.message);
      }
    }

    // Final fallback: realistic mock data for development
    return this.generateMockData(keyword);
  }

  /**
   * Fetch from SEMrush API
   */
  private async fetchFromSEMrush(keyword: string): Promise<Partial<KeywordData> | null> {
    try {
      const response = await axios.get('https://api.semrush.com/', {
        params: {
          type: 'phrase_this',
          key: this.semrushKey,
          phrase: keyword,
          database: 'us',
          export_columns: 'Ph,Nq,Cp,Kd,Co',
        },
        timeout: 10000,
      });

      const lines = response.data.split('\n');
      if (lines.length > 1) {
        const values = lines[1].split(';');
        return {
          keyword,
          search_volume: parseInt(values[1]) || undefined,
          cpc: parseFloat(values[2]) || undefined,
          difficulty: parseFloat(values[3]) || undefined,
          competition: values[4] || undefined,
        };
      }
      return null;
    } catch (error: any) {
      if (error.response?.data?.includes('API UNITS BALANCE IS ZERO')) {
        throw new Error('SEMrush API credits depleted');
      }
      throw error;
    }
  }

  /**
   * Fetch from DataForSEO API
   */
  private async fetchFromDataForSEO(keyword: string): Promise<Partial<KeywordData> | null> {
    try {
      const [login, password] = (this.dataForSeoKey || '').split(':');

      const response = await axios.post(
        'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
        [{
          keywords: [keyword],
          location_code: 2840, // United States
          language_code: 'en',
        }],
        {
          auth: { username: login, password },
          timeout: 10000,
        }
      );

      const result = response.data?.tasks?.[0]?.result?.[0];
      if (result) {
        return {
          keyword,
          search_volume: result.search_volume,
          cpc: result.cpc,
          competition: result.competition,
          difficulty: result.keyword_info?.difficulty,
        };
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate realistic mock data for development
   */
  private generateMockData(keyword: string): KeywordData {
    // Generate deterministic random values based on keyword
    const hash = keyword.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return {
      keyword,
      search_volume: Math.floor(500 + (hash % 10000)),
      cpc: parseFloat((0.5 + (hash % 50) / 10).toFixed(2)),
      difficulty: Math.floor(20 + (hash % 60)),
      competition: ['Low', 'Medium', 'High'][hash % 3],
      source: 'mock',
    };
  }

  /**
   * Batch keyword research (up to 100 keywords)
   */
  async getBatchKeywordData(keywords: string[]): Promise<KeywordData[]> {
    // For now, process sequentially
    // TODO: Implement true batch API calls for efficiency
    const results: KeywordData[] = [];

    for (const keyword of keywords) {
      const data = await this.getKeywordData(keyword);
      results.push(data);
    }

    return results;
  }

  /**
   * Get service status and available providers
   */
  getStatus() {
    return {
      semrush: {
        available: !!this.semrushKey,
        configured: !!this.semrushKey,
      },
      dataforseo: {
        available: !!this.dataForSeoKey,
        configured: !!this.dataForSeoKey,
      },
      mock: {
        available: true,
        configured: true,
      },
    };
  }
}

export const keywordService = new KeywordResearchService();
