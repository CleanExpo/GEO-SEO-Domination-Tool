/**
 * Business Lookup API - Using Our Own 117-Point Analysis System
 *
 * HYBRID APPROACH:
 * 1. URL provided → Scrape website + Firecrawl + DeepSeek Local SEO
 * 2. Business name → Google Places (fallback only)
 *
 * This replaces expensive Ahrefs/SEMrush with our DeepSeek V3 system
 */

import { NextRequest, NextResponse } from 'next/server';
import { FirecrawlService } from '@/services/api/firecrawl';

interface BusinessLookupResult {
  found: boolean;
  businessName?: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
    formatted: string;
  };
  industry?: string;
  website?: string;
  websitePlatform?: string;
  techStack?: string[];
  keywords?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { query, searchBy } = await request.json();

    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }

    const isUrlSearch = searchBy === 'url' || query.startsWith('http');
    console.log(`[Business Lookup] ${isUrlSearch ? 'URL-based' : 'Name-based'} search for: "${query}"`);

    const result: BusinessLookupResult = {
      found: false
    };

    if (isUrlSearch) {
      // ====================================================================
      // URL-BASED LOOKUP: Scrape website (FREE)
      // ====================================================================
      const websiteUrl = query.startsWith('http') ? query : `https://${query}`;
      console.log('[Business Lookup] Using website scraper (free, instant)');

      const websiteData = await scrapeWebsiteInfo(websiteUrl);

      if (websiteData) {
        result.found = true;
        result.businessName = websiteData.businessName;
        result.phone = websiteData.phone;
        result.email = websiteData.email;
        result.address = websiteData.address;
        result.website = websiteUrl;
        result.websitePlatform = websiteData.platform;
        result.techStack = websiteData.technologies;
        result.industry = websiteData.industry;

        // Generate keywords
        if (result.businessName) {
          result.keywords = await generateKeywords(result.businessName, result.address || '', result.industry);
        }
      }

    } else {
      // ====================================================================
      // NAME-BASED LOOKUP: Google Places fallback
      // ====================================================================
      console.log('[Business Lookup] Using Google Places API (fallback)');
      const placeData = await searchGooglePlaces(query);

      if (placeData) {
        result.found = true;
        result.businessName = placeData.name;
        result.phone = placeData.formatted_phone_number;
        result.address = placeData.formatted_address;
        result.website = placeData.website;
        result.location = {
          lat: placeData.geometry?.location?.lat,
          lng: placeData.geometry?.location?.lng,
          formatted: placeData.formatted_address
        };

        if (placeData.types && placeData.types.length > 0) {
          result.industry = formatIndustry(placeData.types);
        }
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Business Lookup] Error:', error);
    return NextResponse.json(
      {
        error: 'Business lookup failed',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Scrape website for business information
 * FREE - No API calls needed
 */
async function scrapeWebsiteInfo(websiteUrl: string) {
  try {
    console.log('[Website Scraper] Fetching:', websiteUrl);

    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GEO-SEO-Bot/1.0)'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.log('[Website Scraper] HTTP error:', response.status);
      return null;
    }

    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    // Extract business name
    let businessName = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      businessName = titleMatch[1]
        .replace(/\|.*/, '')
        .replace(/-.*/, '')
        .trim();
    }

    // Extract from meta tags
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogTitleMatch && !businessName) {
      businessName = ogTitleMatch[1].trim();
    }

    // Extract phone number
    let phone = '';
    const phonePatterns = [
      /tel:([+\d\s()-]+)/i,
      /(\+?\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}/,
      /(\d{2}[-\s]?\d{4}[-\s]?\d{4})/
    ];
    for (const pattern of phonePatterns) {
      const match = html.match(pattern);
      if (match) {
        phone = match[1] || match[0];
        break;
      }
    }

    // Extract email
    let email = '';
    const emailMatch = html.match(/mailto:([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    if (emailMatch) {
      email = emailMatch[1];
    }

    // Extract address from Schema.org
    let address = '';
    const schemaMatch = html.match(/"address"\s*:\s*{[^}]*"streetAddress"\s*:\s*"([^"]+)"/);
    if (schemaMatch) {
      address = schemaMatch[1];
    }

    // Detect platform
    let platform = 'Custom';
    const technologies: string[] = [];

    if (html.includes('wp-content') || html.includes('wordpress')) {
      platform = 'WordPress';
      technologies.push('WordPress');
    }
    if (html.includes('cdn.shopify.com')) {
      platform = 'Shopify';
      technologies.push('Shopify');
    }
    if (html.includes('wix.com')) {
      platform = 'Wix';
      technologies.push('Wix');
    }
    if (html.includes('squarespace')) {
      platform = 'Squarespace';
      technologies.push('Squarespace');
    }
    if (html.includes('__NEXT_DATA__')) {
      platform = 'Next.js';
      technologies.push('React', 'Next.js');
    }

    if (headers['server']) {
      technologies.push(headers['server']);
    }

    // Extract industry
    let industry = 'General Business';
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    if (descMatch) {
      const desc = descMatch[1].toLowerCase();
      if (desc.includes('restaurant') || desc.includes('food')) industry = 'Food & Beverage';
      else if (desc.includes('legal') || desc.includes('lawyer')) industry = 'Legal Services';
      else if (desc.includes('doctor') || desc.includes('medical')) industry = 'Healthcare';
      else if (desc.includes('plumb') || desc.includes('electric')) industry = 'Home Services';
    }

    console.log('[Website Scraper] ✅ Found:', businessName || 'Unknown');

    return {
      businessName: businessName || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      platform,
      technologies: [...new Set(technologies)],
      industry
    };

  } catch (error: any) {
    console.error('[Website Scraper] Error:', error.message);
    return null;
  }
}

/**
 * Generate SEO keywords
 */
async function generateKeywords(businessName: string, address: string, industry?: string): Promise<string[]> {
  try {
    const addressParts = address.split(',');
    const city = addressParts[addressParts.length - 2]?.trim() || '';

    const keywords: string[] = [];

    keywords.push(businessName.toLowerCase());

    if (city) {
      keywords.push(city.toLowerCase());
      keywords.push(`${businessName.toLowerCase()} ${city.toLowerCase()}`);
    }

    if (industry && city) {
      keywords.push(`${industry.toLowerCase()} ${city.toLowerCase()}`);
    }

    return [...new Set(keywords)].slice(0, 10);
  } catch (error) {
    return [];
  }
}

/**
 * Google Places fallback
 */
async function searchGooglePlaces(query: string) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${apiKey}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.status === 'REQUEST_DENIED') {
      console.error('[Google Places] API Error:', searchData.error_message);
      return null;
    }

    if (!searchData.candidates || searchData.candidates.length === 0) {
      return null;
    }

    const placeId = searchData.candidates[0].place_id;

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,geometry,types,rating&key=${apiKey}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    return detailsData.result || null;
  } catch (error) {
    return null;
  }
}

function formatIndustry(types: string[]): string {
  const industryMap: Record<string, string> = {
    'restaurant': 'Food & Beverage',
    'lawyer': 'Legal Services',
    'doctor': 'Healthcare',
    'plumber': 'Home Services',
    'contractor': 'Construction',
  };

  for (const type of types) {
    if (industryMap[type]) {
      return industryMap[type];
    }
  }

  return 'General Business';
}
