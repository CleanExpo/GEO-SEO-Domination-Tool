'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [reportType, setReportType] = useState<string>('seo_audit');
  const [generating, setGenerating] = useState(false);

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
    }
  };

  const generateReport = async () => {
    if (!selectedCompany || !reportType) {
      alert('Please select a company and report type');
      return;
    }

    setGenerating(true);

    try {
      alert(`Report generation for ${reportType} is not yet implemented. This would generate a comprehensive ${reportType.replace('_', ' ')} report.`);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const reportTypes = [
    {
      value: 'seo_audit',
      label: 'SEO Audit Report',
      description: 'Comprehensive analysis of on-page SEO factors, technical issues, and recommendations',
      color: 'emerald',
    },
    {
      value: 'keyword_research',
      label: 'Keyword Research Report',
      description: 'Detailed keyword analysis including search volume, difficulty, and opportunities',
      color: 'blue',
    },
    {
      value: 'competitor_analysis',
      label: 'Competitor Analysis Report',
      description: 'Compare your SEO performance against competitors',
      color: 'purple',
    },
    {
      value: 'ranking_report',
      label: 'Ranking Tracking Report',
      description: 'Historical ranking data and trends for tracked keywords',
      color: 'orange',
    },
  ];

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Generate comprehensive SEO reports for your companies</p>
      </div>

      {/* Generate Report Card */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Company *
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              <option value="">Choose a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type *
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={generating || !selectedCompany}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {generating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Report Types Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Report Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((type) => (
            <div
              key={type.value}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setReportType(type.value)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br from-${type.color}-500 to-${type.color}-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.label}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports Placeholder */}
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Report History</h3>
        <p className="text-gray-600 mb-4">
          Report history and storage functionality will be available soon
        </p>
        <p className="text-sm text-gray-500">
          Generated reports will appear here and can be downloaded as PDF or shared with team members
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/companies"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-emerald-600 font-semibold mb-1">Companies</div>
          <div className="text-sm text-gray-600">Manage companies</div>
        </Link>
        <Link
          href="/dashboard"
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-center"
        >
          <div className="text-blue-600 font-semibold mb-1">Dashboard</div>
          <div className="text-sm text-gray-600">View overview</div>
        </Link>
        <div className="bg-gray-50 rounded-xl shadow-sm p-6 text-center">
          <div className="text-purple-600 font-semibold mb-1">Competitors</div>
          <div className="text-sm text-gray-400">Coming soon</div>
        </div>
        <div className="bg-gray-50 rounded-xl shadow-sm p-6 text-center">
          <div className="text-orange-600 font-semibold mb-1">Backlinks</div>
          <div className="text-sm text-gray-400">Coming soon</div>
        </div>
      </div>
    </div>
  );
}
