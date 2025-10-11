import axios from 'axios';

// Perplexity AI Client
export class PerplexityClient {
  private apiKey: string;
  private baseURL = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful SEO and marketing research assistant.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw error;
    }
  }
}

// Firecrawl Client
export class FirecrawlClient {
  private apiKey: string;
  private baseURL = 'https://api.firecrawl.dev/v0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async scrapeUrl(url: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/scrape`,
        {
          url,
          pageOptions: {
            onlyMainContent: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Firecrawl API error:', error);
      throw error;
    }
  }
}

// Google Search Console (placeholder - requires OAuth)
export class GoogleSearchClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Placeholder for Google Custom Search API
  async search(query: string, location?: string): Promise<any> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/customsearch/v1',
        {
          params: {
            key: this.apiKey,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: query,
            gl: location || 'us',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Google Search API error:', error);
      throw error;
    }
  }
}
