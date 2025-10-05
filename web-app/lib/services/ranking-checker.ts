/**
 * Ranking Checker Service
 * Monitors keyword rankings across search engines
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabase';

export interface RankingCheckResult {
  keyword: string;
  url: string;
  position: number | null;
  searchEngine: 'google' | 'bing';
  location?: string;
  timestamp: Date;
  found: boolean;
}

export class RankingChecker {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  ];

  async checkGoogleRanking(
    keyword: string,
    targetUrl: string,
    location?: string,
    maxResults: number = 100
  ): Promise<RankingCheckResult> {
    // Check if Google Custom Search API is configured
    const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_CSE_ID;

    // If API keys are available, use Google Custom Search API
    if (googleApiKey && searchEngineId) {
      return this.checkGoogleRankingWithAPI(keyword, targetUrl, location, maxResults, googleApiKey, searchEngineId);
    }

    // Otherwise, fall back to web scraping (less reliable, may be blocked)
    console.warn('[RankingChecker] Google API not configured - using web scraping fallback (may be unreliable)');

    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=${maxResults}`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const normalizedTarget = this.normalizeUrl(targetUrl);

      let position = null;
      let found = false;

      // Search through organic results
      $('div.g').each((index, element) => {
        const link = $(element).find('a').first().attr('href');
        if (link && this.urlMatches(link, normalizedTarget)) {
          position = index + 1;
          found = true;
          return false; // Break loop
        }
      });

      if (found) {
        console.log(`[RankingChecker] Found ${targetUrl} at position ${position} for keyword "${keyword}"`);
      } else {
        console.warn(`[RankingChecker] ${targetUrl} not found in top ${maxResults} results for keyword "${keyword}"`);
      }

      return {
        keyword,
        url: targetUrl,
        position,
        searchEngine: 'google',
        location,
        timestamp: new Date(),
        found,
      };
    } catch (error: any) {
      console.error('[RankingChecker] Google ranking check error:', {
        keyword,
        error: error.message || 'Unknown error',
        status: error.response?.status
      });
      return {
        keyword,
        url: targetUrl,
        position: null,
        searchEngine: 'google',
        location,
        timestamp: new Date(),
        found: false,
      };
    }
  }

  private async checkGoogleRankingWithAPI(
    keyword: string,
    targetUrl: string,
    location: string | undefined,
    maxResults: number,
    apiKey: string,
    searchEngineId: string
  ): Promise<RankingCheckResult> {
    try {
      // Google Custom Search API endpoint
      const apiUrl = 'https://www.googleapis.com/customsearch/v1';

      const response = await axios.get(apiUrl, {
        params: {
          key: apiKey,
          cx: searchEngineId,
          q: keyword,
          num: Math.min(maxResults, 10), // API limit is 10 per request
        },
        timeout: 10000,
      });

      const normalizedTarget = this.normalizeUrl(targetUrl);
      let position = null;
      let found = false;

      // Search through results
      if (response.data.items) {
        for (let i = 0; i < response.data.items.length; i++) {
          const item = response.data.items[i];
          if (this.urlMatches(item.link, normalizedTarget)) {
            position = i + 1;
            found = true;
            break;
          }
        }
      }

      if (found) {
        console.log(`[RankingChecker] [Google API] Found ${targetUrl} at position ${position} for keyword "${keyword}"`);
      } else {
        console.warn(`[RankingChecker] [Google API] ${targetUrl} not found in results for keyword "${keyword}"`);
      }

      return {
        keyword,
        url: targetUrl,
        position,
        searchEngine: 'google',
        location,
        timestamp: new Date(),
        found,
      };
    } catch (error: any) {
      console.error('[RankingChecker] Google API ranking check error:', {
        keyword,
        error: error.message || 'Unknown error',
        status: error.response?.status,
        details: error.response?.data
      });

      // Fall back to scraping if API fails
      console.warn('[RankingChecker] Falling back to web scraping after API failure');
      return this.checkGoogleRanking(keyword, targetUrl, location, maxResults);
    }
  }

  async checkBingRanking(
    keyword: string,
    targetUrl: string,
    location?: string,
    maxResults: number = 50
  ): Promise<RankingCheckResult> {
    try {
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(keyword)}&count=${maxResults}`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const normalizedTarget = this.normalizeUrl(targetUrl);

      let position = null;
      let found = false;

      // Search through organic results
      $('li.b_algo').each((index, element) => {
        const link = $(element).find('h2 a').first().attr('href');
        if (link && this.urlMatches(link, normalizedTarget)) {
          position = index + 1;
          found = true;
          return false; // Break loop
        }
      });

      return {
        keyword,
        url: targetUrl,
        position,
        searchEngine: 'bing',
        location,
        timestamp: new Date(),
        found,
      };
    } catch (error) {
      console.error('Bing ranking check error:', error);
      return {
        keyword,
        url: targetUrl,
        position: null,
        searchEngine: 'bing',
        location,
        timestamp: new Date(),
        found: false,
      };
    }
  }

  async checkAllRankings(
    keywordId: string,
    companyId: string
  ): Promise<void> {
    try {
      // Fetch keyword details
      const { data: keyword, error: keywordError } = await supabase
        .from('keywords')
        .select('keyword, location')
        .eq('id', keywordId)
        .single();

      if (keywordError || !keyword) {
        throw new Error('Keyword not found');
      }

      // Fetch company website
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('website')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        throw new Error('Company not found');
      }

      // Check rankings on both search engines
      const [googleResult, bingResult] = await Promise.all([
        this.checkGoogleRanking(keyword.keyword, company.website, keyword.location),
        this.checkBingRanking(keyword.keyword, company.website, keyword.location),
      ]);

      // Save Google ranking
      if (googleResult.position) {
        await this.saveRanking(keywordId, companyId, googleResult);
      }

      // Save Bing ranking
      if (bingResult.position) {
        await this.saveRanking(keywordId, companyId, bingResult);
      }

      // Update keyword with latest ranking
      const bestPosition = googleResult.position || bingResult.position;
      if (bestPosition) {
        await supabase
          .from('keywords')
          .update({
            current_rank: bestPosition,
            last_checked: new Date().toISOString(),
          })
          .eq('id', keywordId);
      }
    } catch (error) {
      console.error('Failed to check rankings:', error);
      throw error;
    }
  }

  private async saveRanking(
    keywordId: string,
    companyId: string,
    result: RankingCheckResult
  ): Promise<void> {
    await supabase.from('rankings').insert([
      {
        keyword_id: keywordId,
        company_id: companyId,
        position: result.position,
        url: result.url,
        checked_at: result.timestamp.toISOString(),
      },
    ]);
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '').toLowerCase();
    } catch {
      return url.replace('www.', '').toLowerCase();
    }
  }

  private urlMatches(foundUrl: string, targetUrl: string): boolean {
    const normalizedFound = this.normalizeUrl(foundUrl);
    const normalizedTarget = this.normalizeUrl(targetUrl);
    return normalizedFound.includes(normalizedTarget) || normalizedTarget.includes(normalizedFound);
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  // Batch ranking check for multiple keywords
  async checkCompanyKeywords(companyId: string): Promise<void> {
    try {
      // Fetch all keywords for company
      const { data: keywords, error } = await supabase
        .from('keywords')
        .select('id')
        .eq('company_id', companyId);

      if (error || !keywords) {
        throw new Error('Failed to fetch keywords');
      }

      // Check rankings for each keyword with delay to avoid rate limiting
      for (const keyword of keywords) {
        await this.checkAllRankings(keyword.id, companyId);
        // Wait 5 seconds between checks to avoid being blocked
        await this.delay(5000);
      }
    } catch (error) {
      console.error('Batch ranking check failed:', error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const rankingChecker = new RankingChecker();
