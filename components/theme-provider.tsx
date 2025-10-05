/**
 * Theme Provider Component
 * Applies organisation-specific theming via CSS variables
 * Phase 3: THEME-001
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { OrganisationTheme, generateThemeCSS } from '@/services/theme-manager';

// ============================================================
// CONTEXT & TYPES
// ============================================================

interface ThemeContextValue {
  theme: OrganisationTheme | null;
  isLoading: boolean;
  error: string | null;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// ============================================================
// THEME PROVIDER COMPONENT
// ============================================================

interface ThemeProviderProps {
  organisationId: string;
  children: React.ReactNode;
  fallbackTheme?: OrganisationTheme;
}

export function ThemeProvider({ organisationId, children, fallbackTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<OrganisationTheme | null>(fallbackTheme || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTheme = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/themes?organisationId=${organisationId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch theme: ${response.statusText}`);
      }

      const data = await response.json();
      setTheme(data.theme);
    } catch (err: any) {
      console.error('Error loading theme:', err);
      setError(err.message);

      // Use fallback theme if provided
      if (fallbackTheme) {
        setTheme(fallbackTheme);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organisationId) {
      fetchTheme();
    }
  }, [organisationId]);

  // Apply theme CSS when theme changes
  useEffect(() => {
    if (theme) {
      applyThemeToDOM(theme);
    }
  }, [theme]);

  const contextValue: ThemeContextValue = {
    theme,
    isLoading,
    error,
    refreshTheme: fetchTheme,
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

// ============================================================
// DOM MANIPULATION
// ============================================================

/**
 * Apply theme CSS variables to the DOM
 * @param theme - Organisation theme configuration
 */
function applyThemeToDOM(theme: OrganisationTheme) {
  // Remove existing theme styles
  const existingStyle = document.getElementById('org-theme-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new style element
  const style = document.createElement('style');
  style.id = 'org-theme-styles';
  style.textContent = generateThemeCSS(theme);

  document.head.appendChild(style);

  // Update favicon if provided
  if (theme.faviconUrl) {
    updateFavicon(theme.faviconUrl);
  }

  // Store theme in localStorage for SSR hydration
  try {
    localStorage.setItem('org-theme', JSON.stringify(theme));
  } catch (e) {
    console.warn('Failed to store theme in localStorage:', e);
  }
}

/**
 * Update favicon link element
 * @param faviconUrl - URL to favicon
 */
function updateFavicon(faviconUrl: string) {
  const existingFavicon = document.querySelector('link[rel="icon"]');

  if (existingFavicon) {
    existingFavicon.setAttribute('href', faviconUrl);
  } else {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = faviconUrl;
    document.head.appendChild(favicon);
  }
}

// ============================================================
// LOGO COMPONENT
// ============================================================

interface OrgLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  fallbackText?: string;
}

export function OrgLogo({ className = '', variant = 'light', fallbackText }: OrgLogoProps) {
  const { theme } = useTheme();

  if (!theme) {
    return fallbackText ? (
      <span className={`font-bold ${className}`}>{fallbackText}</span>
    ) : null;
  }

  const logoUrl = variant === 'dark' && theme.logoDarkUrl ? theme.logoDarkUrl : theme.logoUrl;

  if (!logoUrl) {
    return fallbackText ? (
      <span className={`font-bold ${className}`}>{fallbackText}</span>
    ) : null;
  }

  return (
    <img
      src={logoUrl}
      alt="Organisation logo"
      className={`org-logo ${className}`}
      style={{ maxHeight: '2.5rem' }}
    />
  );
}

// ============================================================
// THEME PREVIEW WRAPPER
// ============================================================

interface ThemePreviewProps {
  theme: OrganisationTheme;
  children: React.ReactNode;
}

/**
 * Preview theme without affecting global styles
 * Useful for theme customiser preview mode
 */
export function ThemePreview({ theme, children }: ThemePreviewProps) {
  const themeCSS = generateThemeCSS(theme);

  return (
    <div className="theme-preview-container">
      <style>{themeCSS}</style>
      {children}
    </div>
  );
}
