'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  company_id: string;
  title: string;
  type: 'seo_audit' | 'keyword_research' | 'competitor_analysis' | 'ranking_report';
  data: Record<string, any>;
  generated_at: string;
  created_at: string;
}

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
      // This would call a report generation API endpoint
      // For now, we'll just show a placeholder
      alert(`Report generation for ${reportType} is not yet implemented. This would generate a comprehensive ${reportType.replace('_', ' ')} report.`);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'seo_audit':
        return 'SEO Audit Report';
      case 'keyword_research':
        return 'Keyword Research Report';
      case 'competitor_analysis':
        return 'Competitor Analysis Report';
      case 'ranking_report':
        return 'Ranking Tracking Report';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Reports
          </h1>
          <p className="text-gray-600 mt-2">Generate comprehensive SEO reports for your companies</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate New Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Company *
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type *
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="seo_audit">SEO Audit Report</option>
                <option value="keyword_research">Keyword Research Report</option>
                <option value="competitor_analysis">Competitor Analysis Report</option>
                <option value="ranking_report">Ranking Tracking Report</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={generating || !selectedCompany}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Report Types Available:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                <strong>SEO Audit Report:</strong> Comprehensive analysis of on-page SEO factors, technical
                issues, and recommendations
              </li>
              <li>
                <strong>Keyword Research Report:</strong> Detailed keyword analysis including search volume,
                difficulty, and opportunities
              </li>
              <li>
                <strong>Competitor Analysis Report:</strong> Compare your SEO performance against competitors
              </li>
              <li>
                <strong>Ranking Tracking Report:</strong> Historical ranking data and trends for tracked
                keywords
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Report History</h3>
          <p className="text-gray-600 mb-4">
            Report history and storage functionality will be available soon
          </p>
          <p className="text-sm text-gray-500">
            Generated reports will appear here and can be downloaded as PDF or shared with team members
          </p>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/companies"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-center"
            >
              <div className="text-blue-600 font-semibold mb-1">Companies</div>
              <div className="text-sm text-gray-600">Manage companies</div>
            </Link>
            <Link
              href="/dashboard"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition text-center"
            >
              <div className="text-green-600 font-semibold mb-1">Dashboard</div>
              <div className="text-sm text-gray-600">View overview</div>
            </Link>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
              <div className="text-purple-600 font-semibold mb-1">Competitors</div>
              <div className="text-sm text-gray-600">Coming soon</div>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
              <div className="text-orange-600 font-semibold mb-1">Backlinks</div>
              <div className="text-sm text-gray-600">Coming soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
