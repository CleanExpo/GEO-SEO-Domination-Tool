// Onboarding Vitals TypeScript Interfaces
// Comprehensive baseline metrics for SEO & GEO tracking

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  inp: number; // Interaction to Next Paint (ms)
  fcp?: number; // First Contentful Paint (ms)
  ttfb?: number; // Time to First Byte (ms)
}

export interface GoogleSearchConsoleMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  indexedPages: number;
  coverageIssues: number;
  mobileUsabilityIssues: number;
  manualActions: number;
  httpsStatus: boolean;
  mobileFriendly: boolean;
  structuredDataErrors: number;
  topKeywords?: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
  }>;
  topPages?: Array<{
    url: string;
    clicks: number;
    impressions: number;
    ctr: number;
  }>;
}

export interface GoogleMyBusinessMetrics {
  profileCompleteness: number; // 0-100
  napConsistency: boolean;
  categories: string[];
  primaryCategory?: string;
  totalReviews: number;
  avgRating: number;
  reviewResponseRate: number;
  photosCount: number;
  postsLast30Days: number;
  searchViews: number;
  mapViews: number;
  directionRequests: number;
  phoneCalls: number;
  websiteClicks: number;
  localPackRankings?: Array<{
    keyword: string;
    position: number;
    location: string;
  }>;
}

export interface BingWebmasterMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  seoScore: number; // 0-100
  pagesIndexed: number;
  crawlErrors: number;
  blockedUrls: number;
  mobileFriendly: boolean;
  backlinks: number;
  linkingDomains: number;
  crawlRate: number; // pages per day
  lastCrawlDate?: Date;
  topQueries?: Array<{
    query: string;
    impressions: number;
    clicks: number;
  }>;
}

export interface TechnicalSEOMetrics {
  pageSpeed: {
    mobile: number; // 0-100
    desktop: number; // 0-100
  };
  totalPages: number;
  blogPosts: number;
  avgWordCount: number;
  thinContentPages: number; // < 300 words
  duplicateContentPct: number;
  seoFundamentals: {
    titleTagsCoverage: number; // percentage
    metaDescCoverage: number;
    h1TagsCoverage: number;
    altTextCoverage: number;
    internalLinkingDensity: number;
  };
  hasRobotsTxt: boolean;
  hasXmlSitemap: boolean;
  hasSsl: boolean;
}

export interface SchemaMarkup {
  localBusiness: boolean;
  organization: boolean;
  product: boolean;
  faq: boolean;
  review: boolean;
  breadcrumb: boolean;
}

export interface EEATScores {
  experience: number; // 0-100
  expertise: number; // 0-100
  authoritativeness: number; // 0-100
  trustworthiness: number; // 0-100
  overall: number; // 0-100
}

export interface SocialProofMetrics {
  googleReviews: number;
  googleRating: number;
  facebookFollowers?: number;
  instagramFollowers?: number;
  linkedinFollowers?: number;
}

export interface CitationMetrics {
  total: number;
  consistentPct: number;
  inconsistent: number;
  missingOpportunities: number;
}

export interface CompetitorSnapshot {
  name: string;
  url: string;
  domainAuthority?: number;
  estimatedTraffic?: number;
  backlinkCount?: number;
  gmbRating?: number;
  gmbReviewCount?: number;
  contentVolume?: number;
  keywordsRankingTop10?: number;
  topKeywords?: string[];
}

export interface OnboardingVitals {
  id: string;
  companyId: string;
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // Core metrics
  coreWebVitals?: CoreWebVitals;
  gsc?: GoogleSearchConsoleMetrics;
  gmb?: GoogleMyBusinessMetrics;
  bing?: BingWebmasterMetrics;
  technical?: TechnicalSEOMetrics;
  schema?: SchemaMarkup;
  eeat?: EEATScores;
  socialProof?: SocialProofMetrics;
  citations?: CitationMetrics;

  // Competitor data
  competitors?: CompetitorSnapshot[];

  // Overall health score
  vitalsHealthScore?: number; // 0-100

  // Raw JSON data
  gscData?: any;
  gmbData?: any;
  bingData?: any;
  competitorsData?: any;
  keywordsData?: any;

  // Audit metadata
  auditDurationMs?: number;
  dataSources?: string[]; // e.g., ['gsc', 'gmb', 'bing', 'lighthouse']
  errors?: Array<{
    source: string;
    message: string;
    timestamp: Date;
  }>;
}

export interface VitalsChecklistSection {
  name: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  metrics: number; // Total metrics in section
  capturedMetrics: number; // Successfully captured metrics
  completionPct: number; // 0-100
  errors?: string[];
}

export interface VitalsChecklistProgress {
  sections: VitalsChecklistSection[];
  overallCompletionPct: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // seconds
}

export interface VitalsHealthScoreBreakdown {
  overall: number; // 0-100
  categories: {
    gsc: number; // 0-100
    gmb: number; // 0-100
    bing: number; // 0-100
    technical: number; // 0-100
    eeat: number; // 0-100
    citations: number; // 0-100
  };
  weights: {
    gsc: number; // default: 25
    gmb: number; // default: 25
    bing: number; // default: 10
    technical: number; // default: 20
    eeat: number; // default: 15
    citations: number; // default: 5
  };
}

export interface VitalsCaptureOptions {
  includeGSC?: boolean;
  includeGMB?: boolean;
  includeBing?: boolean;
  includeTechnical?: boolean;
  includeCompetitors?: boolean;
  competitorUrls?: string[];
  forceRefresh?: boolean; // Re-capture even if recent data exists
}

export interface VitalsCaptureResult {
  success: boolean;
  vitalsId?: string;
  vitals?: OnboardingVitals;
  errors?: Array<{
    source: string;
    message: string;
  }>;
  duration: number; // milliseconds
  dataSources: string[];
}

// API Request/Response types
export interface CaptureVitalsRequest {
  companyId: string;
  options?: VitalsCaptureOptions;
}

export interface CaptureVitalsResponse {
  result: VitalsCaptureResult;
}

export interface GetVitalsRequest {
  companyId: string;
  vitalsId?: string; // Get specific vitals, or latest if omitted
}

export interface GetVitalsResponse {
  vitals: OnboardingVitals | null;
  history?: OnboardingVitals[]; // Previous vitals for comparison
}

// Utility type for database row mapping
export interface OnboardingVitalsRow {
  id: string;
  company_id: string;
  captured_at: Date;
  created_at: Date;
  updated_at: Date;

  // GSC
  gsc_impressions?: number;
  gsc_clicks?: number;
  gsc_ctr?: number;
  gsc_avg_position?: number;
  gsc_indexed_pages?: number;
  gsc_coverage_issues?: number;
  gsc_mobile_usability_issues?: number;
  gsc_manual_actions?: number;
  gsc_https_status?: boolean;
  gsc_mobile_friendly?: boolean;
  gsc_structured_data_errors?: number;

  // Core Web Vitals
  cwv_lcp?: number;
  cwv_fid?: number;
  cwv_cls?: number;
  cwv_inp?: number;
  cwv_fcp?: number;
  cwv_ttfb?: number;

  // GMB
  gmb_profile_completeness?: number;
  gmb_nap_consistency?: boolean;
  gmb_total_reviews?: number;
  gmb_avg_rating?: number;
  gmb_review_response_rate?: number;
  gmb_photos_count?: number;
  gmb_posts_last_30_days?: number;
  gmb_search_views?: number;
  gmb_map_views?: number;
  gmb_direction_requests?: number;
  gmb_phone_calls?: number;
  gmb_website_clicks?: number;

  // Bing
  bing_impressions?: number;
  bing_clicks?: number;
  bing_ctr?: number;
  bing_seo_score?: number;
  bing_pages_indexed?: number;
  bing_crawl_errors?: number;
  bing_blocked_urls?: number;
  bing_mobile_friendly?: boolean;
  bing_backlinks?: number;
  bing_linking_domains?: number;
  bing_crawl_rate?: number;
  bing_last_crawl_date?: Date;

  // Technical
  tech_page_speed_mobile?: number;
  tech_page_speed_desktop?: number;
  tech_total_pages?: number;
  tech_blog_posts?: number;
  tech_avg_word_count?: number;
  tech_thin_content_pages?: number;
  tech_duplicate_content_pct?: number;
  tech_title_tags_coverage?: number;
  tech_meta_desc_coverage?: number;
  tech_h1_tags_coverage?: number;
  tech_alt_text_coverage?: number;
  tech_internal_linking_density?: number;
  tech_has_robots_txt?: boolean;
  tech_has_xml_sitemap?: boolean;
  tech_has_ssl?: boolean;

  // Schema
  schema_local_business?: boolean;
  schema_organization?: boolean;
  schema_product?: boolean;
  schema_faq?: boolean;
  schema_review?: boolean;
  schema_breadcrumb?: boolean;

  // E-E-A-T
  eeat_experience?: number;
  eeat_expertise?: number;
  eeat_authoritativeness?: number;
  eeat_trustworthiness?: number;
  eeat_overall?: number;

  // Social
  social_google_reviews?: number;
  social_google_rating?: number;
  social_facebook_followers?: number;
  social_instagram_followers?: number;
  social_linkedin_followers?: number;

  // Citations
  citations_total?: number;
  citations_consistent_pct?: number;
  citations_inconsistent?: number;
  citations_missing_opportunities?: number;

  // Overall score
  vitals_health_score?: number;

  // JSON fields
  gsc_data?: any;
  gmb_data?: any;
  bing_data?: any;
  competitors_data?: any;
  keywords_data?: any;

  // Metadata
  audit_duration_ms?: number;
  data_sources?: string[];
  errors?: any;
}
