/**
 * Onboarding Form Validation Schemas
 *
 * Zod schemas for type-safe, reactive validation of client onboarding flow
 * Each step has its own schema with custom error messages for better UX
 *
 * Created: January 10, 2025
 * Task: 1.2 - Create Zod validation schemas
 */

import { z } from 'zod';

/**
 * Step 0: Business Information
 *
 * Required: businessName, email, contactName
 * Optional: phone, address, industry
 */
export const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(100, "Business name must be less than 100 characters"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address (e.g., contact@business.com)"),

  contactName: z
    .string()
    .min(1, "Contact name is required")
    .max(100, "Contact name must be less than 100 characters"),

  phone: z
    .string()
    .regex(
      /^[\d\s()+-]{10,}$/,
      "Phone must be at least 10 digits (formatting optional)"
    )
    .optional()
    .or(z.literal('')), // Allow empty string

  address: z
    .string()
    .max(200, "Address must be less than 200 characters")
    .optional()
    .or(z.literal('')),

  industry: z
    .string()
    .max(50, "Industry must be less than 50 characters")
    .optional()
    .or(z.literal(''))
});

/**
 * Step 1: Website Details
 *
 * Conditional validation:
 * - If hasExistingWebsite = true, website URL is required
 * - If hasExistingWebsite = false, website is optional
 */
export const websiteSchema = z.object({
  hasExistingWebsite: z.boolean(),

  website: z
    .string()
    .url("Please enter a valid URL starting with http:// or https://")
    .optional()
    .or(z.literal('')),

  websitePlatform: z
    .string()
    .max(50, "Platform name must be less than 50 characters")
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => {
    // If user has existing website, URL is required
    if (data.hasExistingWebsite) {
      return !!data.website && data.website.length > 0;
    }
    // Otherwise, no website needed
    return true;
  },
  {
    message: "Website URL is required when you have an existing website",
    path: ['website'] // Error shown on website field
  }
);

/**
 * Step 2: SEO Goals
 *
 * Flexible validation: At least 1 goal OR at least 1 keyword
 *
 * NOTE: Based on QA review, using min 1 keyword (current behavior)
 * If business requires min 3 keywords, change .min(1) to .min(3)
 */
export const seoGoalsSchema = z.object({
  primaryGoals: z
    .array(z.string())
    .default([]),

  targetKeywords: z
    .array(z.string())
    .default([]),

  targetLocations: z
    .array(z.string())
    .optional()
    .default([]),

  monthlyTrafficGoal: z
    .number()
    .int()
    .positive("Traffic goal must be a positive number")
    .optional()
}).refine(
  (data) => {
    // At least 1 goal OR at least 1 keyword required
    return data.primaryGoals.length > 0 || data.targetKeywords.length > 0;
  },
  {
    message: "Please select at least 1 SEO goal or add at least 1 target keyword",
    path: ['primaryGoals'] // Error shown on goals field
  }
);

/**
 * Step 2 Alternative: Strict Keyword Validation
 *
 * Uncomment this schema if business requires minimum 3 keywords
 */
export const seoGoalsStrictSchema = z.object({
  primaryGoals: z
    .array(z.string())
    .min(1, "Please select at least 1 SEO goal"),

  targetKeywords: z
    .array(z.string())
    .min(3, "Please enter at least 3 target keywords"),

  targetLocations: z
    .array(z.string())
    .optional()
    .default([]),

  monthlyTrafficGoal: z
    .number()
    .int()
    .positive("Traffic goal must be a positive number")
    .optional()
});

/**
 * Step 3: Content Strategy
 *
 * Required: At least 1 content type
 * Optional: contentFrequency, brandVoice
 */
export const contentStrategySchema = z.object({
  contentTypes: z
    .array(z.string())
    .min(1, "Please select at least 1 content type"),

  contentFrequency: z
    .enum(['daily', 'weekly', 'bi-weekly', 'monthly'], {
      errorMap: () => ({ message: "Please select a content frequency" })
    })
    .default('weekly'),

  brandVoice: z
    .string()
    .max(500, "Brand voice description must be less than 500 characters")
    .optional()
    .or(z.literal(''))
});

/**
 * Step 4: Services & Budget
 *
 * Required: At least 1 service selected
 * Optional: budget, competitors
 */
export const servicesSchema = z.object({
  selectedServices: z
    .array(z.string())
    .min(1, "Please select at least 1 service"),

  budget: z
    .string()
    .optional()
    .or(z.literal('')),

  competitors: z
    .array(z.string())
    .optional()
    .default([])
});

/**
 * Step 5: Website Access (NEW - Credential Capture)
 *
 * Optional: All fields are optional (client may not have/want to provide)
 * Enables auto-actions and WordPress integration if provided
 */
export const websiteAccessSchema = z.object({
  // Hosting Access
  hasHostingAccess: z.boolean().default(false),
  hostingProvider: z.string().optional().or(z.literal('')),
  hostingControlPanel: z.string().optional().or(z.literal('')), // cPanel, Plesk, etc.
  hostingUsername: z.string().optional().or(z.literal('')),
  hostingPassword: z.string().optional().or(z.literal('')),
  hostingUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),

  // CMS Access (WordPress, Shopify, etc.)
  hasCmsAccess: z.boolean().default(false),
  cmsType: z.string().optional().or(z.literal('')), // WordPress, Shopify, Wix, Custom
  cmsVersion: z.string().optional().or(z.literal('')),
  cmsAdminUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  cmsUsername: z.string().optional().or(z.literal('')),
  cmsPassword: z.string().optional().or(z.literal('')),

  // FTP/SFTP Access
  hasFtpAccess: z.boolean().default(false),
  ftpHost: z.string().optional().or(z.literal('')),
  ftpPort: z.number().int().positive().optional(),
  ftpProtocol: z.enum(['ftp', 'sftp', 'ftps']).optional(),
  ftpUsername: z.string().optional().or(z.literal('')),
  ftpPassword: z.string().optional().or(z.literal('')),

  // DNS Access
  hasDnsAccess: z.boolean().default(false),
  dnsProvider: z.string().optional().or(z.literal('')),
  dnsUsername: z.string().optional().or(z.literal('')),
  dnsPassword: z.string().optional().or(z.literal('')),
  dnsApiKey: z.string().optional().or(z.literal('')),

  // Database Access
  hasDatabaseAccess: z.boolean().default(false),
  dbType: z.string().optional().or(z.literal('')), // MySQL, PostgreSQL, etc.
  dbHost: z.string().optional().or(z.literal('')),
  dbPort: z.number().int().positive().optional(),
  dbName: z.string().optional().or(z.literal('')),
  dbUsername: z.string().optional().or(z.literal('')),
  dbPassword: z.string().optional().or(z.literal(''))
});

/**
 * Step 6: Social Media Credentials (NEW - Credential Capture)
 *
 * Optional: Client selects which platforms they want to connect
 * Enables social media automation if provided
 */
export const socialMediaSchema = z.object({
  // Facebook Business
  hasFacebookBusiness: z.boolean().default(false),
  facebookBusinessId: z.string().optional().or(z.literal('')),
  facebookAccessToken: z.string().optional().or(z.literal('')),
  facebookPageId: z.string().optional().or(z.literal('')),

  // Instagram Business
  hasInstagramBusiness: z.boolean().default(false),
  instagramBusinessId: z.string().optional().or(z.literal('')),
  instagramAccessToken: z.string().optional().or(z.literal('')),

  // LinkedIn Company Page
  hasLinkedInPage: z.boolean().default(false),
  linkedInPageId: z.string().optional().or(z.literal('')),
  linkedInAccessToken: z.string().optional().or(z.literal('')),

  // Twitter/X Business
  hasTwitter: z.boolean().default(false),
  twitterApiKey: z.string().optional().or(z.literal('')),
  twitterApiSecret: z.string().optional().or(z.literal('')),
  twitterAccessToken: z.string().optional().or(z.literal('')),
  twitterAccessSecret: z.string().optional().or(z.literal('')),

  // YouTube Channel
  hasYouTube: z.boolean().default(false),
  youTubeChannelId: z.string().optional().or(z.literal('')),
  youTubeApiKey: z.string().optional().or(z.literal('')),

  // TikTok Business
  hasTikTok: z.boolean().default(false),
  tiktokUsername: z.string().optional().or(z.literal('')),
  tiktokAccessToken: z.string().optional().or(z.literal('')),

  // Pinterest Business
  hasPinterest: z.boolean().default(false),
  pinterestUsername: z.string().optional().or(z.literal('')),
  pinterestAccessToken: z.string().optional().or(z.literal(''))
});

/**
 * Step 7: Google Ecosystem (NEW - Credential Capture)
 *
 * Optional: Client connects Google services
 * Enables Google Analytics, Search Console, GBP automation
 */
export const googleEcosystemSchema = z.object({
  // Google Business Profile
  hasGoogleBusinessProfile: z.boolean().default(false),
  gbpEmail: z.string().email("Please enter a valid email").optional().or(z.literal('')),
  gbpLocationId: z.string().optional().or(z.literal('')),
  gbpAccessToken: z.string().optional().or(z.literal('')),

  // Google Analytics 4
  hasGoogleAnalytics: z.boolean().default(false),
  ga4PropertyId: z.string().optional().or(z.literal('')),
  ga4PropertyName: z.string().optional().or(z.literal('')),
  ga4AccessToken: z.string().optional().or(z.literal('')),

  // Google Search Console
  hasSearchConsole: z.boolean().default(false),
  gscSiteUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  gscAccessToken: z.string().optional().or(z.literal('')),

  // Google Ads
  hasGoogleAds: z.boolean().default(false),
  gadsCustomerId: z.string().optional().or(z.literal('')),
  gadsAccountName: z.string().optional().or(z.literal('')),
  gadsAccessToken: z.string().optional().or(z.literal('')),
  gadsDeveloperToken: z.string().optional().or(z.literal('')),

  // Google Tag Manager
  hasTagManager: z.boolean().default(false),
  gtmContainerId: z.string().optional().or(z.literal('')),
  gtmContainerName: z.string().optional().or(z.literal('')),
  gtmAccessToken: z.string().optional().or(z.literal(''))
});

/**
 * Step 8: Marketing Tools (NEW - Credential Capture)
 *
 * Optional: Email marketing and CRM credentials
 * Enables marketing automation integration
 */
export const marketingToolsSchema = z.object({
  // Email Marketing Platform
  hasEmailMarketing: z.boolean().default(false),
  emailPlatform: z.string().optional().or(z.literal('')), // Mailchimp, Klaviyo, etc.
  emailApiKey: z.string().optional().or(z.literal('')),
  emailListId: z.string().optional().or(z.literal('')),

  // CRM System
  hasCrm: z.boolean().default(false),
  crmPlatform: z.string().optional().or(z.literal('')), // Salesforce, HubSpot, etc.
  crmApiKey: z.string().optional().or(z.literal('')),
  crmDomain: z.string().optional().or(z.literal('')),

  // Call Tracking
  hasCallTracking: z.boolean().default(false),
  callTrackingProvider: z.string().optional().or(z.literal('')),
  callTrackingApiKey: z.string().optional().or(z.literal('')),

  // Analytics Tools
  hasHotjar: z.boolean().default(false),
  hotjarSiteId: z.string().optional().or(z.literal('')),
  hotjarApiKey: z.string().optional().or(z.literal(''))
});

/**
 * Step 9: Advertising Platforms (NEW - Credential Capture)
 *
 * Optional: Ad platform credentials for campaign management
 * Enables advertising optimization and reporting
 */
export const advertisingSchema = z.object({
  // Google Ads (if not already connected in Google Ecosystem)
  hasGoogleAdsAccount: z.boolean().default(false),
  googleAdsManagerId: z.string().optional().or(z.literal('')),
  googleAdsDeveloperToken: z.string().optional().or(z.literal('')),

  // Facebook Ads Manager
  hasFacebookAds: z.boolean().default(false),
  facebookAdsAccountId: z.string().optional().or(z.literal('')),
  facebookAdsAccessToken: z.string().optional().or(z.literal('')),

  // Microsoft Ads (Bing)
  hasMicrosoftAds: z.boolean().default(false),
  microsoftAdsAccountId: z.string().optional().or(z.literal('')),
  microsoftAdsAccessToken: z.string().optional().or(z.literal(''))
});

/**
 * Complete Onboarding Data Schema
 *
 * Combines all step schemas for final submission validation
 * Note: Cannot merge schemas with .refine(), so we validate separately
 */
export const completeOnboardingSchema = z.object({
  // Business Info
  businessName: z.string().min(1),
  email: z.string().email(),
  contactName: z.string().min(1),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),

  // Website
  hasExistingWebsite: z.boolean(),
  website: z.string().url().optional().or(z.literal('')),
  websitePlatform: z.string().optional().or(z.literal('')),

  // SEO Goals
  primaryGoals: z.array(z.string()).default([]),
  targetKeywords: z.array(z.string()).default([]),
  targetLocations: z.array(z.string()).optional().default([]),
  monthlyTrafficGoal: z.number().optional(),

  // Content
  contentTypes: z.array(z.string()).min(1),
  contentFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']).default('weekly'),
  brandVoice: z.string().optional().or(z.literal('')),

  // Services
  selectedServices: z.array(z.string()).min(1),
  budget: z.string().optional().or(z.literal('')),
  competitors: z.array(z.string()).optional().default([])
});

/**
 * TypeScript Types (derived from Zod schemas)
 *
 * Use these types throughout the application for type safety
 */
export type BusinessInfo = z.infer<typeof businessInfoSchema>;
export type WebsiteDetails = z.infer<typeof websiteSchema>;
export type SeoGoals = z.infer<typeof seoGoalsSchema>;
export type ContentStrategy = z.infer<typeof contentStrategySchema>;
export type ServicesAndBudget = z.infer<typeof servicesSchema>;
export type WebsiteAccess = z.infer<typeof websiteAccessSchema>;
export type SocialMediaCredentials = z.infer<typeof socialMediaSchema>;
export type GoogleEcosystemCredentials = z.infer<typeof googleEcosystemSchema>;
export type MarketingToolsCredentials = z.infer<typeof marketingToolsSchema>;
export type AdvertisingCredentials = z.infer<typeof advertisingSchema>;
export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;

/**
 * Validation Helper Functions
 */

/**
 * Validate a specific step and return detailed error messages
 *
 * @param step - Step number (0-9)
 * @param data - Form data to validate
 * @returns { success: boolean, errors: Record<string, string> }
 */
export function validateStep(step: number, data: any): {
  success: boolean;
  errors: Record<string, string>;
} {
  let schema: z.ZodType<any>;

  switch (step) {
    case 0:
      schema = businessInfoSchema;
      break;
    case 1:
      schema = websiteSchema;
      break;
    case 2:
      schema = seoGoalsSchema;
      break;
    case 3:
      schema = contentStrategySchema;
      break;
    case 4:
      schema = servicesSchema;
      break;
    case 5:
      schema = websiteAccessSchema;
      break;
    case 6:
      schema = socialMediaSchema;
      break;
    case 7:
      schema = googleEcosystemSchema;
      break;
    case 8:
      schema = marketingToolsSchema;
      break;
    case 9:
      schema = advertisingSchema;
      break;
    default:
      return { success: true, errors: {} };
  }

  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, errors: {} };
  }

  // Convert Zod errors to field-level error messages
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const field = err.path.join('.');
    errors[field] = err.message;
  });

  return { success: false, errors };
}

/**
 * Get first error message for display in toast
 *
 * @param errors - Error object from validateStep
 * @returns First error message or null
 */
export function getFirstError(errors: Record<string, string>): string | null {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : null;
}

/**
 * Auto-prepend https:// to website URL if missing protocol
 *
 * @param url - User-entered URL
 * @returns URL with protocol
 */
export function normalizeWebsiteUrl(url: string): string {
  if (!url) return url;

  const trimmed = url.trim();

  // Already has protocol
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Add https:// by default
  return `https://${trimmed}`;
}

/**
 * Strip phone formatting for storage
 *
 * @param phone - Formatted phone number
 * @returns Digits only
 */
export function normalizePhone(phone: string): string {
  if (!phone) return phone;
  return phone.replace(/[^\d]/g, '');
}

/**
 * Format phone for display
 *
 * @param phone - Digits-only phone
 * @returns Formatted phone (123) 456-7890
 */
export function formatPhone(phone: string): string {
  if (!phone) return phone;

  const digits = phone.replace(/[^\d]/g, '');

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return phone;
}
