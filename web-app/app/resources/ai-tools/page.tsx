'use client';

import { useState } from 'react';
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
  const [tools, setTools] = useState<AITool[]>([
    {
      id: '1',
      name: 'ChatGPT',
      description: 'Advanced AI for content creation, brainstorming, and SEO content optimization',
      category: 'Content',
      url: 'https://chat.openai.com',
      icon: '🤖',
      features: ['Content generation', 'SEO optimization', 'Meta descriptions', 'Keyword research'],
      rating: 5,
      isPremium: true,
    },
    {
      id: '2',
      name: 'Perplexity AI',
      description: 'AI-powered search engine for research and competitive analysis',
      category: 'Research',
      url: 'https://perplexity.ai',
      icon: '🔍',
      features: ['Research', 'Competitor analysis', 'Real-time data', 'Citations'],
      rating: 4.5,
      isPremium: false,
    },
    {
      id: '3',
      name: 'Claude',
      description: 'AI assistant for complex SEO analysis and strategy development',
      category: 'Analysis',
      url: 'https://claude.ai',
      icon: '🧠',
      features: ['SEO strategy', 'Technical analysis', 'Long-form content', 'Data analysis'],
      rating: 5,
      isPremium: true,
    },
    {
      id: '4',
      name: 'Midjourney',
      description: 'AI image generation for creating custom visuals and graphics',
      category: 'Design',
      url: 'https://midjourney.com',
      icon: '🎨',
      features: ['Image generation', 'Visual content', 'Branding', 'Illustrations'],
      rating: 4.5,
      isPremium: true,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(tools.map(t => t.category)));

  const filteredTools = selectedCategory
    ? tools.filter(tool => tool.category === selectedCategory)
    : tools;

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Tools</h1>
            <p className="text-gray-600 mt-1">Curated collection of AI tools for SEO and marketing</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
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
                {(tools.reduce((sum, t) => sum + t.rating, 0) / tools.length).toFixed(1)}
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

      {/* Tools Grid */}
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
    </div>
  );
}
