/**
 * Organisation Switcher Component
 * Allows users to switch between organisations they belong to
 *
 * Ticket: TENANT-001
 * Author: Orchestra-Coordinator (Agent-Tenancy)
 * Date: 2025-10-05
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';

interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
}

interface OrganisationSwitcherProps {
  currentOrgId?: string;
}

export function OrganisationSwitcher({ currentOrgId }: OrganisationSwitcherProps) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadOrganisations() {
      try {
        const response = await fetch('/api/organisations/list');
        const data = await response.json();

        if (data.organisations) {
          setOrganisations(data.organisations);

          // Set current organisation
          const current = data.organisations.find((org: Organisation) => org.id === currentOrgId);
          if (current) {
            setCurrentOrg(current);
          } else if (data.organisations.length > 0) {
            setCurrentOrg(data.organisations[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load organisations:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOrganisations();
  }, [currentOrgId]);

  const handleSwitchOrganisation = async (orgId: string) => {
    try {
      // Switch organisation via API
      await fetch('/api/organisations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organisationId: orgId })
      });

      // Reload page to refresh with new tenant context
      router.refresh();
    } catch (error) {
      console.error('Failed to switch organisation:', error);
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className="w-[240px]">
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!currentOrg || organisations.length === 0) {
    return (
      <Button
        variant="outline"
        className="w-[240px]"
        onClick={() => router.push('/organisations/create')}
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Organisation
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-between">
          <div className="flex items-center">
            <Building2 className="mr-2 h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{currentOrg.name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {currentOrg.plan} Plan
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[240px]" align="start">
        <DropdownMenuLabel>Organisations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organisations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitchOrganisation(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{org.name}</span>
                <span className="text-xs text-muted-foreground">
                  {org.role} • {org.plan}
                </span>
              </div>
              {currentOrg.id === org.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/organisations/create')}
          className="cursor-pointer"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Organisation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
