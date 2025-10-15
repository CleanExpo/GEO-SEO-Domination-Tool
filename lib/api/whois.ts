/**
 * WhoisXML API Integration
 * 
 * This module provides secure integration with WhoisXML API for WHOIS lookups.
 * API Key is stored in environment variables - NEVER hardcoded.
 * 
 * @see https://www.whoisxmlapi.com/
 */

const WHOIS_API_KEY = process.env.WHOIS_API_KEY;
const WHOIS_BASE_URL = 'https://www.whoisxmlapi.com/whoisserver/WhoisService';

interface WhoisResponse {
  WhoisRecord: {
    domainName: string;
    registrarName?: string;
    registrant?: {
      organization?: string;
      state?: string;
      country?: string;
    };
    administrativeContact?: {
      organization?: string;
      email?: string;
    };
    technicalContact?: {
      organization?: string;
      email?: string;
    };
    createdDate?: string;
    updatedDate?: string;
    expiresDate?: string;
    nameServers?: {
      hostNames: string[];
    };
  };
}

export class WhoisAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'WhoisAPIError';
  }
}

/**
 * Look up WHOIS information for a domain
 */
export async function lookupDomain(domain: string): Promise<WhoisResponse> {
  if (!WHOIS_API_KEY) {
    throw new WhoisAPIError('WHOIS_API_KEY environment variable is not set');
  }

  if (!domain || !domain.includes('.')) {
    throw new WhoisAPIError('Invalid domain format');
  }

  try {
    const url = new URL(WHOIS_BASE_URL);
    url.searchParams.append('apiKey', WHOIS_API_KEY);
    url.searchParams.append('domainName', domain);
    url.searchParams.append('outputFormat', 'JSON');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new WhoisAPIError(
        `WHOIS API request failed: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data as WhoisResponse;
  } catch (error) {
    if (error instanceof WhoisAPIError) {
      throw error;
    }
    throw new WhoisAPIError(
      `Failed to lookup domain: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract key information from WHOIS response
 */
export function extractDomainInfo(whoisData: WhoisResponse) {
  const record = whoisData.WhoisRecord;
  
  return {
    domain: record.domainName,
    registrar: record.registrarName,
    organization: record.registrant?.organization || 
                  record.administrativeContact?.organization ||
                  'Not available',
    country: record.registrant?.country,
    state: record.registrant?.state,
    createdDate: record.createdDate,
    updatedDate: record.updatedDate,
    expiresDate: record.expiresDate,
    nameServers: record.nameServers?.hostNames || [],
    contacts: {
      admin: record.administrativeContact?.email,
      technical: record.technicalContact?.email,
    }
  };
}

/**
 * Check if WHOIS API is configured
 */
export function isWhoisConfigured(): boolean {
  return !!WHOIS_API_KEY;
}
