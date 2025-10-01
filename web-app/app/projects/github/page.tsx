'use client';

import { useState } from 'react';
import { Github, Plus, Star, GitFork, GitPullRequest, ExternalLink } from 'lucide-react';

interface GithubProject {
  id: string;
  name: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  openPRs: number;
  language: string;
  lastUpdated: string;
}

export default function GithubProjectsPage() {
  const [projects, setProjects] = useState<GithubProject[]>([
    {
      id: '1',
      name: 'seo-automation-tool',
      description: 'Automated SEO analysis and reporting tool',
      url: 'https://github.com/example/seo-automation-tool',
      stars: 145,
      forks: 32,
      openPRs: 3,
      language: 'TypeScript',
      lastUpdated: '2025-10-01',
    },
    {
      id: '2',
      name: 'keyword-tracker',
      description: 'Real-time keyword ranking tracker',
      url: 'https://github.com/example/keyword-tracker',
      stars: 89,
      forks: 21,
      openPRs: 1,
      language: 'Python',
      lastUpdated: '2025-09-28',
    },
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GitHub Projects</h1>
            <p className="text-gray-600 mt-1">Import and sync GitHub repositories</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
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

      {/* Projects List */}
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
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {project.language}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
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
                    <span>{project.openPRs} open</span>
                  </div>
                  <span>Updated {new Date(project.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
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
        ))}
      </div>
    </div>
  );
}
