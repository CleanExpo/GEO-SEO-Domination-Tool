'use client';

import { useState, useEffect } from 'react';
import { Wrench, Plus, Search, Copy, Code, Download } from 'lucide-react';

interface Component {
  id: string;
  name: string;
  description: string;
  category: string;
  framework: string;
  code: string;
  preview?: string;
}

export default function ComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/resources/components');

      if (!response.ok) {
        throw new Error('Failed to fetch components');
      }

      const data = await response.json();
      setComponents(data.components || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching components:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComponent = () => {
    console.log('Add component clicked');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const filteredComponents = components.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(components.map(c => c.category)));

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading components</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchComponents}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Components Library</h1>
            <p className="text-gray-600 mt-1">Reusable code components and snippets</p>
          </div>
          <button
            onClick={handleAddComponent}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Component
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Wrench className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Components</p>
              <p className="text-2xl font-bold text-gray-900">{components.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Code className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Downloads</p>
              <p className="text-2xl font-bold text-gray-900">124</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Components List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading components...</p>
        </div>
      ) : filteredComponents.length > 0 ? (
        <div className="space-y-6">
          {filteredComponents.map((component) => (
            <div
              key={component.id}
              className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Wrench className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-xl font-semibold text-gray-900">{component.name}</h3>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      {component.category}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {component.framework}
                    </span>
                  </div>
                  <p className="text-gray-600">{component.description}</p>
                </div>
              </div>

              {/* Code Block */}
              <div className="relative">
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{component.code}</code>
                  </pre>
                </div>
                <button
                  onClick={() => copyCode(component.code)}
                  className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 max-w-md w-full text-center">
            <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No components yet</h3>
            <p className="text-gray-600 mb-6">
              Build your reusable code library by adding your first component or snippet.
            </p>
            <button
              onClick={handleAddComponent}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              Add Your First Component
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
