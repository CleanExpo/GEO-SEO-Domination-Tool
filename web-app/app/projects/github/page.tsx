'use client';

import { useState, useEffect } from 'react';
import { Github, Plus, Star, GitFork, GitPullRequest, ExternalLink, RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { GitHubImportDialog } from '@/components/GitHubImportDialog';

interface GithubProject {
  id: string;
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  openPRs: number;
  open_prs?: number;
  language: string;
  lastUpdated: string;
  last_updated?: string;
  auto_sync?: boolean;
  sync_status?: 'pending' | 'syncing' | 'success' | 'failed';
  sync_error?: string;
  last_synced_at?: string;
  watchers?: number;
  open_issues?: number;
}

export default function GithubProjectsPage() {
  const [projects, setProjects] = useState<GithubProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [syncingProjects, setSyncingProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/projects/github');

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub projects');
      }

      const data = await response.json();
      setProjects(data.github_projects || data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching GitHub projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportRepo = () => {
    setIsDialogOpen(true);
  };

  const handleSyncRepo = async (projectId: string) => {
    setSyncingProjects((prev) => new Set(prev).add(projectId));

    try {
      const response = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          github_project_id: parseInt(projectId),
          sync_metadata: true,
          sync_commits: true,
          sync_pull_requests: true,
          sync_issues: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync repository');
      }

      // Refresh projects to show updated data
      await fetchProjects();
    } catch (err) {
      console.error('Error syncing repository:', err);
      alert('Failed to sync repository: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSyncingProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  };

  const getSyncStatusBadge = (project: GithubProject) => {
    const status = project.sync_status || 'pending';
    const isSyncing = syncingProjects.has(project.id) || status === 'syncing';

    if (isSyncing) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing...
        </span>
      );
    }

    switch (status) {
      case 'success':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Synced
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">Error loading GitHub projects</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchProjects}
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
            <h1 className="text-3xl font-bold text-gray-900">GitHub Projects</h1>
            <p className="text-gray-600 mt-1">Import and sync GitHub repositories</p>
          </div>
          <button
            onClick={handleImportRepo}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Import Repository
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Github className="h-6 w-6 text-gray-900" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Repositories</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Stars</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.reduce((sum, p) => sum + p.stars, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <GitFork className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Forks</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.reduce((sum, p) => sum + p.forks, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <GitPullRequest className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Open PRs</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.reduce((sum, p) => sum + p.openPRs, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List or Empty State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600">Loading repositories...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Github className="h-5 w-5 text-gray-700" />
                    <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                    {project.language && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {project.language}
                      </span>
                    )}
                    {getSyncStatusBadge(project)}
                  </div>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>{project.stars}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      <span>{project.forks}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitPullRequest className="h-4 w-4" />
                      <span>{project.open_prs ?? project.openPRs} open</span>
                    </div>
                    <span>Updated {new Date(project.last_updated || project.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  {project.last_synced_at && (
                    <p className="text-xs text-gray-500">
                      Last synced: {new Date(project.last_synced_at).toLocaleString()}
                    </p>
                  )}
                  {project.sync_error && (
                    <p className="text-xs text-red-600 mt-1">
                      Sync error: {project.sync_error}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSyncRepo(project.id)}
                    disabled={syncingProjects.has(project.id)}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Sync repository data"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncingProjects.has(project.id) ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-medium">Sync</span>
                  </button>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <span className="text-sm font-medium">View on GitHub</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200/50 p-12 text-center max-w-md">
            <div className="flex justify-center mb-4">
              <Github className="h-16 w-16 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No repositories imported</h3>
            <p className="text-gray-600 mb-6">
              Connect your GitHub account to import and sync repositories with your projects.
            </p>
            <button
              onClick={handleImportRepo}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              Import Repository
            </button>
          </div>
        </div>
      )}

      <GitHubImportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => fetchProjects()}
      />
    </div>
  );
}
