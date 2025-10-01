'use client';

import { useState, useEffect } from 'react';
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
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/resources/prompts');

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching prompts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrompt = () => {
    console.log('Add prompt clicked');
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const toggleFavorite = async (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    // Optimistic update
    setPrompts(prompts.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p));

    try {
      const response = await fetch(`/api/resources/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: !prompt.favorite }),
      });

      if (!response.ok) {
        throw new Error('Failed to update prompt');
      }
    } catch (err) {
      // Revert on error
      setPrompts(prompts.map(p => p.id === id ? prompt : p));
      console.error('Error updating prompt:', err);
    }
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading prompts</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchPrompts}
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
            <h1 className="text-3xl font-bold text-gray-900">Prompts Library</h1>
            <p className="text-gray-600 mt-1">Your collection of AI prompts and templates</p>
          </div>
          <button
            onClick={handleAddPrompt}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
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
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading prompts...</p>
        </div>
      ) : filteredPrompts.length > 0 ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 max-w-md w-full text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No prompts saved</h3>
            <p className="text-gray-600 mb-6">
              Start building your prompts library by adding your first AI prompt template.
            </p>
            <button
              onClick={handleAddPrompt}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              Add Your First Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
