/**
 * Tenant Context Middleware
 * Provides multi-tenant scoping for all database queries
 *
 * Ticket: TENANT-001
 * Author: Orchestra-Coordinator (Agent-Tenancy)
 * Date: 2025-10-05
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Get the current user's organisation ID from Supabase
 * Throws error if user is not authenticated or not a member of any organisation
 */
export async function getCurrentOrganisationId(): Promise<string> {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorised: No user session');
  }

  // Get user's organisation membership
  const { data, error } = await supabase
    .from('organisation_members')
    .select('organisation_id')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    throw new Error('Unauthorised: User not member of any organisation');
  }

  return data.organisation_id;
}

/**
 * Get current user's organisation with full details
 */
export async function getCurrentOrganisation(): Promise<{
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
}> {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorised: No user session');
  }

  // Get user's organisation with details
  const { data, error } = await supabase
    .from('organisation_members')
    .select(`
      organisation_id,
      role,
      organisations (
        id,
        name,
        slug,
        plan
      )
    `)
    .eq('user_id', user.id)
    .single();

  if (error || !data || !data.organisations) {
    throw new Error('Unauthorised: User not member of any organisation');
  }

  return data.organisations as any;
}

/**
 * Get current user's role in their organisation
 */
export async function getCurrentUserRole(): Promise<'owner' | 'admin' | 'member' | 'viewer'> {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorised: No user session');
  }

  const { data, error } = await supabase
    .from('organisation_members')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    throw new Error('Unauthorised: User not member of any organisation');
  }

  return data.role as 'owner' | 'admin' | 'member' | 'viewer';
}

/**
 * Wrapper function that ensures all queries are scoped to the current tenant
 *
 * Usage:
 * ```typescript
 * const companies = await withTenantScope(async (organisationId) => {
 *   const db = getDatabase();
 *   return db.all('SELECT * FROM companies WHERE organisation_id = ?', [organisationId]);
 * });
 * ```
 */
export async function withTenantScope<T>(
  query: (organisationId: string) => Promise<T>
): Promise<T> {
  const organisationId = await getCurrentOrganisationId();
  return query(organisationId);
}

/**
 * Check if current user has required role
 */
export async function requireRole(requiredRole: 'owner' | 'admin' | 'member'): Promise<void> {
  const role = await getCurrentUserRole();

  const roleHierarchy = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
  };

  if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
    throw new Error(`Forbidden: Requires ${requiredRole} role or higher`);
  }
}

/**
 * Get all organisations the current user belongs to
 * Useful for organisation switcher UI
 */
export async function getUserOrganisations(): Promise<Array<{
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
}>> {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('organisation_members')
    .select(`
      role,
      organisations (
        id,
        name,
        slug,
        plan
      )
    `)
    .eq('user_id', user.id);

  if (error || !data) {
    return [];
  }

  return data.map(item => ({
    id: (item.organisations as any).id,
    name: (item.organisations as any).name,
    slug: (item.organisations as any).slug,
    plan: (item.organisations as any).plan,
    role: item.role
  }));
}
