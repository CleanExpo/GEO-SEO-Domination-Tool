'use client';

import { useState, useEffect } from 'react';
import { Zap, Building2, DollarSign, Calendar, ArrowRight } from 'lucide-react';

interface Tier {
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  quotas: {
    seoAudits: number;
    blogPosts: number;
    socialPosts: number;
    researchPapers: number;
    gmbPosts: number;
  };
}

interface Company {
  id: number;
  name: string;
}

export default function ClientsPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tiers
      const tiersResponse = await fetch('/api/clients/subscribe');
      const tiersData = await tiersResponse.json();
      if (tiersData.success) {
        setTiers(tiersData.tiers);
      }

      // Fetch companies
      const companiesResponse = await fetch('/api/companies');
      const companiesData = await companiesResponse.json();
      if (companiesData.success) {
        setCompanies(companiesData.companies);
        if (companiesData.companies.length > 0) {
          setSelectedCompany(companiesData.companies[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedCompany || !selectedTier) {
      alert('Please select a company and tier');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/clients/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany,
          tierName: selectedTier,
          contentTopics: ['SEO', 'Content Marketing', 'Local SEO'],
          targetKeywords: ['SEO services', 'local business marketing'],
          notificationEmail: 'client@example.com'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Subscription created! ${data.subscription.tasksScheduled} tasks scheduled.`);
        window.location.href = `/clients/${selectedCompany}/autopilot`;
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-16 h-16 text-emerald-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Client Autopilot Setup
          </h1>
          <p className="text-xl text-gray-400">
            Create a subscription and watch autonomous tasks execute in real-time
          </p>
        </div>

        {/* Setup Form */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-500" />
            Select Company
          </h2>

          {companies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No companies found. Create one first.</p>
              <button
                onClick={() => window.location.href = '/companies'}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition"
              >
                Go to Companies
              </button>
            </div>
          ) : (
            <select
              value={selectedCompany || ''}
              onChange={(e) => setSelectedCompany(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tier Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            Choose Subscription Tier
          </h2>

          <div className="grid grid-cols-4 gap-6">
            {tiers.map(tier => {
              const isSelected = selectedTier === tier.name;
              const totalTasks = Object.values(tier.quotas).reduce((a, b) => a + b, 0);

              return (
                <button
                  key={tier.name}
                  onClick={() => setSelectedTier(tier.name)}
                  className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105'
                      : 'border-slate-700 hover:border-emerald-500/50'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">{tier.displayName}</h3>
                    <div className="text-3xl font-bold text-emerald-400 mb-2">
                      ${tier.monthlyPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400 mb-4">per month</div>

                    <div className="border-t border-slate-700 pt-4 space-y-2 text-sm text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-400">SEO Audits</span>
                        <span className="font-semibold">{tier.quotas.seoAudits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Blog Posts</span>
                        <span className="font-semibold">{tier.quotas.blogPosts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Social Posts</span>
                        <span className="font-semibold">{tier.quotas.socialPosts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Research</span>
                        <span className="font-semibold">{tier.quotas.researchPapers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">GMB Posts</span>
                        <span className="font-semibold">{tier.quotas.gmbPosts}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-700 mt-4 pt-4">
                      <div className="text-lg font-bold text-emerald-400">{totalTasks} tasks/month</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-full p-2">
                      <Zap className="w-5 h-5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Button */}
        <div className="text-center">
          <button
            onClick={handleCreateSubscription}
            disabled={creating || !selectedCompany || !selectedTier}
            className={`px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-all ${
              creating || !selectedCompany || !selectedTier
                ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg shadow-emerald-500/50'
            }`}
          >
            {creating ? (
              <>
                <Zap className="w-6 h-6 animate-spin" />
                Creating Subscription...
              </>
            ) : (
              <>
                <Calendar className="w-6 h-6" />
                Create Subscription & View Dashboard
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>

          {selectedTier && (
            <p className="text-gray-400 mt-4">
              This will create a 30-day task schedule and redirect you to the autopilot dashboard
            </p>
          )}
        </div>

        {/* Existing Subscriptions */}
        {companies.length > 0 && (
          <div className="mt-12 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Or view existing subscription:</h3>
            <div className="space-y-2">
              {companies.map(company => (
                <a
                  key={company.id}
                  href={`/clients/${company.id}/autopilot`}
                  className="block px-4 py-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition flex items-center justify-between"
                >
                  <span className="font-medium">{company.name}</span>
                  <ArrowRight className="w-5 h-5 text-emerald-500" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
