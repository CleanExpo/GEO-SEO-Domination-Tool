/**
 * Vercel MCP Service
 *
 * Wrapper for Vercel Model Context Protocol (MCP) server
 * Connects AI agents to Vercel platform for project and deployment management
 *
 * MCP Endpoint: https://mcp.vercel.com
 * Project-specific: https://mcp.vercel.com/<teamSlug>/<projectSlug>
 * Authentication: OAuth 2.1 (automatic)
 *
 * Available Tool Categories:
 * - Public Tools (no auth required): Documentation search
 * - Authenticated Tools: Project management, deployments, logs
 */

export interface VercelMCPConfig {
  teamSlug?: string
  projectSlug?: string
  remoteEndpoint?: string
}

export interface VercelMCPResponse {
  success: boolean
  data?: any
  error?: string
}

export class VercelMCPService {
  private config: VercelMCPConfig
  private remoteEndpoint: string

  constructor(config: VercelMCPConfig = {}) {
    this.config = config

    // Use project-specific endpoint if team and project provided
    if (config.teamSlug && config.projectSlug) {
      this.remoteEndpoint = `https://mcp.vercel.com/${config.teamSlug}/${config.projectSlug}`
    } else {
      this.remoteEndpoint = config.remoteEndpoint || 'https://mcp.vercel.com'
    }
  }

  /**
   * Documentation Search (Public - No Auth)
   *
   * Example AI prompts:
   * - "Search Vercel docs for 'edge functions'"
   * - "How do I set up environment variables in Vercel?"
   * - "Show me documentation about ISR in Next.js"
   * - "Find information about Vercel's pricing plans"
   */
  async searchDocumentation(prompt: string): Promise<VercelMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.remoteEndpoint,
          note: 'Execute this in your AI agent to get real data from Vercel docs',
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
   * Project Management (Authenticated)
   *
   * Example AI prompts:
   * - "List all my Vercel projects"
   * - "Show me details for project 'my-awesome-app'"
   * - "Get environment variables for my production deployment"
   * - "What's the latest deployment status?"
   */
  async queryProjects(prompt: string): Promise<VercelMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.remoteEndpoint,
          note: 'AI agent will manage Vercel projects with OAuth authentication',
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
   * Deployment Management (Authenticated)
   *
   * Example AI prompts:
   * - "Deploy my project to production"
   * - "List all deployments from the last 7 days"
   * - "Show me failed deployments"
   * - "Get build logs for deployment xyz123"
   * - "Cancel the running deployment"
   */
  async queryDeployments(prompt: string): Promise<VercelMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.remoteEndpoint,
          note: 'AI agent will manage deployments with OAuth',
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
   * Log Analysis (Authenticated)
   *
   * Example AI prompts:
   * - "Show me deployment logs for the latest build"
   * - "Analyze errors in production logs"
   * - "Find all 500 errors in the last 24 hours"
   * - "Get runtime logs for my edge function"
   */
  async queryLogs(prompt: string): Promise<VercelMCPResponse> {
    try {
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.remoteEndpoint,
          note: 'AI agent will analyze deployment logs',
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
    category: 'public' | 'authenticated'
    tools: string[]
  }[] {
    return [
      {
        category: 'public',
        tools: [
          'search_documentation',
          'get_documentation_page',
          'list_documentation_categories',
        ],
      },
      {
        category: 'authenticated',
        tools: [
          'list_projects',
          'get_project',
          'create_project',
          'update_project',
          'delete_project',
          'list_deployments',
          'get_deployment',
          'create_deployment',
          'cancel_deployment',
          'get_deployment_logs',
          'analyze_deployment_logs',
          'list_environment_variables',
          'get_environment_variable',
          'create_environment_variable',
          'update_environment_variable',
          'delete_environment_variable',
          'list_domains',
          'get_domain',
          'add_domain',
          'remove_domain',
          'verify_domain',
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
        category: 'Documentation Search (No Auth)',
        examples: [
          'Search Vercel docs for "edge middleware"',
          'How do I configure custom domains in Vercel?',
          'Show me documentation about incremental static regeneration',
          'Find information about Vercel Functions pricing',
          'What are the limits for serverless functions?',
        ],
      },
      {
        category: 'Project Management',
        examples: [
          'List all my Vercel projects',
          'Show me details for project "my-nextjs-app"',
          'Create a new project called "awesome-portfolio"',
          'Update the framework preset for my project',
          'Get all environment variables for production',
        ],
      },
      {
        category: 'Deployment Automation',
        examples: [
          'Deploy my project to production',
          'List all deployments from the last week',
          'Show me the status of deployment xyz123',
          'Cancel the currently running deployment',
          'Redeploy the last successful build',
        ],
      },
      {
        category: 'Log Analysis',
        examples: [
          'Show me deployment logs for the latest build',
          'Find all errors in production logs from today',
          'Analyze build failures from the last deployment',
          'Get runtime logs for my API route /api/users',
          'Show me all 404 errors in the last 24 hours',
        ],
      },
      {
        category: 'Domain Management',
        examples: [
          'List all domains for my project',
          'Add custom domain "example.com" to my project',
          'Verify domain "example.com"',
          'Show DNS configuration for "example.com"',
          'Remove domain "old-domain.com" from my project',
        ],
      },
      {
        category: 'Environment Variables',
        examples: [
          'List all environment variables for production',
          'Add API_KEY to production environment',
          'Update DATABASE_URL for staging',
          'Delete old LEGACY_TOKEN environment variable',
          'Show me which environment variables are encrypted',
        ],
      },
      {
        category: 'Team Collaboration',
        examples: [
          'List all projects in my team "acme-corp"',
          'Show team members with access to this project',
          'Get deployment activity for the last sprint',
          'List all projects deployed this month',
          'Show me which projects have failed deployments',
        ],
      },
    ]
  }

  /**
   * Get project-specific endpoint
   */
  getProjectEndpoint(teamSlug: string, projectSlug: string): string {
    return `https://mcp.vercel.com/${teamSlug}/${projectSlug}`
  }

  /**
   * Helper to check if using project-specific endpoint
   */
  isProjectSpecific(): boolean {
    return Boolean(this.config.teamSlug && this.config.projectSlug)
  }

  /**
   * Get current endpoint being used
   */
  getCurrentEndpoint(): string {
    return this.remoteEndpoint
  }
}

/**
 * Helper function to create Vercel MCP service instance
 */
export const createVercelMCPService = (
  teamSlug?: string,
  projectSlug?: string
): VercelMCPService => {
  return new VercelMCPService({ teamSlug, projectSlug })
}

/**
 * MCP Setup Instructions
 *
 * Remote Vercel MCP (OAuth - Recommended):
 *
 * 1. Claude Code:
 *    claude mcp add --transport http vercel https://mcp.vercel.com
 *
 *    Project-specific:
 *    claude mcp add --transport http vercel-myapp https://mcp.vercel.com/my-team/my-project
 *
 * 2. VS Code (version 1.101+):
 *    Add to .vscode/mcp.json:
 *    {
 *      "mcpServers": {
 *        "vercel": {
 *          "url": "https://mcp.vercel.com"
 *        }
 *      }
 *    }
 *
 * 3. Cursor:
 *    Add to .cursor/mcp.json:
 *    {
 *      "mcpServers": {
 *        "vercel": {
 *          "url": "https://mcp.vercel.com"
 *        }
 *      }
 *    }
 *
 * 4. ChatGPT (Pro/Plus):
 *    Settings → Connectors → Create connector
 *    Name: Vercel
 *    URL: https://mcp.vercel.com
 *    Authentication: OAuth
 *
 * 5. Windsurf:
 *    Add to mcp_config.json:
 *    {
 *      "mcpServers": {
 *        "vercel": {
 *          "serverUrl": "https://mcp.vercel.com"
 *        }
 *      }
 *    }
 *
 * Project-Specific Access (Recommended for Better Performance):
 *
 * Instead of: https://mcp.vercel.com
 * Use: https://mcp.vercel.com/<teamSlug>/<projectSlug>
 *
 * Benefits:
 * - Automatic project and team context
 * - Improved tool performance
 * - Better error handling
 * - No manual parameter input needed
 *
 * Finding Your Slugs:
 * 1. Team slug: Vercel Dashboard → Team Settings → General
 * 2. Project slug: Vercel Dashboard → Project Settings → General
 * 3. Or use: vercel projects ls
 *
 * Example:
 * https://mcp.vercel.com/acme-corp/my-awesome-app
 *
 * Available Tools:
 *
 * Public (No Authentication):
 * - search_documentation - Search Vercel docs
 * - get_documentation_page - Get specific doc page
 * - list_documentation_categories - List doc categories
 *
 * Authenticated (OAuth Required):
 * - Projects: list, get, create, update, delete
 * - Deployments: list, get, create, cancel
 * - Logs: get deployment logs, analyze logs
 * - Environment Variables: list, get, create, update, delete
 * - Domains: list, get, add, remove, verify
 *
 * Security Best Practices:
 * - OAuth authentication is automatic and secure
 * - Enable human confirmation for destructive operations
 * - Review AI agent permissions before granting access
 * - Be aware of prompt injection risks
 * - Familiarize with confused deputy attacks
 *
 * Supported AI Clients:
 * - Claude Code ✅
 * - Claude.ai and Claude Desktop ✅
 * - ChatGPT (Pro/Plus) ✅
 * - Cursor ✅
 * - VS Code with Copilot ✅
 * - Devin ✅
 * - Raycast ✅
 * - Goose ✅
 * - Windsurf ✅
 * - Gemini Code Assist ✅
 * - Gemini CLI ✅
 */
