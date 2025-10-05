/**
 * Theme Manager Service
 * Handles organisation theme operations, CSS generation, and colour utilities
 * Phase 3: THEME-001
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface OrganisationTheme {
  id: string;
  organisationId: string;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  customDomainVerified: boolean;
  fontFamily: string;
  headingFontFamily?: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ThemeUpdateInput {
  primaryColour?: string;
  secondaryColour?: string;
  accentColour?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  fontFamily?: string;
  headingFontFamily?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

// ============================================================
// COLOUR UTILITIES
// ============================================================

/**
 * Convert hex colour to HSL format for CSS variables
 * @param hex - Hex colour string (e.g., '#10b981')
 * @returns HSL string (e.g., '160 84% 39%')
 */
export function hexToHSL(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Validate hex colour format
 * @param hex - Hex colour string to validate
 * @returns True if valid hex colour
 */
export function isValidHexColour(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

/**
 * Generate a lighter shade of a colour (for hover states)
 * @param hex - Base hex colour
 * @param percent - Percentage to lighten (default 10)
 * @returns Lightened hex colour
 */
export function lightenColour(hex: string, percent: number = 10): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  const amt = Math.round(2.55 * percent);

  const R = Math.min(255, ((num >> 16) & 0xff) + amt);
  const G = Math.min(255, ((num >> 8) & 0xff) + amt);
  const B = Math.min(255, (num & 0xff) + amt);

  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, '0')}`;
}

// ============================================================
// CSS GENERATION
// ============================================================

/**
 * Border radius values in Tailwind-compatible format
 */
const BORDER_RADIUS_VALUES: Record<string, string> = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
};

/**
 * Generate CSS variables for theme
 * @param theme - Organisation theme configuration
 * @returns CSS string with custom properties
 */
export function generateThemeCSS(theme: OrganisationTheme): string {
  const primaryHSL = hexToHSL(theme.primaryColour);
  const secondaryHSL = hexToHSL(theme.secondaryColour);
  const accentHSL = hexToHSL(theme.accentColour);

  const radiusValue = BORDER_RADIUS_VALUES[theme.borderRadius] || BORDER_RADIUS_VALUES.md;

  return `
:root {
  /* Brand colours (HSL for shadcn/ui compatibility) */
  --primary: ${primaryHSL};
  --primary-foreground: 0 0% 100%;
  --secondary: ${secondaryHSL};
  --secondary-foreground: 0 0% 100%;
  --accent: ${accentHSL};
  --accent-foreground: 0 0% 100%;

  /* Border radius */
  --radius: ${radiusValue};

  /* Font families */
  --font-family: ${theme.fontFamily}, system-ui, -apple-system, sans-serif;
  ${theme.headingFontFamily ? `--font-heading: ${theme.headingFontFamily}, var(--font-family);` : ''}
}

/* Apply font families */
body {
  font-family: var(--font-family);
}

${theme.headingFontFamily ? `
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
` : ''}
  `.trim();
}

/**
 * Generate complete theme stylesheet with all variants
 * @param theme - Organisation theme configuration
 * @returns Full CSS stylesheet string
 */
export function generateFullThemeStylesheet(theme: OrganisationTheme): string {
  const baseCSS = generateThemeCSS(theme);

  // Additional hover states and variants
  const hoverPrimary = lightenColour(theme.primaryColour, 10);
  const hoverSecondary = lightenColour(theme.secondaryColour, 10);

  return `
${baseCSS}

/* Hover states */
.btn-primary:hover {
  background-color: ${hoverPrimary};
}

.btn-secondary:hover {
  background-color: ${hoverSecondary};
}

/* Logo display */
.org-logo {
  max-height: 2.5rem;
  width: auto;
}

/* Favicon injection */
link[rel="icon"] {
  href: ${theme.faviconUrl || '/favicon.ico'};
}
  `.trim();
}

// ============================================================
// THEME MANAGER CLASS
// ============================================================

export class ThemeManager {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Fetch organisation theme
   * @param organisationId - Organisation UUID
   * @returns Theme configuration or null
   */
  async getOrganisationTheme(organisationId: string): Promise<OrganisationTheme | null> {
    const { data, error } = await this.supabase
      .from('organisation_themes')
      .select('*')
      .eq('organisation_id', organisationId)
      .single();

    if (error) {
      console.error('Error fetching theme:', error);
      return null;
    }

    return this.mapDatabaseTheme(data);
  }

  /**
   * Update organisation theme
   * @param organisationId - Organisation UUID
   * @param updates - Theme properties to update
   * @returns Updated theme or null
   */
  async updateOrganisationTheme(
    organisationId: string,
    updates: ThemeUpdateInput
  ): Promise<OrganisationTheme | null> {
    // Validate hex colours if provided
    const colourFields = ['primaryColour', 'secondaryColour', 'accentColour'] as const;
    for (const field of colourFields) {
      if (updates[field] && !isValidHexColour(updates[field]!)) {
        throw new Error(`Invalid hex colour for ${field}: ${updates[field]}`);
      }
    }

    const { data, error } = await this.supabase
      .from('organisation_themes')
      .update(this.mapToDatabase(updates))
      .eq('organisation_id', organisationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating theme:', error);
      return null;
    }

    return this.mapDatabaseTheme(data);
  }

  /**
   * Reset organisation theme to defaults
   * @param organisationId - Organisation UUID
   * @returns Default theme configuration
   */
  async resetOrganisationTheme(organisationId: string): Promise<OrganisationTheme | null> {
    const defaultTheme: ThemeUpdateInput = {
      primaryColour: '#10b981',
      secondaryColour: '#14b8a6',
      accentColour: '#3b82f6',
      fontFamily: 'Inter',
      borderRadius: 'md',
      logoUrl: undefined,
      logoDarkUrl: undefined,
      faviconUrl: undefined,
    };

    return this.updateOrganisationTheme(organisationId, defaultTheme);
  }

  /**
   * Upload brand asset to Supabase Storage
   * @param organisationId - Organisation UUID
   * @param file - File to upload
   * @param type - Asset type ('logo', 'logo-dark', 'favicon')
   * @returns Public URL or null
   */
  async uploadBrandAsset(
    organisationId: string,
    file: File,
    type: 'logo' | 'logo-dark' | 'favicon'
  ): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${organisationId}/${type}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from('organisation-branding')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading asset:', error);
      return null;
    }

    const { data: publicUrlData } = this.supabase.storage
      .from('organisation-branding')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  }

  /**
   * Map database snake_case to camelCase
   */
  private mapDatabaseTheme(data: any): OrganisationTheme {
    return {
      id: data.id,
      organisationId: data.organisation_id,
      primaryColour: data.primary_colour,
      secondaryColour: data.secondary_colour,
      accentColour: data.accent_colour,
      logoUrl: data.logo_url,
      logoDarkUrl: data.logo_dark_url,
      faviconUrl: data.favicon_url,
      customDomain: data.custom_domain,
      customDomainVerified: data.custom_domain_verified,
      fontFamily: data.font_family,
      headingFontFamily: data.heading_font_family,
      borderRadius: data.border_radius,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
    };
  }

  /**
   * Map camelCase to database snake_case
   */
  private mapToDatabase(input: ThemeUpdateInput): any {
    const mapped: any = {};

    if (input.primaryColour !== undefined) mapped.primary_colour = input.primaryColour;
    if (input.secondaryColour !== undefined) mapped.secondary_colour = input.secondaryColour;
    if (input.accentColour !== undefined) mapped.accent_colour = input.accentColour;
    if (input.logoUrl !== undefined) mapped.logo_url = input.logoUrl;
    if (input.logoDarkUrl !== undefined) mapped.logo_dark_url = input.logoDarkUrl;
    if (input.faviconUrl !== undefined) mapped.favicon_url = input.faviconUrl;
    if (input.customDomain !== undefined) mapped.custom_domain = input.customDomain;
    if (input.fontFamily !== undefined) mapped.font_family = input.fontFamily;
    if (input.headingFontFamily !== undefined) mapped.heading_font_family = input.headingFontFamily;
    if (input.borderRadius !== undefined) mapped.border_radius = input.borderRadius;

    return mapped;
  }
}
