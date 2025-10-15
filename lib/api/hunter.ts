/**
 * Hunter.io API Integration
 * 
 * This module provides secure integration with Hunter.io API for:
 * - Email discovery
 * - Domain search
 * - Email verification
 * - Company & person enrichment
 * 
 * API Key is stored in environment variables - NEVER hardcoded.
 * 
 * @see https://hunter.io/api-documentation/v2
 */

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const HUNTER_BASE_URL = 'https://api.hunter.io/v2';

interface HunterError {
  errors: Array<{
    id: string;
    code: number;
    details: string;
  }>;
}

interface EmailPattern {
  pattern: string;
  confidence: number;
}

interface DomainSearchResponse {
  data: {
    domain: string;
    disposable: boolean;
    webmail: boolean;
    accept_all: boolean;
    pattern: string;
    organization: string;
    emails: Array<{
      value: string;
      type: string;
      confidence: number;
      first_name: string;
      last_name: string;
      position: string;
      department: string;
    }>;
  };
}

interface EmailFinderResponse {
  data: {
    email: string;
    confidence: number;
    first_name: string;
    last_name: string;
    position: string;
    department: string;
    sources: Array<{
      domain: string;
      uri: string;
      extracted_on: string;
    }>;
  };
}

interface EmailVerificationResponse {
  data: {
    status: 'valid' | 'invalid' | 'accept_all' | 'webmail' | 'disposable' | 'unknown';
    result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
    score: number;
    email: string;
    regexp: boolean;
    gibberish: boolean;
    disposable: boolean;
    webmail: boolean;
    mx_records: boolean;
    smtp_server: boolean;
    smtp_check: boolean;
    accept_all: boolean;
  };
}

interface CompanyEnrichmentResponse {
  data: {
    domain: string;
    company: string;
    organization: string;
    country: string;
    industry: string;
    headcount: string;
    revenue: string;
    linkedin_url: string;
    twitter: string;
    facebook: string;
  };
}

export class HunterAPIError extends Error {
  constructor(message: string, public statusCode?: number, public hunterError?: HunterError) {
    super(message);
    this.name = 'HunterAPIError';
  }
}

/**
 * Make a request to Hunter.io API
 */
async function hunterRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!HUNTER_API_KEY) {
    throw new HunterAPIError('HUNTER_API_KEY environment variable is not set');
  }

  const url = new URL(`${HUNTER_BASE_URL}/${endpoint}`);
  url.searchParams.append('api_key', HUNTER_API_KEY);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new HunterAPIError(
        `Hunter.io API request failed: ${response.statusText}`,
        response.status,
        data as HunterError
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof HunterAPIError) {
      throw error;
    }
    throw new HunterAPIError(
      `Hunter.io request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Search for email addresses associated with a domain
 */
export async function domainSearch(domain: string, options?: {
  limit?: number;
  offset?: number;
  type?: 'personal' | 'generic';
  seniority?: string;
  department?: string;
}): Promise<DomainSearchResponse> {
  const params: Record<string, string> = { domain };
  
  if (options?.limit) params.limit = options.limit.toString();
  if (options?.offset) params.offset = options.offset.toString();
  if (options?.type) params.type = options.type;
  if (options?.seniority) params.seniority = options.seniority;
  if (options?.department) params.department = options.department;

  return hunterRequest<DomainSearchResponse>('domain-search', params);
}

/**
 * Find email address for a specific person at a company
 */
export async function emailFinder(
  domain: string,
  firstName: string,
  lastName: string
): Promise<EmailFinderResponse> {
  return hunterRequest<EmailFinderResponse>('email-finder', {
    domain,
    first_name: firstName,
    last_name: lastName,
  });
}

/**
 * Verify if an email address is valid and deliverable
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResponse> {
  return hunterRequest<EmailVerificationResponse>('email-verifier', { email });
}

/**
 * Get company information from a domain
 */
export async function companyEnrichment(domain: string): Promise<CompanyEnrichmentResponse> {
  return hunterRequest<CompanyEnrichmentResponse>('companies/find', { domain });
}

/**
 * Get person information from an email
 */
export async function personEnrichment(email: string) {
  return hunterRequest('people/find', { email });
}

/**
 * Combined enrichment - get both company and person data
 */
export async function combinedEnrichment(email: string) {
  return hunterRequest('combined/find', { email });
}

/**
 * Discover social media profiles and other data for a domain
 */
export async function discover(domain: string) {
  return hunterRequest('discover', { domain });
}

/**
 * Check if Hunter.io API is configured
 */
export function isHunterConfigured(): boolean {
  return !!HUNTER_API_KEY;
}

/**
 * Extract email pattern from domain search
 */
export function extractEmailPattern(response: DomainSearchResponse): EmailPattern | null {
  const pattern = response.data.pattern;
  if (!pattern) return null;

  // Calculate confidence based on number of emails found
  const emailCount = response.data.emails?.length || 0;
  const confidence = Math.min(emailCount * 10, 100);

  return { pattern, confidence };
}

/**
 * Filter emails by confidence threshold
 */
export function filterByConfidence(
  response: DomainSearchResponse,
  minConfidence: number = 70
) {
  return response.data.emails.filter(email => email.confidence >= minConfidence);
}
