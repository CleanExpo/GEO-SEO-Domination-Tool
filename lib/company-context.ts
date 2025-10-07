/**
 * Company Context System
 * Provides company-scoped operations for multi-company management
 *
 * Architecture:
 * - Organisation → Multiple Companies
 * - Each Company → CRM data (contacts, deals, tasks, etc.)
 * - Each Company → SEO data (audits, keywords, rankings, etc.)
 *
 * Usage:
 * ```typescript
 * const companyId = await getActiveCompanyId();
 * const company = await getActiveCompany();
 * await withCompanyScope(companyId, async (companyId) => {
 *   // All operations here are scoped to this company
 * });
 * ```
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getCurrentOrganisationId } from './tenant-context';

/**
 * Company type definition
 */
export interface Company {
  id: string;
  name: string;
  website: string;
  industry?: string;
  location?: string;
  organisation_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get the active company ID from cookies or session
 * Falls back to the first company in the user's organisation if not set
 *
 * @throws Error if user has no companies in their organisation
 */
export async function getActiveCompanyId(): Promise<string> {
  const cookieStore = cookies();

  // Check if there's an active company in cookies
  const activeCompanyIdCookie = cookieStore.get('active_company_id');
  if (activeCompanyIdCookie?.value) {
    return activeCompanyIdCookie.value;
  }

  // Fall back to first company in organisation
  const organisationId = await getCurrentOrganisationId();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No companies found in organisation. Please create a company first.');
  }

  return data.id;
}

/**
 * Get the active company with full details
 */
export async function getActiveCompany(): Promise<Company> {
  const cookieStore = cookies();
  const organisationId = await getCurrentOrganisationId();

  // Check for active company ID in cookies
  const activeCompanyIdCookie = cookieStore.get('active_company_id');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let query = supabase
    .from('companies')
    .select('*')
    .eq('organisation_id', organisationId);

  if (activeCompanyIdCookie?.value) {
    query = query.eq('id', activeCompanyIdCookie.value);
  } else {
    query = query.order('created_at', { ascending: true }).limit(1);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new Error('No companies found in organisation. Please create a company first.');
  }

  return data as Company;
}

/**
 * Get all companies in the current user's organisation
 * Used for company switcher UI
 */
export async function getUserCompanies(): Promise<Company[]> {
  const cookieStore = cookies();
  const organisationId = await getCurrentOrganisationId();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: true });

  if (error) {
    return [];
  }

  return (data || []) as Company[];
}

/**
 * Wrapper function that ensures all queries are scoped to a specific company
 *
 * Usage:
 * ```typescript
 * const contacts = await withCompanyScope(companyId, async (companyId) => {
 *   return supabase
 *     .from('crm_contacts')
 *     .select('*')
 *     .eq('company_id', companyId);
 * });
 * ```
 */
export async function withCompanyScope<T>(
  companyId: string,
  operation: (companyId: string) => Promise<T>
): Promise<T> {
  // Verify the company belongs to the user's organisation
  const organisationId = await getCurrentOrganisationId();

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .eq('organisation_id', organisationId)
    .single();

  if (error || !data) {
    throw new Error('Forbidden: Company does not belong to your organisation');
  }

  return operation(companyId);
}

/**
 * Set the active company ID in cookies
 * This is a client-side operation, typically called from API route
 */
export async function setActiveCompanyId(companyId: string): Promise<void> {
  // Verify company belongs to user's organisation
  await withCompanyScope(companyId, async () => {
    // Verification happens in withCompanyScope
    return true;
  });

  // Cookie setting will be handled by API route that calls this function
  // since we can't set cookies from server components
}

/**
 * Check if a company exists and belongs to the user's organisation
 */
export async function verifyCompanyAccess(companyId: string): Promise<boolean> {
  try {
    await withCompanyScope(companyId, async () => true);
    return true;
  } catch {
    return false;
  }
}
