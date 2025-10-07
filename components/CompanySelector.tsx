'use client';

import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  website: string;
  industry?: string;
}

export function CompanySelector() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load companies and active company on mount
  useEffect(() => {
    loadCompanies();
    loadActiveCompany();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await fetch('/api/companies');
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveCompany = async () => {
    try {
      const res = await fetch('/api/company/switch');
      const data = await res.json();
      if (data.activeCompanyId) {
        setActiveCompanyId(data.activeCompanyId);
      } else if (companies.length > 0) {
        // Auto-select first company if none is active
        await switchCompany(companies[0].id);
      }
    } catch (error) {
      console.error('Failed to load active company:', error);
    }
  };

  const switchCompany = async (companyId: string) => {
    try {
      const res = await fetch('/api/company/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (res.ok) {
        setActiveCompanyId(companyId);
        setIsOpen(false);
        // Reload the page to refresh all company-scoped data
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to switch company');
      }
    } catch (error) {
      console.error('Failed to switch company:', error);
      alert('Failed to switch company');
    }
  };

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Building2 className="w-4 h-4 animate-pulse" />
        <span>Loading companies...</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Building2 className="w-4 h-4" />
        <span>No companies yet</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span className="truncate max-w-[200px]">
            {activeCompany?.name || 'Select Company'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => switchCompany(company.id)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-emerald-50 first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{company.name}</div>
                {company.industry && (
                  <div className="text-xs text-gray-500">{company.industry}</div>
                )}
              </div>
              {company.id === activeCompanyId && (
                <Check className="w-4 h-4 text-emerald-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
