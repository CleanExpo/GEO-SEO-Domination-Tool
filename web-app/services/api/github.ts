/**
 * GitHub API Client Service
 *
 * Provides methods for interacting with GitHub REST API v3
 * Supports OAuth authentication, repository management, and data syncing
 */

interface GitHubConfig {
  token?: string;
  baseUrl?: string;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
  };
  description: string | null;
  html_url: string;
  private: boolean;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  language: string | null;
  license: { key: string; name: string } | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

interface Commit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
  } | null;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{ filename: string }>;
}

interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: {
    login: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  comments?: number;
}

interface Issue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: {
    login: string;
  };
  assignees: Array<{ login: string }>;
  labels: Array<{ name: string; color: string }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  comments: number;
}

export class GitHubAPIClient {
  private token: string;
  private baseUrl: string;

  constructor(config: GitHubConfig = {}) {
    this.token = config.token || process.env.GITHUB_TOKEN || '';
    this.baseUrl = config.baseUrl || 'https://api.github.com';
  }

  /**
   * Make a request to GitHub API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText} - ${
          error.message || 'Unknown error'
        }`
      );
    }

    return response.json();
  }

  /**
   * Get authenticated user information
   */
  async getAuthenticatedUser() {
    return this.request<{
      login: string;
      id: number;
      name: string;
      email: string;
      avatar_url: string;
    }>('/user');
  }

  /**
   * Get repository information
   */
  async getRepository(owner: string, repo: string): Promise<Repository> {
    return this.request<Repository>(`/repos/${owner}/${repo}`);
  }

  /**
   * List user repositories
   */
  async listUserRepositories(options: {
    visibility?: 'all' | 'public' | 'private';
    affiliation?: string;
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}): Promise<Repository[]> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<Repository[]>(`/user/repos?${params.toString()}`);
  }

  /**
   * Get commits for a repository
   */
  async getCommits(
    owner: string,
    repo: string,
    options: {
      sha?: string; // Branch or tag
      since?: string; // ISO 8601 timestamp
      until?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Commit[]> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<Commit[]>(
      `/repos/${owner}/${repo}/commits?${params.toString()}`
    );
  }

  /**
   * Get a single commit with stats
   */
  async getCommit(owner: string, repo: string, sha: string): Promise<Commit> {
    return this.request<Commit>(`/repos/${owner}/${repo}/commits/${sha}`);
  }

  /**
   * List pull requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      sort?: 'created' | 'updated' | 'popularity' | 'long-running';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<PullRequest[]> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<PullRequest[]>(
      `/repos/${owner}/${repo}/pulls?${params.toString()}`
    );
  }

  /**
   * Get a single pull request with details
   */
  async getPullRequest(
    owner: string,
    repo: string,
    pullNumber: number
  ): Promise<PullRequest> {
    return this.request<PullRequest>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}`
    );
  }

  /**
   * List issues
   */
  async getIssues(
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      labels?: string; // Comma-separated
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      since?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Issue[]> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<Issue[]>(
      `/repos/${owner}/${repo}/issues?${params.toString()}`
    );
  }

  /**
   * Create a webhook for repository
   */
  async createWebhook(
    owner: string,
    repo: string,
    config: {
      url: string;
      content_type?: 'json' | 'form';
      secret?: string;
      insecure_ssl?: '0' | '1';
    },
    events: string[] = ['push', 'pull_request', 'issues']
  ) {
    return this.request(`/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events,
        config: {
          content_type: 'json',
          ...config,
        },
      }),
    });
  }

  /**
   * List repository webhooks
   */
  async listWebhooks(owner: string, repo: string) {
    return this.request(`/repos/${owner}/${repo}/hooks`);
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(owner: string, repo: string, hookId: number) {
    return this.request(`/repos/${owner}/${repo}/hooks/${hookId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search repositories
   */
  async searchRepositories(query: string, options: {
    sort?: 'stars' | 'forks' | 'updated';
    order?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
  } = {}) {
    const params = new URLSearchParams({ q: query });
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<{ items: Repository[]; total_count: number }>(
      `/search/repositories?${params.toString()}`
    );
  }

  /**
   * Get repository contributors
   */
  async getContributors(
    owner: string,
    repo: string,
    options: { per_page?: number; page?: number } = {}
  ) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request<
      Array<{
        login: string;
        id: number;
        contributions: number;
      }>
    >(`/repos/${owner}/${repo}/contributors?${params.toString()}`);
  }

  /**
   * Get repository languages
   */
  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(`/repos/${owner}/${repo}/languages`);
  }

  /**
   * Get rate limit status
   */
  async getRateLimit() {
    return this.request<{
      resources: {
        core: { limit: number; remaining: number; reset: number };
        search: { limit: number; remaining: number; reset: number };
      };
    }>('/rate_limit');
  }
}

// Create singleton instance
let githubClient: GitHubAPIClient | null = null;

export function getGitHubClient(token?: string): GitHubAPIClient {
  if (!githubClient || token) {
    githubClient = new GitHubAPIClient({ token });
  }
  return githubClient;
}
