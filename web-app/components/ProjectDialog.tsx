'use client';

import { useState } from 'react';
import { X, Loader2, FolderKanban } from 'lucide-react';

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectDialog({ isOpen, onClose, onSuccess }: ProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'planning' | 'active' | 'completed' | 'on-hold'>('planning');
  const [progress, setProgress] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [team, setTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !description) {
      setError('Please enter project name and description');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert comma-separated team names to array
      const teamArray = team
        .split(',')
        .map(member => member.trim())
        .filter(member => member.length > 0);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
          progress,
          due_date: dueDate || undefined,
          team: teamArray,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create project');
      }

      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setStatus('planning');
    setProgress(0);
    setDueDate('');
    setTeam('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FolderKanban className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create Project</h2>
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Website Redesign"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'planning' | 'active' | 'completed' | 'on-hold')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>

          <div>
            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
              Progress: {progress}%
            </label>
            <input
              id="progress"
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date (Optional)
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
              Team Members (Optional)
            </label>
            <input
              id="team"
              type="text"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g., John Doe, Jane Smith, Bob Johnson"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter names separated by commas
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
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
