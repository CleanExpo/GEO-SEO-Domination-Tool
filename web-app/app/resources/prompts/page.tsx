'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Copy, Star, Search } from 'lucide-react';

interface Prompt {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  favorite: boolean;
  usageCount: number;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: '1',
      title: 'SEO Meta Description Generator',
      content: 'Generate an engaging meta description for a webpage about [TOPIC]. Make it compelling, under 160 characters, and include the primary keyword [KEYWORD].',
      category: 'SEO',
      tags: ['meta-description', 'on-page-seo'],
      favorite: true,
      usageCount: 45,
    },
    {
      id: '2',
      title: 'Blog Post Outline Creator',
      content: 'Create a detailed blog post outline for the topic: [TOPIC]. Include 5-7 main sections with subheadings, targeting the keyword [KEYWORD]. Make it SEO-optimized.',
      category: 'Content',
      tags: ['blog', 'outline', 'content-creation'],
      favorite: false,
      usageCount: 32,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const toggleFavorite = (id: string) => {
    setPrompts(prompts.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prompts Library</h1>
            <p className="text-gray-600 mt-1">Your collection of AI prompts and templates</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="h-5 w-5" />
            Add Prompt
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPrompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-xl font-semibold text-gray-900">{prompt.title}</h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    {prompt.category}
                  </span>
                </div>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg font-mono text-sm">
                  {prompt.content}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {prompt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Used {prompt.usageCount} times
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(prompt.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    prompt.favorite
                      ? 'text-yellow-500 bg-yellow-50'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Star className="h-5 w-5" fill={prompt.favorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => copyToClipboard(prompt.content)}
                  className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span className="text-sm font-medium">Copy</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
