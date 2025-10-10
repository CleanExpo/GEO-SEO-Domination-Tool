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
export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;

/**
 * Validation Helper Functions
 */

/**
 * Validate a specific step and return detailed error messages
 *
 * @param step - Step number (0-4)
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
