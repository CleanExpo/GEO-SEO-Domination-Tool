'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Globe, MapPin, Briefcase, X, Download } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TableSkeleton } from '@/components/LoadingState';
import { EmptyState } from '@/components/EmptyState';

interface Company {
  id: string;
  name: string;
  website: string;
  industry?: string;
  location?: string;
  created_at: string;
}

function CompaniesContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    location: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/companies');

      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (companies.length === 0) return;

    const headers = ['Name', 'Website', 'Industry', 'Location', 'Created At'];
    const csvData = companies.map(company => [
      company.name,
      company.website,
      company.industry || '',
      company.location || '',
      new Date(company.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        // Authentication required - redirect to onboarding instead
        alert('Please use the onboarding form to create your first company.\n\nRedirecting you now...');
        window.location.href = '/onboarding';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to create company: ${errorData.error || 'Please try again'}`);
        return;
      }

      // Success
      alert(`✅ Company "${formData.name}" created successfully!`);
      setFormData({ name: '', website: '', industry: '', location: '' });
      setShowForm(false);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('Network error - please check your connection and try again');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCompanies();
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl">
        <div className="mb-8">
          <div className="h-10 w-48 bg-gray-200 animate-pulse rounded mb-2"></div>
          <div className="h-6 w-96 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Companies</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCompanies}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Companies</h1>
          <p className="text-gray-600">Manage your company profiles and SEO projects</p>
        </div>
        <div className="flex gap-3">
          {companies.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Download className="h-5 w-5" />
              Export CSV
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Create campaign
          </button>
        </div>
      </div>

      {/* Add Company Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Company</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Acme Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="San Francisco, CA"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                >
                  Create Company
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Companies Grid or Empty State */}
      {companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(company.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-600 truncate"
                  >
                    {company.website}
                  </a>
                </div>

                {company.industry && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span>{company.industry}</span>
                  </div>
                )}

                {company.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{company.location}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/companies/${company.id}/seo-audit`}
                  className="flex-1 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors text-center"
                >
                  SEO Audit
                </Link>
                <Link
                  href={`/companies/${company.id}/keywords`}
                  className="flex-1 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors text-center"
                >
                  Keywords
                </Link>
              </div>

              <button
                onClick={() => handleDelete(company.id)}
                className="w-full mt-3 text-sm text-red-600 hover:text-red-700 py-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Get started by adding your first company to track SEO performance and rankings"
          actionLabel="Add Your First Company"
          onAction={() => setShowForm(true)}
        />
      )}
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <ErrorBoundary>
      <CompaniesContent />
    </ErrorBoundary>
  );
}
