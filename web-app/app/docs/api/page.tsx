/**
 * API Documentation Page
 * Comprehensive REST API documentation with examples
 *
 * Ticket: API-001
 * Author: Orchestra-Coordinator (Agent-Guide)
 * Date: 2025-10-05
 */

'use client';

import { useState } from 'react';
import { Code, Key, Lock, Server, FileText, Copy, Check } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  requestBody?: string;
  responseExample: string;
}

const endpoints: Record<string, Endpoint[]> = {
  'Companies': [
    {
      method: 'GET',
      path: '/api/companies',
      description: 'Get all companies',
      auth: true,
      responseExample: JSON.stringify({
        companies: [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            name: "Acme Corp",
            website: "https://acme.com",
            industry: "Technology",
            location: "San Francisco, CA"
          }
        ]
      }, null, 2)
    },
    {
      method: 'POST',
      path: '/api/companies',
      description: 'Create a new company',
      auth: true,
      requestBody: JSON.stringify({
        name: "Acme Corp",
        website: "https://acme.com",
        industry: "Technology",
        location: "San Francisco, CA"
      }, null, 2),
      responseExample: JSON.stringify({
        company: {
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Acme Corp",
          website: "https://acme.com"
        }
      }, null, 2)
    },
    {
      method: 'DELETE',
      path: '/api/companies/:id',
      description: 'Delete a company',
      auth: true,
      responseExample: JSON.stringify({
        success: true,
        message: "Company deleted successfully"
      }, null, 2)
    }
  ],
  'Keywords': [
    {
      method: 'GET',
      path: '/api/keywords',
      description: 'Get all keywords',
      auth: true,
      responseExample: JSON.stringify({
        keywords: [
          {
            id: "456e7890-e89b-12d3-a456-426614174001",
            keyword: "best seo tools",
            search_volume: 5400,
            difficulty: 65,
            cpc: 12.50,
            location: "United States"
          }
        ]
      }, null, 2)
    },
    {
      method: 'POST',
      path: '/api/keywords',
      description: 'Add new keywords',
      auth: true,
      requestBody: JSON.stringify({
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        keyword: "best seo tools",
        location: "United States"
      }, null, 2),
      responseExample: JSON.stringify({
        keyword: {
          id: "456e7890-e89b-12d3-a456-426614174001",
          keyword: "best seo tools"
        }
      }, null, 2)
    }
  ],
  'Rankings': [
    {
      method: 'GET',
      path: '/api/rankings',
      description: 'Get ranking history',
      auth: true,
      responseExample: JSON.stringify({
        rankings: [
          {
            id: "789e0123-e89b-12d3-a456-426614174002",
            keyword_id: "456e7890-e89b-12d3-a456-426614174001",
            position: 5,
            url: "https://example.com/page",
            checked_at: "2025-10-05T10:00:00Z"
          }
        ]
      }, null, 2)
    },
    {
      method: 'POST',
      path: '/api/rankings',
      description: 'Add ranking check',
      auth: true,
      requestBody: JSON.stringify({
        keyword_id: "456e7890-e89b-12d3-a456-426614174001",
        position: 5,
        url: "https://example.com/page"
      }, null, 2),
      responseExample: JSON.stringify({
        ranking: {
          id: "789e0123-e89b-12d3-a456-426614174002",
          position: 5
        }
      }, null, 2)
    }
  ],
  'SEO Audits': [
    {
      method: 'GET',
      path: '/api/audits',
      description: 'Get all SEO audits',
      auth: true,
      responseExample: JSON.stringify({
        audits: [
          {
            id: "012e3456-e89b-12d3-a456-426614174003",
            company_id: "123e4567-e89b-12d3-a456-426614174000",
            score: 85,
            issues: 12,
            created_at: "2025-10-05T10:00:00Z"
          }
        ]
      }, null, 2)
    },
    {
      method: 'POST',
      path: '/api/audits',
      description: 'Run SEO audit',
      auth: true,
      requestBody: JSON.stringify({
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        url: "https://example.com"
      }, null, 2),
      responseExample: JSON.stringify({
        audit: {
          id: "012e3456-e89b-12d3-a456-426614174003",
          score: 85,
          issues: 12
        }
      }, null, 2)
    }
  ]
};

export default function ApiDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Companies');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const copyToClipboard = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Code className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-gray-600 mt-1">RESTful API for GEO-SEO Domination Tool</p>
            </div>
          </div>

          {/* Authentication Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-900 mb-1">Authentication Required</h3>
                <p className="text-sm text-emerald-700">
                  All API requests require a valid API key. Include your API key in the request header:
                </p>
                <code className="block mt-2 bg-white px-3 py-2 rounded border border-emerald-200 text-sm">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-3">Endpoints</h3>
              <nav className="space-y-1">
                {Object.keys(endpoints).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Base URL</h3>
                <code className="block text-xs bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  https://api.geoseo.com/v1
                </code>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="flex-1 space-y-6">
            {endpoints[selectedCategory]?.map((endpoint, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                    {endpoint.auth && (
                      <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        Auth Required
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{endpoint.description}</p>

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">Request Body</h4>
                        <button
                          onClick={() => copyToClipboard(endpoint.requestBody!, `${endpoint.method}-${endpoint.path}-req`)}
                          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                          {copiedPath === `${endpoint.method}-${endpoint.path}-req` ? (
                            <>
                              <Check className="h-3 w-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{endpoint.requestBody}</code>
                      </pre>
                    </div>
                  )}

                  {/* Response Example */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">Response Example</h4>
                      <button
                        onClick={() => copyToClipboard(endpoint.responseExample, `${endpoint.method}-${endpoint.path}-res`)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        {copiedPath === `${endpoint.method}-${endpoint.path}-res` ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{endpoint.responseExample}</code>
                    </pre>
                  </div>

                  {/* cURL Example */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900">cURL Example</h4>
                      <button
                        onClick={() => copyToClipboard(
                          `curl -X ${endpoint.method} https://api.geoseo.com/v1${endpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\
  -d '${endpoint.requestBody.replace(/\n/g, '').replace(/\s+/g, ' ')}'` : ''}`,
                          `${endpoint.method}-${endpoint.path}-curl`
                        )}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        {copiedPath === `${endpoint.method}-${endpoint.path}-curl` ? (
                          <>
                            <Check className="h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`curl -X ${endpoint.method} https://api.geoseo.com/v1${endpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\
  -d '${endpoint.requestBody.replace(/\n/g, '').replace(/\s+/g, ' ')}'` : ''}`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
