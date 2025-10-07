'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, CheckCircle, XCircle, FileDown } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Company {
  id: string;
  name: string;
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function ReportsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [reportType, setReportType] = useState<string>('seo_audit');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      showNotification('error', 'Failed to load companies');
    }
  };

  const generatePDF = (data: any[], reportType: string, companyName: string, headers: string[]) => {
    const doc = new jsPDF();

    // Add header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // Emerald color
    doc.text('GEO-SEO Domination Tool', 14, 20);

    // Add report title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const reportTitle = reportType.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') + ' Report';
    doc.text(reportTitle, 14, 30);

    // Add company name and date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Company: ${companyName}`, 14, 38);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 43);

    // Prepare table data based on report type
    let tableData: any[][] = [];

    switch (reportType) {
      case 'seo_audit':
        tableData = data.map(item => [
          item.url || 'N/A',
          item.score || 0,
          item.performance_score || 0,
          item.accessibility_score || 0,
          item.best_practices_score || 0,
          item.seo_score || 0,
          new Date(item.created_at).toLocaleDateString()
        ]);
        break;

      case 'keyword_research':
        tableData = data.map(item => [
          item.keyword || 'N/A',
          item.search_volume || 0,
          item.cpc ? `$${item.cpc.toFixed(2)}` : '$0.00',
          item.difficulty || 0,
          new Date(item.created_at).toLocaleDateString()
        ]);
        break;

      case 'ranking_report':
        tableData = data.map(item => [
          item.keywords?.keyword || 'N/A',
          item.position || 0,
          item.url || 'N/A',
          item.location || 'N/A',
          new Date(item.checked_at || item.created_at).toLocaleDateString()
        ]);
        break;
    }

    // Add table
    autoTable(doc, {
      startY: 50,
      head: [headers.filter((_, i) => i > 0)], // Skip ID column for PDF
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // Emerald color
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { top: 50 }
    });

    // Add footer with page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Generate filename
    const filename = `${reportType}-${companyName}-${new Date().toISOString().split('T')[0]}.pdf`;

    // Save PDF
    doc.save(filename);

    return filename;
  };

  const generateReport = async () => {
    if (!selectedCompany || !reportType) {
      showNotification('error', 'Please select a company and report type');
      return;
    }

    setGenerating(true);

    try {
      // Get company details
      const companyResponse = await fetch(`/api/companies/${selectedCompany}`);
      if (!companyResponse.ok) {
        throw new Error('Failed to fetch company details');
      }
      const companyData = await companyResponse.json();
      const company = companyData.company;

      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      // Fetch data based on report type
      switch (reportType) {
        case 'seo_audit':
          const auditResponse = await fetch(`/api/seo-audits?company_id=${selectedCompany}`);
          if (!auditResponse.ok) throw new Error('Failed to fetch SEO audits');
          const auditData = await auditResponse.json();
          data = auditData.audits || [];
          filename = `seo-audit-${company.name}-${new Date().toISOString().split('T')[0]}.csv`;
          headers = ['ID', 'URL', 'Score', 'Performance', 'Accessibility', 'Best Practices', 'SEO', 'Created At'];
          break;

        case 'keyword_research':
          const keywordResponse = await fetch(`/api/keywords?company_id=${selectedCompany}`);
          if (!keywordResponse.ok) throw new Error('Failed to fetch keywords');
          const keywordData = await keywordResponse.json();
          data = keywordData.keywords || [];
          filename = `keyword-research-${company.name}-${new Date().toISOString().split('T')[0]}.csv`;
          headers = ['ID', 'Keyword', 'Search Volume', 'CPC', 'Difficulty', 'Created At'];
          break;

        case 'ranking_report':
          const rankingResponse = await fetch(`/api/rankings?company_id=${selectedCompany}`);
          if (!rankingResponse.ok) throw new Error('Failed to fetch rankings');
          const rankingData = await rankingResponse.json();
          data = rankingData.rankings || [];
          filename = `ranking-report-${company.name}-${new Date().toISOString().split('T')[0]}.csv`;
          headers = ['ID', 'Keyword', 'Position', 'URL', 'Location', 'Search Engine', 'Date'];
          break;

        case 'competitor_analysis':
          // Placeholder for future competitor analysis
          showNotification('info', 'Competitor analysis report is coming soon. This will include competitor keyword overlap, backlink comparison, and ranking gaps.');
          setGenerating(false);
          return;

        default:
          throw new Error('Invalid report type');
      }

      if (data.length === 0) {
        showNotification('error', `No data found for ${reportType.replace('_', ' ')} report. Please add some data first.`);
        setGenerating(false);
        return;
      }

      let generatedFilename = '';

      // Generate report based on export format
      if (exportFormat === 'pdf') {
        generatedFilename = generatePDF(data, reportType, company.name, headers);
      } else {
        // Convert to CSV
        const csv = convertToCSV(data, reportType, headers);
        // Download CSV
        downloadCSV(csv, filename);
        generatedFilename = filename;
      }

      // Show success message
      showNotification('success', `Report generated successfully! ${data.length} records exported to ${generatedFilename}`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      showNotification('error', `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const convertToCSV = (data: any[], reportType: string, headers: string[]): string => {
    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape double quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Create CSV header row
    const headerRow = headers.join(',');

    // Create CSV data rows
    const rows = data.map((item) => {
      switch (reportType) {
        case 'seo_audit':
          return [
            escapeCSV(item.id),
            escapeCSV(item.url),
            escapeCSV(item.score || 0),
            escapeCSV(item.performance_score || 0),
            escapeCSV(item.accessibility_score || 0),
            escapeCSV(item.best_practices_score || 0),
            escapeCSV(item.seo_score || 0),
            escapeCSV(item.created_at),
          ].join(',');

        case 'keyword_research':
          return [
            escapeCSV(item.id),
            escapeCSV(item.keyword),
            escapeCSV(item.search_volume || 0),
            escapeCSV(item.cpc || 0),
            escapeCSV(item.difficulty || 0),
            escapeCSV(item.created_at),
          ].join(',');

        case 'ranking_report':
          return [
            escapeCSV(item.id),
            escapeCSV(item.keywords?.keyword || 'N/A'),
            escapeCSV(item.position || 0),
            escapeCSV(item.url),
            escapeCSV(item.location),
            escapeCSV(item.search_engine),
            escapeCSV(item.date),
          ].join(',');

        default:
          return '';
      }
    });

    return [headerRow, ...rows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
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
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-xl shadow-lg transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border border-emerald-200' :
          notification.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : notification.type === 'error' ? (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-emerald-800' :
                notification.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Generate comprehensive SEO reports for your companies</p>
      </div>

      {/* Generate Report Card */}
      <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate New Report</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format *
            </label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              <option value="csv">CSV (Excel)</option>
              <option value="pdf">PDF (Document)</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={generating || !selectedCompany}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FileDown className="h-5 w-5" />
          {generating ? 'Generating...' : `Generate ${exportFormat.toUpperCase()} Report`}
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
