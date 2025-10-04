# GitHub MCP Integration Guide

## What is GitHub MCP?

The GitHub Model Context Protocol (MCP) server provides AI agents with secure access to GitHub's platform through natural language prompts.

**MCP Endpoint:**
- Remote: `https://api.githubcopilot.com/mcp/`
- Local Docker: `ghcr.io/github/github-mcp-server`

**Authentication:** OAuth or GitHub Personal Access Token (PAT)

---

## ✅ Already Configured

This project has been set up with GitHub MCP support:

- ✅ **Claude Code** - Added locally via `claude mcp add`
- ✅ **VS Code** - Configuration in `.vscode/mcp.json`
- ✅ **Service Wrapper** - `src/services/github-mcp.ts`
- ✅ **Environment Variables** - GITHUB_PERSONAL_ACCESS_TOKEN

---

## Available Toolsets

### 1. Repository Management (`repos`)
Access and manage repositories, files, branches, and commits.

**Example Prompts:**
```
- "List all repositories in my organization"
- "Search for files containing 'API' in owner/repo"
- "Get the contents of README.md from owner/repo"
- "Create a branch called 'feature/new-feature' from main"
- "Show me the latest commits on main branch"
```

### 2. Issues (`issues`)
Create, update, and manage GitHub issues.

**Example Prompts:**
```
- "Create an issue titled 'Bug: Login fails' with description 'Users cannot log in'"
- "List all open issues in owner/repo"
- "Add comment 'Working on this' to issue #123"
- "Close issue #456 with comment 'Fixed in PR #457'"
- "Search for issues labeled 'bug' that mention 'login'"
```

### 3. Pull Requests (`pull_requests`)
Manage pull requests, reviews, and merges.

**Example Prompts:**
```
- "Create a PR from feature-branch to main with title 'Add new feature'"
- "List all open pull requests in owner/repo"
- "Merge pull request #789 using squash merge"
- "Add review comment to PR #101"
- "Get list of files changed in PR #202"
```

### 4. GitHub Actions (`actions`)
Monitor and trigger GitHub Actions workflows.

**Example Prompts:**
```
- "Show me all failed workflow runs from the last 7 days"
- "Trigger the 'Deploy to Production' workflow"
- "Get logs for the latest workflow run"
- "List all workflows in owner/repo"
- "Show me the status of workflow run #12345"
```

### 5. Code Security (`code_security`)
Access security alerts and vulnerabilities.

**Example Prompts:**
```
- "List all code scanning alerts in owner/repo"
- "Show me Dependabot security updates"
- "Get details of secret scanning alert #5"
- "List all open security vulnerabilities"
- "Show me critical security alerts"
```

### 6. Projects (`projects`)
Manage GitHub Projects and project items.

**Example Prompts:**
```
- "List all projects in owner/repo"
- "Add issue #123 to project 'Q1 Roadmap'"
- "Update project item status to 'In Progress'"
- "Get all items in project board"
```

### 7. Discussions (`discussions`)
Create and manage GitHub Discussions.

**Example Prompts:**
```
- "List all discussions in owner/repo"
- "Create a discussion in 'Ideas' category"
- "Add comment to discussion #10"
- "Get all comments on discussion #5"
```

### 8. Gists (`gists`)
Create and manage GitHub Gists.

**Example Prompts:**
```
- "Create a gist with my script.js file"
- "List all my gists"
- "Update gist with new content"
- "Delete gist abc123"
```

### 9. Notifications (`notifications`)
Access GitHub notifications.

**Example Prompts:**
```
- "Get my GitHub notifications"
- "Mark notification as read"
- "List unread notifications"
```

### 10. Users (`users`)
Get user and profile information.

**Example Prompts:**
```
- "Show me user profile for username"
- "List repositories I've starred"
- "Get my GitHub profile"
```

---

## Setup for Different AI Agents

### Claude Code (Already Done ✅)

The MCP server has been added to your local Claude Code configuration:

```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
```

**Usage:**
Just write prompts in Claude Code! For example:
```
Create an issue in my repository titled "Bug: Login fails" with high priority
```

---

### VS Code (Already Done ✅)

MCP configuration file created at `.vscode/mcp.json`:

```json
{
  "$schema": "https://modelcontextprotocol.io/schema/mcp.json",
  "inputs": [
    {
      "type": "promptString",
      "id": "github_token",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ],
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      },
      "description": "GitHub MCP server for repository management and automation"
    }
  }
}
```

**Requirements:**
- Docker installed and running
- GitHub Personal Access Token

**Usage:**
1. Open VS Code in this project
2. When prompted, enter your GitHub PAT
3. MCP server auto-connects
4. Use AI features with GitHub access

---

### Cursor

**Setup:**
1. Open Cursor Settings
2. Navigate to: Settings → Cursor Settings → MCP & Integrations
3. Add this configuration:

**Remote (OAuth - Easiest):**
```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

**Local (Docker - More Control):**
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "github_token",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ],
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      }
    }
  }
}
```

**Usage:**
Ask Cursor questions like:
```
List all open pull requests in my repository and summarize their changes
```

---

### Windsurf

**Setup:**
1. Open Windsurf Settings
2. Navigate to MCP Servers
3. Add GitHub MCP

**Remote:**
```json
{
  "github": {
    "url": "https://api.githubcopilot.com/mcp/"
  }
}
```

**Local Docker:**
```json
{
  "github": {
    "command": "docker",
    "args": [
      "run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
      "ghcr.io/github/github-mcp-server"
    ],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "your_pat_here"
    }
  }
}
```

---

## Creating a GitHub Personal Access Token (PAT)

**Required for Local Docker Setup:**

1. Go to GitHub: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Enter a note: "MCP Server Access"
4. Select scopes based on your needs:
   - `repo` - Full repository access (required for most operations)
   - `workflow` - Access GitHub Actions
   - `read:org` - Read organization data
   - `read:project` - Access projects
   - `gist` - Create gists
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

**Security Best Practices:**
- Store in environment variables, never hardcode
- Use minimal required scopes
- Rotate tokens regularly
- Revoke unused tokens

---

## Toolset Configuration for Specific Use Cases

### Read-Only Mode
**Toolsets:** `context`, `repos`, `issues`, `pull_requests`, `discussions`, `users`

**Use when:**
- Monitoring repositories
- Reading issues and PRs
- Analyzing code and commits

**Docker Setup:**
```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_READ_ONLY=1 \
  ghcr.io/github/github-mcp-server
```

---

### CI/CD Monitoring
**Toolsets:** `context`, `actions`, `repos`, `pull_requests`

**Use when:**
- Monitoring workflows
- Analyzing build failures
- Triggering deployments

**Docker Setup:**
```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_TOOLSETS="context,actions,repos,pull_requests" \
  ghcr.io/github/github-mcp-server
```

---

### Security Auditing
**Toolsets:** `context`, `code_security`, `dependabot`, `secret_protection`, `security_advisories`

**Use when:**
- Security scanning
- Vulnerability assessment
- Compliance monitoring

**Docker Setup:**
```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_TOOLSETS="context,code_security,dependabot,secret_protection,security_advisories" \
  ghcr.io/github/github-mcp-server
```

---

### Full Access
**Toolsets:** `all`

**Use when:**
- Complete automation
- Development workflows
- Maximum flexibility

**Docker Setup:**
```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_TOOLSETS="all" \
  ghcr.io/github/github-mcp-server
```

---

## Example Use Cases

### 1. Automated Issue Triage

**Prompt:**
```
Scan all new issues in my repository, categorize them by type (bug, feature, question),
and add appropriate labels and priority tags
```

**What happens:**
- AI agent queries GitHub MCP for new issues
- Analyzes issue content and context
- Applies labels based on content
- Adds priority based on keywords and severity

---

### 2. Pull Request Review Automation

**Prompt:**
```
Review all open pull requests in owner/repo, check for missing tests,
and add comments requesting tests if needed
```

**What happens:**
- Fetches all open PRs
- Analyzes changed files
- Checks for test coverage
- Adds review comments automatically

---

### 3. Release Notes Generation

**Prompt:**
```
Generate release notes for version 2.0 by analyzing all merged PRs and
commits since the last release tag
```

**What happens:**
- Compares commits between tags
- Groups changes by type (features, fixes, breaking)
- Formats into markdown release notes
- Creates GitHub release draft

---

### 4. Workflow Failure Alerts

**Prompt:**
```
Monitor GitHub Actions workflows and notify me via Slack when a
deployment workflow fails, including error logs
```

**What happens:**
- Watches workflow runs in real-time
- Detects failures in deployment workflows
- Extracts error logs
- Sends formatted alert to Slack

---

### 5. Security Vulnerability Dashboard

**Prompt:**
```
Create a weekly security report showing all new code scanning alerts,
Dependabot updates, and secret leaks, prioritized by severity
```

**What happens:**
- Queries code security toolset
- Aggregates all security findings
- Sorts by severity (critical, high, medium, low)
- Generates formatted report

---

## Available MCP Tools

The AI agent will use these tools automatically:

### Repository Tools
- `ListRepositories` - Get all accessible repos
- `GetRepository` - Get repo details
- `CreateRepository` - Create new repo
- `SearchCode` - Search code in repos
- `GetFileContents` - Read file contents
- `PushFiles` - Push multiple files
- `CreateOrUpdateFile` - Update single file
- `CreateBranch` - Create new branch
- `ListCommits` - Get commit history
- `GetCommit` - Get commit details
- `CompareCommits` - Compare two commits

### Issue Tools
- `ListIssues` - Get all issues
- `GetIssue` - Get issue details
- `CreateIssue` - Create new issue
- `UpdateIssue` - Update existing issue
- `AddIssueComment` - Comment on issue
- `SearchIssues` - Search issues
- `AddLabels` - Add labels to issue
- `RemoveLabel` - Remove label from issue

### Pull Request Tools
- `ListPullRequests` - Get all PRs
- `GetPullRequest` - Get PR details
- `CreatePullRequest` - Create new PR
- `UpdatePullRequest` - Update existing PR
- `MergePullRequest` - Merge a PR
- `CreateReviewComment` - Add review comment
- `ListPullRequestFiles` - Get changed files

### Actions Tools
- `ListWorkflows` - Get all workflows
- `GetWorkflow` - Get workflow details
- `TriggerWorkflow` - Trigger workflow run
- `ListWorkflowRuns` - Get workflow runs
- `GetWorkflowRun` - Get run details
- `GetWorkflowRunLogs` - Get run logs

### Security Tools
- `ListCodeScanningAlerts` - Get code scanning alerts
- `GetCodeScanningAlert` - Get alert details
- `UpdateCodeScanningAlert` - Update alert status
- `ListSecretScanningAlerts` - Get secret leaks

You don't need to call these directly - just use natural language!

---

## GitHub Enterprise Server

If you're using GitHub Enterprise Server instead of GitHub.com:

**Docker Setup:**
```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_HOST="https://github.enterprise.com" \
  ghcr.io/github/github-mcp-server
```

**VS Code Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "-e", "GITHUB_HOST",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}",
        "GITHUB_HOST": "https://github.enterprise.com"
      }
    }
  }
}
```

---

## Troubleshooting

### Docker Connection Issues

**Error:** "Cannot connect to Docker daemon"

**Solution:**
1. Ensure Docker Desktop is running
2. Check Docker daemon status: `docker info`
3. Restart Docker Desktop if needed

---

### Authentication Errors

**Error:** "Bad credentials" or "Unauthorized"

**Solution:**
1. Verify your PAT is correct
2. Check token hasn't expired
3. Ensure token has required scopes
4. Regenerate token if needed

---

### Missing Tools

If GitHub MCP tools aren't available:

**Solution:**
1. Verify authentication completed
2. Check Docker container is running: `docker ps`
3. View container logs: `docker logs <container_id>`
4. Verify toolsets are enabled (check GITHUB_TOOLSETS env var)

---

### Rate Limiting

**Error:** "API rate limit exceeded"

**Solution:**
- Authenticated requests: 5,000 requests/hour
- Check remaining quota: Query `GetAuthenticatedUser` tool
- Wait for rate limit reset (shown in error message)
- Use more specific queries to reduce API calls

---

## Example Prompts Library

### Repository Management
```
- "Clone all my repositories locally"
- "Search for TODO comments across all my repos"
- "Create a new repository called 'my-awesome-project'"
- "Get file tree structure for owner/repo"
- "Find all Python files modified in the last week"
```

### Issue Automation
```
- "Create issues from all TODO comments in the codebase"
- "Close all stale issues (no activity in 30 days)"
- "Label issues mentioning 'urgent' or 'critical' as high-priority"
- "Assign issues to team members based on expertise"
```

### Pull Request Management
```
- "Auto-approve PRs from Dependabot if tests pass"
- "Request changes on PRs missing test coverage"
- "Summarize all PRs merged this week"
- "Find PRs waiting for review over 48 hours"
```

### CI/CD Operations
```
- "Re-run all failed workflow runs from today"
- "Show me which workflows are consuming the most minutes"
- "Trigger staging deployment workflow"
- "Get build logs for the last failed CI run"
```

### Security Monitoring
```
- "Show me all critical security vulnerabilities"
- "Auto-dismiss false positive security alerts"
- "Create issues for each Dependabot alert"
- "Scan for exposed secrets in recent commits"
```

### Project Planning
```
- "Move all 'Done' issues to the 'Completed' column"
- "Create project board for Q2 2025 roadmap"
- "Generate progress report for current sprint"
- "Add all P0 bugs to 'Critical Fixes' project"
```

---

## Integration in Generated Projects

When generating new projects with the Project Generator:

1. Select a template (React + Vite, Next.js, etc.)
2. Check "GitHub MCP" in integrations
3. Generate project

**Auto-configured:**
- ✅ `.vscode/mcp.json` with GitHub MCP server
- ✅ `GITHUB_PERSONAL_ACCESS_TOKEN` in `.env`
- ✅ `github-mcp.config.ts` with service wrapper
- ✅ `GITHUB_MCP_SETUP.md` with instructions
- ✅ Ready to use in VS Code, Claude Code, Cursor

---

## Rate Limits and Best Practices

### GitHub API Rate Limits

**Authenticated Requests:**
- 5,000 requests per hour
- Shared across all tokens for your account

**Unauthenticated Requests:**
- 60 requests per hour per IP

**GraphQL API:**
- 5,000 points per hour
- Each query costs points based on complexity

**Best Practices:**
- Use specific queries instead of listing everything
- Cache results when possible
- Batch related operations
- Monitor rate limit headers

---

## Support & Resources

**Documentation:**
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [Model Context Protocol](https://modelcontextprotocol.io/)

**Need Help?**
- GitHub Support (for API/token issues)
- AI Agent Documentation (for setup issues)
- MCP Community (for protocol questions)

---

## Security Considerations

### Token Security
- ✅ Store tokens in environment variables
- ✅ Never commit tokens to repositories
- ✅ Use `.gitignore` for `.env` files
- ✅ Rotate tokens regularly (every 90 days)
- ✅ Revoke compromised tokens immediately

### Minimal Permissions
- ✅ Grant only required scopes
- ✅ Use read-only mode when possible
- ✅ Separate tokens for different use cases
- ✅ Review token permissions quarterly

### Audit Logging
- ✅ Monitor token usage via GitHub audit log
- ✅ Review MCP operations regularly
- ✅ Alert on suspicious activity
- ✅ Keep activity logs for compliance

---

## Quick Start Checklist

- [x] GitHub MCP added to Claude Code
- [x] VS Code MCP configuration created
- [x] Docker installed and running
- [ ] GitHub Personal Access Token created
- [ ] Test with simple prompt: "List all my repositories"
- [ ] Verify Docker container starts successfully
- [ ] Check authentication completes
- [ ] Explore example prompts above
- [ ] Integrate into your workflow!

**You're all set! Start automating GitHub with AI agents.** 🚀
