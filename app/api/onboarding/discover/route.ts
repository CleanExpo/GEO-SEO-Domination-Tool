/**
 * Auto-Discovery API Endpoint
 *
 * POST /api/onboarding/discover
 *
 * Combines multiple data sources to auto-discover information about a website:
 * 1. WhoisXML API - Domain registry data
 * 2. Firecrawl - Website scraping (platform, contact info, social links)
 * 3. Schema detection - Structured data on the site
 *
 * This powers the "✨ Analyzing your website..." feature in onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { discoverDomain } from '@/services/api/whois';

interface DiscoveryRequest {
  website: string;
}

interface DiscoveryResult {
  // Domain Info (from WHOIS)
  domain: string;
  registrar?: string;
  hostingProvider?: string;
  dnsProvider?: string;
  registrationDate?: string;
  expiryDate?: string;
  nameServers?: string[];

  // Contact Info (from WHOIS + Scraping)
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  organization?: string;

  // Website Info (from Scraping)
  platform?: string;
  platformVersion?: string;
  hasSSL?: boolean;

  // Social Media (from Scraping)
  socialProfiles?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };

  // Analytics & Tools Detected
  tools?: {
    analytics?: string[];   // ['Google Analytics', 'Meta Pixel']
    crm?: string[];        // ['HubSpot', 'Salesforce']
    emailMarketing?: string[]; // ['Mailchimp', 'SendGrid']
  };

  // Privacy Status
  isPrivate: boolean;

  // Confidence Score
  confidence: {
    overall: number;      // 0-100
    domain: number;       // 0-100
    contact: number;      // 0-100
    platform: number;     // 0-100
    social: number;       // 0-100
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscoveryRequest = await request.json();
    const { website } = body;

    if (!website) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    console.log(`[Discovery] Starting auto-discovery for: ${website}`);

    // =====================================================
    // STEP 1: WHOIS Lookup (Domain Registry Data)
    // =====================================================
    console.log('[Discovery] Step 1: WHOIS lookup...');
    const whoisData = await discoverDomain(website);

    // =====================================================
    // STEP 2: Website Scraping (Already available from lookup endpoint)
    // =====================================================
    console.log('[Discovery] Step 2: Website analysis...');

    // Use existing /api/onboarding/lookup endpoint
    const lookupResponse = await fetch(
      `${request.nextUrl.origin}/api/onboarding/lookup`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website }),
      }
    );

    let scrapedData: any = null;
    if (lookupResponse.ok) {
      scrapedData = await lookupResponse.json();
    }

    // =====================================================
    // STEP 3: Combine & Enrich Data
    // =====================================================
    console.log('[Discovery] Step 3: Combining data sources...');

    const result: DiscoveryResult = {
      domain: whoisData?.domain || website,

      // Domain Info
      registrar: whoisData?.registrar,
      hostingProvider: whoisData?.hostingProvider,
      dnsProvider: whoisData?.dnsProvider,
      registrationDate: whoisData?.registrationDate,
      expiryDate: whoisData?.expiryDate,
      nameServers: whoisData?.nameServers,

      // Contact Info (prefer scraped data over WHOIS if available)
      contactEmail: scrapedData?.email || whoisData?.contactEmail,
      contactPhone: scrapedData?.phone || whoisData?.contactPhone,
      contactName: whoisData?.contactName,
      organization: whoisData?.organization || scrapedData?.businessName,

      // Website Platform
      platform: scrapedData?.platform,
      platformVersion: scrapedData?.platformVersion,
      hasSSL: website.startsWith('https://'),

      // Social Profiles (from scraped footer links)
      socialProfiles: scrapedData?.socialProfiles || {},

      // Tools Detection (placeholder - can be enhanced)
      tools: {
        analytics: [],
        crm: [],
        emailMarketing: [],
      },

      // Privacy
      isPrivate: whoisData?.isPrivate ?? true,

      // Confidence Scores
      confidence: calculateConfidence(whoisData, scrapedData),
    };

    console.log('[Discovery] ✅ Auto-discovery complete');
    console.log(`[Discovery] Found: ${result.platform || 'Unknown platform'}, ${result.registrar || 'Unknown registrar'}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Discovery] Error:', error);
    return NextResponse.json(
      { error: 'Auto-discovery failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate confidence scores for discovered data
 */
function calculateConfidence(whoisData: any, scrapedData: any) {
  let domainScore = 0;
  let contactScore = 0;
  let platformScore = 0;
  let socialScore = 0;

  // Domain confidence (based on WHOIS data completeness)
  if (whoisData) {
    if (whoisData.registrar) domainScore += 40;
    if (whoisData.hostingProvider) domainScore += 30;
    if (whoisData.registrationDate) domainScore += 30;
  }

  // Contact confidence
  if (scrapedData?.email || whoisData?.contactEmail) contactScore += 50;
  if (scrapedData?.phone || whoisData?.contactPhone) contactScore += 50;

  // Platform confidence
  if (scrapedData?.platform) {
    platformScore = 100; // We detected the platform
  }

  // Social confidence
  const socialProfiles = scrapedData?.socialProfiles || {};
  const socialCount = Object.values(socialProfiles).filter(Boolean).length;
  socialScore = Math.min(socialCount * 25, 100);

  // Overall confidence (weighted average)
  const overall = Math.round(
    (domainScore * 0.25 + contactScore * 0.25 + platformScore * 0.3 + socialScore * 0.2)
  );

  return {
    overall,
    domain: domainScore,
    contact: contactScore,
    platform: platformScore,
    social: socialScore,
  };
}
