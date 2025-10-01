/**
 * GitHub MCP Service
 *
 * Wrapper for GitHub Model Context Protocol (MCP) server
 * Connects AI agents to GitHub platform for repository management and automation
 *
 * Remote MCP Endpoint: https://api.githubcopilot.com/mcp/
 * Local Docker: ghcr.io/github/github-mcp-server
 * Authentication: OAuth or GitHub Personal Access Token (PAT)
 *
 * Available Toolsets:
 * - Repository Management
 * - Issues & Pull Requests
 * - GitHub Actions & CI/CD
 * - Code Security
 * - Discussions, Gists, Notifications
 * - Organizations, Projects, Users
 */

export interface GitHubMCPConfig {
  pat?: string // Personal Access Token
  remoteEndpoint?: string
  toolsets?: GitHubToolset[]
  readOnly?: boolean
  ghHost?: string // For GitHub Enterprise Server
}

export type GitHubToolset =
  | 'context'
  | 'actions'
  | 'code_security'
  | 'dependabot'
  | 'discussions'
  | 'experiments'
  | 'gists'
  | 'issues'
  | 'notifications'
  | 'orgs'
  | 'projects'
  | 'pull_requests'
  | 'repos'
  | 'secret_protection'
  | 'security_advisories'
  | 'users'
  | 'all'

export interface GitHubMCPResponse {
  success: boolean
  data?: any
  error?: string
}

export class GitHubMCPService {
  private config: GitHubMCPConfig
  private remoteEndpoint: string

  constructor(config: GitHubMCPConfig) {
    this.config = config
    this.remoteEndpoint = config.remoteEndpoint || 'https://api.githubcopilot.com/mcp/'
  }

  /**
   * Repository Management Prompts
   *
   * Example AI prompts:
   * - "List all repositories in my organization"
   * - "Search for files containing 'config' in owner/repo"
   * - "Show me the latest commits on main branch"
   * - "Create a new branch called 'feature/new-feature'"
   */
  async queryRepositories(prompt: string): Promise<GitHubMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.remoteEndpoint,
          note: 'Execute this in your AI agent to get real data',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Issues & Pull Requests Prompts
   *
   * Example AI prompts:
   * - "Create an issue titled 'Bug: Login fails' in owner/repo"
   * - "List all open pull requests in my repository"
   * - "Add a comment to issue #123"
   * - "Merge pull request #456 with squash"
   */
  async queryIssuesAndPRs(prompt: string): Promise<GitHubMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.remoteEndpoint,
          note: 'AI agent will create/update issues and PRs',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * GitHub Actions & CI/CD Prompts
   *
   * Example AI prompts:
   * - "List all GitHub Actions workflows in owner/repo"
   * - "Show me failed workflow runs from the last week"
   * - "Trigger the 'Deploy' workflow"
   * - "Get logs for workflow run #789"
   */
  async queryActions(prompt: string): Promise<GitHubMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.remoteEndpoint,
          note: 'Monitor CI/CD pipelines and workflows',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Code Security Prompts
   *
   * Example AI prompts:
   * - "Show me all code scanning alerts"
   * - "Get Dependabot security updates"
   * - "List secret scanning alerts for owner/repo"
   * - "Show me security vulnerabilities"
   */
  async queryCodeSecurity(prompt: string): Promise<GitHubMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.remoteEndpoint,
          note: 'Access security findings and alerts',
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get available MCP tools
   */
  getAvailableTools(): {
    toolset: GitHubToolset
    tools: string[]
  }[] {
    return [
      {
        toolset: 'repos',
        tools: [
          'ListRepositories',
          'GetRepository',
          'CreateRepository',
          'SearchCode',
          'GetFileContents',
          'PushFiles',
          'CreateOrUpdateFile',
          'CreateBranch',
          'ListCommits',
          'GetCommit',
          'CompareCommits',
        ],
      },
      {
        toolset: 'issues',
        tools: [
          'ListIssues',
          'GetIssue',
          'CreateIssue',
          'UpdateIssue',
          'AddIssueComment',
          'SearchIssues',
          'AddLabels',
          'RemoveLabel',
        ],
      },
      {
        toolset: 'pull_requests',
        tools: [
          'ListPullRequests',
          'GetPullRequest',
          'CreatePullRequest',
          'UpdatePullRequest',
          'MergePullRequest',
          'CreateReviewComment',
          'ListPullRequestFiles',
        ],
      },
      {
        toolset: 'actions',
        tools: [
          'ListWorkflows',
          'GetWorkflow',
          'TriggerWorkflow',
          'ListWorkflowRuns',
          'GetWorkflowRun',
          'GetWorkflowRunLogs',
        ],
      },
      {
        toolset: 'code_security',
        tools: [
          'ListCodeScanningAlerts',
          'GetCodeScanningAlert',
          'UpdateCodeScanningAlert',
          'ListSecretScanningAlerts',
        ],
      },
      {
        toolset: 'projects',
        tools: [
          'ListProjects',
          'GetProject',
          'AddProjectItem',
          'UpdateProjectItem',
          'DeleteProjectItem',
        ],
      },
      {
        toolset: 'discussions',
        tools: [
          'ListDiscussions',
          'GetDiscussion',
          'CreateDiscussion',
          'AddDiscussionComment',
        ],
      },
      {
        toolset: 'gists',
        tools: [
          'ListGists',
          'GetGist',
          'CreateGist',
          'UpdateGist',
          'DeleteGist',
        ],
      },
      {
        toolset: 'notifications',
        tools: [
          'ListNotifications',
          'MarkNotificationAsRead',
        ],
      },
      {
        toolset: 'users',
        tools: [
          'GetUser',
          'GetAuthenticatedUser',
          'ListStarredRepositories',
        ],
      },
    ]
  }

  /**
   * Get example AI prompts for common use cases
   */
  getExamplePrompts(): {
    category: string
    examples: string[]
  }[] {
    return [
      {
        category: 'Repository Management',
        examples: [
          'List all repositories in my organization',
          'Search for files containing "API" in owner/repo',
          'Create a new repository called "my-new-project"',
          'Get the contents of README.md from owner/repo',
          'Create a branch called "feature/new-feature" from main',
        ],
      },
      {
        category: 'Issue Management',
        examples: [
          'Create an issue titled "Bug: Login fails" with description "Users cannot log in"',
          'List all open issues in owner/repo',
          'Add comment "Working on this" to issue #123',
          'Close issue #456 with comment "Fixed in PR #457"',
          'Search for issues labeled "bug" that mention "login"',
        ],
      },
      {
        category: 'Pull Request Automation',
        examples: [
          'Create a PR from feature-branch to main with title "Add new feature"',
          'List all open pull requests in owner/repo',
          'Merge pull request #789 using squash merge',
          'Add review comment to PR #101',
          'Get list of files changed in PR #202',
        ],
      },
      {
        category: 'CI/CD & Workflows',
        examples: [
          'Show me all failed workflow runs from the last 7 days',
          'Trigger the "Deploy to Production" workflow',
          'Get logs for the latest workflow run',
          'List all workflows in owner/repo',
          'Show me the status of workflow run #12345',
        ],
      },
      {
        category: 'Code Security',
        examples: [
          'List all code scanning alerts in owner/repo',
          'Show me Dependabot security updates',
          'Get details of secret scanning alert #5',
          'List all open security vulnerabilities',
          'Show me critical security alerts',
        ],
      },
      {
        category: 'Team Collaboration',
        examples: [
          'List all discussions in owner/repo',
          'Create a discussion in "Ideas" category',
          'Get my GitHub notifications',
          'List repositories I've starred',
          'Show me user profile for username',
        ],
      },
    ]
  }

  /**
   * Get toolset configuration for specific use case
   */
  getToolsetForUseCase(useCase: 'read_only' | 'ci_cd' | 'security' | 'full'): GitHubToolset[] {
    switch (useCase) {
      case 'read_only':
        return ['context', 'repos', 'issues', 'pull_requests', 'discussions', 'users']
      case 'ci_cd':
        return ['context', 'actions', 'repos', 'pull_requests']
      case 'security':
        return ['context', 'code_security', 'dependabot', 'secret_protection', 'security_advisories']
      case 'full':
        return ['all']
    }
  }
}

/**
 * Helper function to create GitHub MCP service instance
 */
export const createGitHubMCPService = (pat?: string): GitHubMCPService => {
  return new GitHubMCPService({ pat })
}

/**
 * MCP Setup Instructions
 *
 * Remote GitHub MCP (Easiest - OAuth):
 *
 * 1. Claude Code:
 *    claude mcp add --transport http github https://api.githubcopilot.com/mcp/
 *
 * 2. VS Code (version 1.101+):
 *    Add to .vscode/mcp.json:
 *    {
 *      "servers": {
 *        "github": {
 *          "type": "http",
 *          "url": "https://api.githubcopilot.com/mcp/"
 *        }
 *      }
 *    }
 *
 * Local GitHub MCP (Docker - More Control):
 *
 * 1. Requires Docker installed and running
 *
 * 2. Create GitHub Personal Access Token at:
 *    https://github.com/settings/tokens
 *
 * 3. VS Code:
 *    {
 *      "inputs": [{
 *        "type": "promptString",
 *        "id": "github_token",
 *        "description": "GitHub Personal Access Token",
 *        "password": true
 *      }],
 *      "servers": {
 *        "github": {
 *          "command": "docker",
 *          "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
 *                   "ghcr.io/github/github-mcp-server"],
 *          "env": {
 *            "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
 *          }
 *        }
 *      }
 *    }
 *
 * Toolsets Configuration:
 *
 * Enable specific toolsets via Docker:
 *    docker run -i --rm \
 *      -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
 *      -e GITHUB_TOOLSETS="repos,issues,pull_requests,actions" \
 *      ghcr.io/github/github-mcp-server
 *
 * Read-only mode:
 *    -e GITHUB_READ_ONLY=1
 *
 * GitHub Enterprise Server:
 *    -e GITHUB_HOST="https://github.enterprise.com"
 */
