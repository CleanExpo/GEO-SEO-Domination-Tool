/**
 * Onboarding Schemas Test Suite
 *
 * Tests all 5 Zod validation schemas for correctness
 * Task 1.2 - Verification tests
 */

import {
  businessInfoSchema,
  websiteSchema,
  seoGoalsSchema,
  contentStrategySchema,
  servicesSchema,
  validateStep,
  normalizeWebsiteUrl,
  normalizePhone,
  formatPhone
} from '../onboarding-schemas';

describe('Business Info Schema (Step 0)', () => {
  test('✅ Valid data passes', () => {
    const validData = {
      businessName: 'Acme Corp',
      email: 'contact@acme.com',
      contactName: 'John Doe',
      phone: '(123) 456-7890',
      address: '123 Main St',
      industry: 'Technology'
    };

    const result = businessInfoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('❌ Missing business name fails', () => {
    const invalidData = {
      businessName: '',
      email: 'contact@acme.com',
      contactName: 'John Doe'
    };

    const result = businessInfoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Business name is required');
    }
  });

  test('❌ Invalid email format fails', () => {
    const invalidData = {
      businessName: 'Acme Corp',
      email: 'invalid@',
      contactName: 'John Doe'
    };

    const result = businessInfoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('valid email');
    }
  });

  test('❌ Invalid phone format fails', () => {
    const invalidData = {
      businessName: 'Acme Corp',
      email: 'contact@acme.com',
      contactName: 'John Doe',
      phone: '123' // Too short
    };

    const result = businessInfoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('10 digits');
    }
  });

  test('✅ Optional fields can be empty strings', () => {
    const validData = {
      businessName: 'Acme Corp',
      email: 'contact@acme.com',
      contactName: 'John Doe',
      phone: '',
      address: '',
      industry: ''
    };

    const result = businessInfoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('Website Schema (Step 1)', () => {
  test('✅ Valid with existing website', () => {
    const validData = {
      hasExistingWebsite: true,
      website: 'https://acme.com',
      websitePlatform: 'WordPress'
    };

    const result = websiteSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('✅ Valid without existing website', () => {
    const validData = {
      hasExistingWebsite: false,
      website: '',
      websitePlatform: ''
    };

    const result = websiteSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('❌ Has website but URL missing fails', () => {
    const invalidData = {
      hasExistingWebsite: true,
      website: '',
      websitePlatform: 'WordPress'
    };

    const result = websiteSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('Website URL is required');
    }
  });

  test('❌ Invalid URL format fails', () => {
    const invalidData = {
      hasExistingWebsite: true,
      website: 'not-a-url',
      websitePlatform: ''
    };

    const result = websiteSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('SEO Goals Schema (Step 2)', () => {
  test('✅ Valid with goals only', () => {
    const validData = {
      primaryGoals: ['Increase organic traffic'],
      targetKeywords: [],
      targetLocations: [],
      monthlyTrafficGoal: undefined
    };

    const result = seoGoalsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('✅ Valid with keywords only', () => {
    const validData = {
      primaryGoals: [],
      targetKeywords: ['seo services'],
      targetLocations: [],
      monthlyTrafficGoal: undefined
    };

    const result = seoGoalsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('✅ Valid with both goals and keywords', () => {
    const validData = {
      primaryGoals: ['Increase organic traffic', 'Improve search rankings'],
      targetKeywords: ['seo', 'marketing', 'digital'],
      targetLocations: ['New York', 'Los Angeles'],
      monthlyTrafficGoal: 10000
    };

    const result = seoGoalsSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('❌ Empty goals and keywords fails', () => {
    const invalidData = {
      primaryGoals: [],
      targetKeywords: [],
      targetLocations: [],
      monthlyTrafficGoal: undefined
    };

    const result = seoGoalsSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 1');
    }
  });
});

describe('Content Strategy Schema (Step 3)', () => {
  test('✅ Valid with required content types', () => {
    const validData = {
      contentTypes: ['Blog posts', 'Case studies'],
      contentFrequency: 'weekly' as const,
      brandVoice: 'Professional and friendly'
    };

    const result = contentStrategySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('❌ Empty content types fails', () => {
    const invalidData = {
      contentTypes: [],
      contentFrequency: 'weekly' as const,
      brandVoice: ''
    };

    const result = contentStrategySchema.safeParse(validData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 1 content type');
    }
  });

  test('✅ Default content frequency is weekly', () => {
    const validData = {
      contentTypes: ['Blog posts'],
      brandVoice: ''
    };

    const result = contentStrategySchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contentFrequency).toBe('weekly');
    }
  });
});

describe('Services Schema (Step 4)', () => {
  test('✅ Valid with selected services', () => {
    const validData = {
      selectedServices: ['SEO Audit', 'Content Creation'],
      budget: '$1,000 - $2,500/month',
      competitors: ['competitor1.com', 'competitor2.com']
    };

    const result = servicesSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('❌ Empty services fails', () => {
    const invalidData = {
      selectedServices: [],
      budget: '',
      competitors: []
    };

    const result = servicesSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 1 service');
    }
  });
});

describe('validateStep Helper Function', () => {
  test('Step 0 validation works', () => {
    const data = {
      businessName: 'Test',
      email: 'test@test.com',
      contactName: 'Test User'
    };

    const { success, errors } = validateStep(0, data);
    expect(success).toBe(true);
    expect(Object.keys(errors).length).toBe(0);
  });

  test('Step 0 validation returns errors', () => {
    const data = {
      businessName: '',
      email: 'invalid',
      contactName: 'Test'
    };

    const { success, errors } = validateStep(0, data);
    expect(success).toBe(false);
    expect(errors.businessName).toBeDefined();
    expect(errors.email).toBeDefined();
  });
});

describe('Helper Functions', () => {
  test('normalizeWebsiteUrl adds https://', () => {
    expect(normalizeWebsiteUrl('example.com')).toBe('https://example.com');
    expect(normalizeWebsiteUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeWebsiteUrl('https://example.com')).toBe('https://example.com');
  });

  test('normalizePhone strips formatting', () => {
    expect(normalizePhone('(123) 456-7890')).toBe('1234567890');
    expect(normalizePhone('123-456-7890')).toBe('1234567890');
    expect(normalizePhone('1234567890')).toBe('1234567890');
  });

  test('formatPhone adds formatting', () => {
    expect(formatPhone('1234567890')).toBe('(123) 456-7890');
    expect(formatPhone('123')).toBe('123'); // Too short, return as-is
  });
});
