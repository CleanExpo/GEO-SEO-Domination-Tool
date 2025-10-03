'use client';

import { useState } from 'react';
import { X, Loader2, MessageSquare } from 'lucide-react';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromptDialog({ isOpen, onClose, onSuccess }: PromptDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !category.trim()) {
      setError('Title, content, and category are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Parse tags from comma-separated string to array
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const res = await fetch('/api/resources/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: category.trim(),
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          favorite: false,
          usageCount: 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add prompt');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setCategory('');
    setTags('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Add Prompt</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., SEO Blog Post Template"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Content *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your AI prompt template here..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Write your prompt template. You can include placeholders like [TOPIC] or [KEYWORD]
            </p>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., SEO, Content Writing, Analysis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., blog, seo, content, marketing (comma-separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate tags with commas
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Prompt'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
