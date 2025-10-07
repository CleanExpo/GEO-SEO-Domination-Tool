import { Octokit } from '@octokit/rest'

export interface GitHubConfig {
  accessToken: string
  owner?: string
  repo?: string
}

export interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  url: string
  stars: number
  forks: number
  openIssues: number
  language: string | null
  defaultBranch: string
  createdAt: Date
  updatedAt: Date
}

export interface PullRequest {
  number: number
  title: string
  state: 'open' | 'closed'
  author: string
  createdAt: Date
  updatedAt: Date
  url: string
  additions: number
  deletions: number
  changedFiles: number
}

export interface Issue {
  number: number
  title: string
  state: 'open' | 'closed'
  author: string
  labels: string[]
  createdAt: Date
  updatedAt: Date
  url: string
  comments: number
}

export interface Commit {
  sha: string
  message: string
  author: string
  date: Date
  url: string
  additions: number
  deletions: number
  changedFiles: number
}

export class GitHubConnector {
  private octokit: Octokit
  private config: GitHubConfig

  constructor(config: GitHubConfig) {
    this.config = config
    this.octokit = new Octokit({
      auth: config.accessToken,
    })
  }

  // Repository Operations
  async listRepositories(options?: {
    visibility?: 'all' | 'public' | 'private'
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    limit?: number
  }): Promise<Repository[]> {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        visibility: options?.visibility || 'all',
        sort: options?.sort || 'updated',
        per_page: options?.limit || 30,
      })

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        openIssues: repo.open_issues_count || 0,
        language: repo.language,
        defaultBranch: repo.default_branch,
        createdAt: new Date(repo.created_at),
        updatedAt: new Date(repo.updated_at),
      }))
    } catch (error) {
      console.error('Error listing repositories:', error)
      throw error
    }
  }

  async getRepository(owner: string, repo: string): Promise<Repository> {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo })

      return {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        private: data.private,
        url: data.html_url,
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        openIssues: data.open_issues_count || 0,
        language: data.language,
        defaultBranch: data.default_branch,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      }
    } catch (error) {
      console.error('Error getting repository:', error)
      throw error
    }
  }

  // Pull Requests
  async listPullRequests(owner: string, repo: string, options?: {
    state?: 'open' | 'closed' | 'all'
    limit?: number
  }): Promise<PullRequest[]> {
    try {
      const { data } = await this.octokit.pulls.list({
        owner,
        repo,
        state: options?.state || 'open',
        per_page: options?.limit || 30,
      })

      return data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state as 'open' | 'closed',
        author: pr.user?.login || 'unknown',
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
        url: pr.html_url,
        additions: 0, // Would need separate API call
        deletions: 0,
        changedFiles: 0,
      }))
    } catch (error) {
      console.error('Error listing pull requests:', error)
      throw error
    }
  }

  async createPullRequest(owner: string, repo: string, options: {
    title: string
    head: string
    base: string
    body?: string
    draft?: boolean
  }): Promise<PullRequest> {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title: options.title,
        head: options.head,
        base: options.base,
        body: options.body,
        draft: options.draft,
      })

      return {
        number: data.number,
        title: data.title,
        state: data.state as 'open' | 'closed',
        author: data.user?.login || 'unknown',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        url: data.html_url,
        additions: 0,
        deletions: 0,
        changedFiles: 0,
      }
    } catch (error) {
      console.error('Error creating pull request:', error)
      throw error
    }
  }

  // Issues
  async listIssues(owner: string, repo: string, options?: {
    state?: 'open' | 'closed' | 'all'
    labels?: string[]
    limit?: number
  }): Promise<Issue[]> {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: options?.state || 'open',
        labels: options?.labels?.join(','),
        per_page: options?.limit || 30,
      })

      return data
        .filter(issue => !issue.pull_request) // Exclude PRs
        .map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state as 'open' | 'closed',
          author: issue.user?.login || 'unknown',
          labels: issue.labels.map(label => typeof label === 'string' ? label : label.name || ''),
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
          url: issue.html_url,
          comments: issue.comments || 0,
        }))
    } catch (error) {
      console.error('Error listing issues:', error)
      throw error
    }
  }

  async createIssue(owner: string, repo: string, options: {
    title: string
    body?: string
    labels?: string[]
    assignees?: string[]
  }): Promise<Issue> {
    try {
      const { data } = await this.octokit.issues.create({
        owner,
        repo,
        title: options.title,
        body: options.body,
        labels: options.labels,
        assignees: options.assignees,
      })

      return {
        number: data.number,
        title: data.title,
        state: data.state as 'open' | 'closed',
        author: data.user?.login || 'unknown',
        labels: data.labels.map(label => typeof label === 'string' ? label : label.name || ''),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        url: data.html_url,
        comments: data.comments || 0,
      }
    } catch (error) {
      console.error('Error creating issue:', error)
      throw error
    }
  }

  // Commits
  async listCommits(owner: string, repo: string, options?: {
    sha?: string
    path?: string
    limit?: number
  }): Promise<Commit[]> {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner,
        repo,
        sha: options?.sha,
        path: options?.path,
        per_page: options?.limit || 30,
      })

      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name || 'unknown',
        date: new Date(commit.commit.author?.date || Date.now()),
        url: commit.html_url,
        additions: 0, // Would need separate API call
        deletions: 0,
        changedFiles: 0,
      }))
    } catch (error) {
      console.error('Error listing commits:', error)
      throw error
    }
  }

  // Branches
  async listBranches(owner: string, repo: string): Promise<Array<{ name: string; protected: boolean }>> {
    try {
      const { data } = await this.octokit.repos.listBranches({ owner, repo })
      return data.map(branch => ({
        name: branch.name,
        protected: branch.protected,
      }))
    } catch (error) {
      console.error('Error listing branches:', error)
      throw error
    }
  }

  // Workflows (GitHub Actions)
  async listWorkflows(owner: string, repo: string): Promise<any[]> {
    try {
      const { data } = await this.octokit.actions.listRepoWorkflows({ owner, repo })
      return data.workflows
    } catch (error) {
      console.error('Error listing workflows:', error)
      throw error
    }
  }

  async listWorkflowRuns(owner: string, repo: string, workflowId: number): Promise<any[]> {
    try {
      const { data } = await this.octokit.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
      })
      return data.workflow_runs
    } catch (error) {
      console.error('Error listing workflow runs:', error)
      throw error
    }
  }

  // User Info
  async getCurrentUser(): Promise<{
    login: string
    name: string | null
    email: string | null
    bio: string | null
    avatarUrl: string
    publicRepos: number
    followers: number
    following: number
  }> {
    try {
      const { data } = await this.octokit.users.getAuthenticated()
      return {
        login: data.login,
        name: data.name,
        email: data.email,
        bio: data.bio,
        avatarUrl: data.avatar_url,
        publicRepos: data.public_repos,
        followers: data.followers,
        following: data.following,
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      throw error
    }
  }

  // Test Connection
  async testConnection(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated()
      return true
    } catch (error) {
      return false
    }
  }
}

// Helper function to create a connector instance
export const createGitHubConnector = (config: GitHubConfig): GitHubConnector => {
  return new GitHubConnector(config)
}
