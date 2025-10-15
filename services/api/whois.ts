/**
 * WhoisXML API Integration
 *
 * Purpose: Auto-discover domain information for seamless onboarding
 *
 * What we discover:
 * - Domain registrar (GoDaddy, Namecheap, etc.)
 * - Hosting provider
 * - DNS provider
 * - Contact information (if not private)
 * - Registration/expiry dates
 * - Name servers
 *
 * API Docs: https://www.whoisxmlapi.com/whoisserver/WhoisService
 * Free Tier: 500 queries
 *
 * Environment Variables Required:
 * - WHOIS_API_KEY (stored in Vercel)
 */

interface WhoisContact {
  name?: string;
  organization?: string;
  street1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  telephone?: string;
}

interface WhoisRecord {
  domainName: string;
  registrarName?: string;
  registrarIANAID?: string;
  createdDate?: string;
  updatedDate?: string;
  expiresDate?: string;
  registrant?: WhoisContact;
  administrativeContact?: WhoisContact;
  technicalContact?: WhoisContact;
  nameServers?: {
    hostNames: string[];
  };
  status?: string[];
  domainAvailability?: 'AVAILABLE' | 'UNAVAILABLE' | 'UNDETERMINED';
}

interface WhoisResponse {
  WhoisRecord: WhoisRecord;
}

interface DomainDiscovery {
  domain: string;
  registrar?: string;
  hostingProvider?: string;
  dnsProvider?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
  organization?: string;
  registrationDate?: string;
  expiryDate?: string;
  nameServers?: string[];
  isPrivate: boolean;
  availability?: 'AVAILABLE' | 'UNAVAILABLE' | 'UNDETERMINED';
}

/**
 * Query WhoisXML API for domain information
 */
export async function whoisLookup(domain: string): Promise<WhoisResponse | null> {
  const apiKey = process.env.WHOIS_API_KEY;

  if (!apiKey) {
    console.error('[WHOIS] API key not configured');
    return null;
  }

  // Clean domain (remove http://, https://, www., trailing slash)
  const cleanDomain = domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .split('/')[0]; // Get just the domain, not the path

  try {
    console.log(`[WHOIS] Querying domain: ${cleanDomain}`);

    const response = await fetch(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${cleanDomain}&outputFormat=JSON`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[WHOIS] API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    console.log('[WHOIS] Successfully retrieved domain data');

    return data;
  } catch (error) {
    console.error('[WHOIS] Lookup failed:', error);
    return null;
  }
}

/**
 * Extract useful information from WHOIS data for onboarding
 */
export function parseWhoisData(whoisData: WhoisResponse): DomainDiscovery {
  const record = whoisData.WhoisRecord;

  // Check if contact info is private/redacted
  const isPrivate =
    record.registrant?.organization?.toLowerCase().includes('privacy') ||
    record.registrant?.organization?.toLowerCase().includes('redacted') ||
    record.registrant?.organization?.toLowerCase().includes('proxy') ||
    !record.registrant?.email;

  // Extract name servers to determine hosting/DNS provider
  const nameServers = record.nameServers?.hostNames || [];

  // Detect DNS provider from name servers
  let dnsProvider: string | undefined;
  if (nameServers.some(ns => ns.includes('cloudflare'))) {
    dnsProvider = 'Cloudflare';
  } else if (nameServers.some(ns => ns.includes('amazonaws'))) {
    dnsProvider = 'Amazon Route 53';
  } else if (nameServers.some(ns => ns.includes('googledomains'))) {
    dnsProvider = 'Google Domains';
  } else if (nameServers.some(ns => ns.includes('godaddy'))) {
    dnsProvider = 'GoDaddy';
  } else if (nameServers.some(ns => ns.includes('namecheap'))) {
    dnsProvider = 'Namecheap';
  }

  // Detect hosting provider (often same as DNS provider for small sites)
  let hostingProvider: string | undefined = dnsProvider;

  return {
    domain: record.domainName,
    registrar: record.registrarName,
    hostingProvider,
    dnsProvider,
    contactEmail: !isPrivate ? record.registrant?.email : undefined,
    contactPhone: !isPrivate ? record.registrant?.telephone : undefined,
    contactName: !isPrivate ? record.registrant?.name : undefined,
    organization: !isPrivate ? record.registrant?.organization : undefined,
    registrationDate: record.createdDate,
    expiryDate: record.expiresDate,
    nameServers,
    isPrivate,
    availability: record.domainAvailability,
  };
}

/**
 * Main function: Discover all available domain information
 */
export async function discoverDomain(domain: string): Promise<DomainDiscovery | null> {
  const whoisData = await whoisLookup(domain);

  if (!whoisData) {
    return null;
  }

  return parseWhoisData(whoisData);
}

/**
 * Batch lookup multiple domains (for competitor analysis)
 */
export async function discoverDomains(domains: string[]): Promise<DomainDiscovery[]> {
  const results = await Promise.all(
    domains.map(domain => discoverDomain(domain))
  );

  return results.filter((result): result is DomainDiscovery => result !== null);
}
