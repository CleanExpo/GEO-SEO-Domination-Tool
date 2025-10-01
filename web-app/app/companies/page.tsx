'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2, Globe, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  website: string;
  industry?: string;
  location?: string;
  created_at: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
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
      const response = await fetch('/api/companies');
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', website: '', industry: '', location: '' });
        setShowForm(false);
        fetchCompanies();
      }
    } catch (error) {
      console.error('Failed to create company:', error);
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Companies
            </h1>
            <p className="text-gray-600 mt-2">Manage your company profiles and SEO projects</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5" />
            Add Company
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Company</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website *
                </label>
                <input
                  type="url"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Create Company
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div key={company.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 truncate"
                  >
                    {company.website}
                  </a>
                </div>

                {company.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{company.industry}</span>
                  </div>
                )}

                {company.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{company.location}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                <Link
                  href={`/companies/${company.id}/seo-audit`}
                  className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition text-center"
                >
                  SEO Audit
                </Link>
                <Link
                  href={`/companies/${company.id}/keywords`}
                  className="flex-1 bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition text-center"
                >
                  Keywords
                </Link>
              </div>
            </div>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by adding your first company to track SEO performance
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5" />
              Add Your First Company
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
