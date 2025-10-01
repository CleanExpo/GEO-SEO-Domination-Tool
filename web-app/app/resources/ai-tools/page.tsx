'use client';

import { useState, useEffect } from 'react';
import { Wrench, Plus, Star, ExternalLink, Zap } from 'lucide-react';

interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  icon: string;
  features: string[];
  rating: number;
  isPremium: boolean;
}

export default function AIToolsPage() {
  const [tools, setTools] = useState<AITool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/resources/ai-tools');

      if (!response.ok) {
        throw new Error('Failed to fetch AI tools');
      }

      const data = await response.json();
      setTools(data.tools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching AI tools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTool = () => {
    console.log('Add tool clicked');
  };

  const categories = Array.from(new Set(tools.map(t => t.category)));

  const filteredTools = selectedCategory
    ? tools.filter(tool => tool.category === selectedCategory)
    : tools;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading AI tools</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchTools}
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
            <h1 className="text-3xl font-bold text-gray-900">AI Tools</h1>
            <p className="text-gray-600 mt-1">Curated collection of AI tools for SEO and marketing</p>
          </div>
          <button
            onClick={handleAddTool}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Tool
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Wrench className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tools</p>
              <p className="text-2xl font-bold text-gray-900">{tools.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Premium</p>
              <p className="text-2xl font-bold text-gray-900">
                {tools.filter(t => t.isPremium).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {tools.length > 0 ? (tools.reduce((sum, t) => sum + t.rating, 0) / tools.length).toFixed(1) : '0.0'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              !selectedCategory
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Tools
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Tools Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading AI tools...</p>
        </div>
      ) : filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{tool.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-900">{tool.name}</h3>
                      {tool.isPremium && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Premium
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">{tool.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(tool.rating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-gray-600 mb-4">{tool.description}</p>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {tool.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Visit Tool
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 max-w-md w-full text-center">
            <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No AI tools added</h3>
            <p className="text-gray-600 mb-6">
              Start curating your AI tools collection by adding your first tool.
            </p>
            <button
              onClick={handleAddTool}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              Add Your First Tool
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
