/**
 * Navigation Map Module
 *
 * This module provides a type-safe, centralized navigation configuration
 * for the GEO-SEO Domination Tool application.
 *
 * All navigation items are validated to ensure corresponding routes exist.
 */

import { LucideIcon } from 'lucide-react';

/**
 * Route guard types for access control
 */
export type RouteGuard = 'auth' | 'admin' | 'none';

/**
 * Navigation section categories
 */
export type NavSection = 'workspace' | 'seo' | 'pipeline' | 'projects' | 'resources' | 'members';

/**
 * Base navigation item structure
 */
export interface NavItem {
  /** Unique identifier for the navigation item */
  key: string;

  /** Display label for the navigation item */
  label: string;

  /** Route path (must correspond to an existing page.tsx) */
  href: string;

  /** Optional Lucide icon component */
  icon?: LucideIcon;

  /** Navigation section this item belongs to */
  section: NavSection;

  /** Access control guard (default: 'auth') */
  guard?: RouteGuard;

  /** Optional nested child navigation items */
  children?: NavItem[];
}

/**
 * Complete navigation map structure
 */
export interface NavMap {
  seo: NavItem[];
  pipeline: NavItem[];
  projects: NavItem[];
  resources: NavItem[];
  members: NavItem[];
  settings: NavItem[];
}

/**
 * Builds and returns the complete navigation map
 *
 * @returns {NavMap} The complete navigation structure
 */
export function buildNavMap(): NavMap {
  return {
    seo: [
      {
        key: 'overview',
        label: 'Overview',
        href: '/dashboard',
        section: 'seo',
        guard: 'auth',
      },
      {
        key: 'companies',
        label: 'Companies',
        href: '/companies',
        section: 'seo',
        guard: 'auth',
      },
      {
        key: 'seo-audits',
        label: 'SEO Audits',
        href: '/audits',
        section: 'seo',
        guard: 'auth',
      },
      {
        key: 'keywords',
        label: 'Keywords',
        href: '/keywords',
        section: 'seo',
        guard: 'auth',
      },
      {
        key: 'rankings',
        label: 'Rankings',
        href: '/rankings',
        section: 'seo',
        guard: 'auth',
      },
      {
        key: 'reports',
        label: 'Reports',
        href: '/reports',
        section: 'seo',
        guard: 'auth',
      },
    ],
    pipeline: [
      {
        key: 'contacts',
        label: 'Contacts',
        href: '/crm/contacts',
        section: 'pipeline',
        guard: 'auth',
      },
      {
        key: 'deals',
        label: 'Deals',
        href: '/crm/deals',
        section: 'pipeline',
        guard: 'auth',
      },
      {
        key: 'tasks',
        label: 'Tasks',
        href: '/crm/tasks',
        section: 'pipeline',
        guard: 'auth',
      },
      {
        key: 'calendar',
        label: 'Calendar',
        href: '/crm/calendar',
        section: 'pipeline',
        guard: 'auth',
      },
    ],
    projects: [
      {
        key: 'projects',
        label: 'Projects',
        href: '/projects',
        section: 'projects',
        guard: 'auth',
      },
      {
        key: 'github-projects',
        label: 'GitHub Projects',
        href: '/projects/github',
        section: 'projects',
        guard: 'auth',
      },
      {
        key: 'notes-docs',
        label: 'Notes & Docs',
        href: '/projects/notes',
        section: 'projects',
        guard: 'auth',
      },
    ],
    resources: [
      {
        key: 'prompts',
        label: 'Prompts',
        href: '/resources/prompts',
        section: 'resources',
        guard: 'auth',
      },
      {
        key: 'components',
        label: 'Components',
        href: '/resources/components',
        section: 'resources',
        guard: 'auth',
      },
      {
        key: 'ai-tools',
        label: 'AI Tools',
        href: '/resources/ai-tools',
        section: 'resources',
        guard: 'auth',
      },
      {
        key: 'tutorials',
        label: 'Tutorials',
        href: '/resources/tutorials',
        section: 'resources',
        guard: 'auth',
      },
    ],
    members: [
      {
        key: 'support',
        label: 'Support',
        href: '/support',
        section: 'members',
        guard: 'auth',
      },
    ],
    settings: [
      {
        key: 'settings',
        label: 'Settings',
        href: '/settings',
        section: 'workspace',
        guard: 'auth',
      },
    ],
  };
}

/**
 * Get all navigation items as a flat array
 *
 * @returns {NavItem[]} All navigation items
 */
export function getAllNavItems(): NavItem[] {
  const navMap = buildNavMap();
  return [
    ...navMap.seo,
    ...navMap.pipeline,
    ...navMap.projects,
    ...navMap.resources,
    ...navMap.members,
    ...navMap.settings,
  ];
}

/**
 * Get navigation items by section
 *
 * @param {NavSection} section - The section to filter by
 * @returns {NavItem[]} Navigation items for the specified section
 */
export function getNavItemsBySection(section: NavSection): NavItem[] {
  return getAllNavItems().filter(item => item.section === section);
}

/**
 * Get navigation item by key
 *
 * @param {string} key - The unique key of the navigation item
 * @returns {NavItem | undefined} The navigation item or undefined if not found
 */
export function getNavItemByKey(key: string): NavItem | undefined {
  return getAllNavItems().find(item => item.key === key);
}

/**
 * Get navigation item by href
 *
 * @param {string} href - The route path
 * @returns {NavItem | undefined} The navigation item or undefined if not found
 */
export function getNavItemByHref(href: string): NavItem | undefined {
  return getAllNavItems().find(item => item.href === href);
}

/**
 * Validate that all navigation hrefs have corresponding routes
 *
 * @param {string[]} existingRoutes - Array of existing route paths
 * @returns {Object} Validation results with missing routes
 */
export function validateNavRoutes(existingRoutes: string[]): {
  valid: boolean;
  missingRoutes: string[];
  totalRoutes: number;
} {
  const allNavItems = getAllNavItems();
  const navHrefs = allNavItems.map(item => item.href);
  const missingRoutes = navHrefs.filter(href => !existingRoutes.includes(href));

  return {
    valid: missingRoutes.length === 0,
    missingRoutes,
    totalRoutes: navHrefs.length,
  };
}

/**
 * Export the complete navigation map for use in components
 */
export const navMap = buildNavMap();
