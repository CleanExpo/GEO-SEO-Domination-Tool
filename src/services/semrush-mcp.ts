/**
 * Semrush MCP Service
 *
 * Wrapper for Semrush Model Context Protocol (MCP) server
 * Access Semrush API data through AI agents
 *
 * MCP Endpoint: https://mcp.semrush.com/v1/mcp
 * Authentication: OAuth 2.1
 *
 * Available APIs:
 * - Trends API (all endpoints based on subscription)
 * - Analytics API v3 (all endpoints)
 * - Projects API v3 (read-only methods)
 */

export interface SemrushMCPConfig {
  apiKey: string
  mcpEndpoint?: string
}

export interface TrendsAPIRequest {
  type: 'domain_overview' | 'keyword_overview' | 'backlinks' | 'traffic_analytics'
  domain?: string
  keyword?: string
  database?: string // Country database (e.g., 'us', 'uk', 'ca')
  limit?: number
  offset?: number
  export_columns?: string
}

export interface AnalyticsAPIRequest {
  type: 'domain_organic' | 'domain_adwords' | 'url_organic' | 'backlinks_overview'
  target: string // domain or URL
  database?: string
  display_limit?: number
  display_offset?: number
  export_columns?: string
}

export interface ProjectsAPIRequest {
  type: 'projects_list' | 'position_tracking' | 'site_audit'
  projectId?: string
  limit?: number
  offset?: number
}

export interface SemrushMCPResponse {
  success: boolean
  data?: any
  error?: string
  unitsUsed?: number
  remainingUnits?: number
}

export class SemrushMCPService {
  private config: SemrushMCPConfig
  private mcpEndpoint: string

  constructor(config: SemrushMCPConfig) {
    this.config = config
    this.mcpEndpoint = config.mcpEndpoint || 'https://mcp.semrush.com/v1/mcp'
  }

  /**
   * Query Trends API through MCP
   *
   * Example AI prompts:
   * - "List domains in the human resources industry for July 2025"
   * - "Give me a traffic comparison for nike.com and adidas.com"
   * - "Show me keyword trends for 'digital marketing' in the US"
   */
  async queryTrendsAPI(request: TrendsAPIRequest): Promise<SemrushMCPResponse> {
    try {
      const prompt = this.buildTrendsPrompt(request)

      // In production, this would call the MCP endpoint
      // For now, returning mock data structure
      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.mcpEndpoint,
          note: 'This would be executed through your AI agent (Claude, Cursor, VS Code)',
        },
        unitsUsed: 10,
        remainingUnits: 9990,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Query Analytics API through MCP
   *
   * Example AI prompts:
   * - "Get organic search data for example.com"
   * - "Show me backlink profile for competitor.com"
   * - "Compare domain authority between site1.com and site2.com"
   */
  async queryAnalyticsAPI(request: AnalyticsAPIRequest): Promise<SemrushMCPResponse> {
    try {
      const prompt = this.buildAnalyticsPrompt(request)

      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.mcpEndpoint,
          note: 'Execute this prompt in your AI agent to get real data',
        },
        unitsUsed: 10,
        remainingUnits: 9980,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Query Projects API through MCP
   *
   * Example AI prompts:
   * - "List all my Semrush projects"
   * - "Show position tracking data for project X"
   * - "Get site audit results for my website"
   */
  async queryProjectsAPI(request: ProjectsAPIRequest): Promise<SemrushMCPResponse> {
    try {
      const prompt = this.buildProjectsPrompt(request)

      return {
        success: true,
        data: {
          message: `MCP Query: ${prompt}`,
          endpoint: this.mcpEndpoint,
          note: 'Use this prompt in Claude/Cursor to access your project data',
        },
        unitsUsed: 5,
        remainingUnits: 9975,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Generate AI-ready prompts for Trends API
   */
  private buildTrendsPrompt(request: TrendsAPIRequest): string {
    const { type, domain, keyword, database = 'us', limit = 10 } = request

    switch (type) {
      case 'domain_overview':
        return `Get domain overview for ${domain} in ${database} database. Show traffic, keywords, and backlinks data.`

      case 'keyword_overview':
        return `Get keyword overview for "${keyword}" in ${database} database. Include search volume, CPC, and competition metrics.`

      case 'backlinks':
        return `Get backlink data for ${domain}. Show top ${limit} backlinks with authority scores.`

      case 'traffic_analytics':
        return `Get traffic analytics for ${domain}. Include monthly visits, traffic sources, and audience insights.`

      default:
        return `Query Semrush Trends API for ${type}`
    }
  }

  /**
   * Generate AI-ready prompts for Analytics API
   */
  private buildAnalyticsPrompt(request: AnalyticsAPIRequest): string {
    const { type, target, database = 'us', display_limit = 100 } = request

    switch (type) {
      case 'domain_organic':
        return `Get organic search keywords for ${target} in ${database} database. Show top ${display_limit} keywords with positions and traffic.`

      case 'domain_adwords':
        return `Get paid search keywords for ${target}. Include ad copy and landing pages.`

      case 'url_organic':
        return `Get organic keywords for URL: ${target}. Show ranking data.`

      case 'backlinks_overview':
        return `Get backlinks overview for ${target}. Include total backlinks, referring domains, and authority score.`

      default:
        return `Query Semrush Analytics API for ${type} on ${target}`
    }
  }

  /**
   * Generate AI-ready prompts for Projects API
   */
  private buildProjectsPrompt(request: ProjectsAPIRequest): string {
    const { type, projectId, limit = 10 } = request

    switch (type) {
      case 'projects_list':
        return `List all my Semrush projects. Show project names, URLs, and status.`

      case 'position_tracking':
        return `Get position tracking data for project ${projectId}. Show keyword rankings and changes.`

      case 'site_audit':
        return `Get site audit results for project ${projectId}. Include errors, warnings, and SEO health score.`

      default:
        return `Query Semrush Projects API for ${type}`
    }
  }

  /**
   * Get MCP server status and available tools
   */
  async getMCPStatus(): Promise<{
    connected: boolean
    availableTools: string[]
    endpoint: string
  }> {
    return {
      connected: true,
      availableTools: [
        'semrush_report',
        'semrush_report_list',
        'semrush_report_schema',
      ],
      endpoint: this.mcpEndpoint,
    }
  }

  /**
   * Check API unit balance
   */
  async getAPIUnits(): Promise<{
    standardAPI: number
    trendsAPI: number
  }> {
    // In production, this would query the Semrush API
    return {
      standardAPI: 10000,
      trendsAPI: 5000,
    }
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
        category: 'Competitor Analysis',
        examples: [
          'Compare organic traffic for nike.com and adidas.com over the last 6 months',
          'List top 10 competitors in the fitness industry',
          'Show me competitor keyword gaps for my-site.com vs competitor.com',
        ],
      },
      {
        category: 'Keyword Research',
        examples: [
          'Find high-volume low-competition keywords for "digital marketing"',
          'Get search trends for "AI tools" in the US for 2024',
          'Show me related keywords for "content marketing" with search volume',
        ],
      },
      {
        category: 'Backlink Analysis',
        examples: [
          'Get backlink profile for example.com',
          'Find new backlinks for my-site.com in the last 30 days',
          'Compare backlink authority between site1.com and site2.com',
        ],
      },
      {
        category: 'Traffic Analytics',
        examples: [
          'Show traffic sources for competitor.com',
          'Get monthly visit trends for my-site.com',
          'Compare traffic between Q1 and Q2 for example.com',
        ],
      },
      {
        category: 'Project Monitoring',
        examples: [
          'List all my Semrush projects',
          'Show position tracking changes for project "My Website"',
          'Get site audit errors for my latest project',
        ],
      },
    ]
  }
}

/**
 * Helper function to create MCP service instance
 */
export const createSemrushMCPService = (apiKey: string): SemrushMCPService => {
  return new SemrushMCPService({ apiKey })
}

/**
 * MCP Setup Instructions
 *
 * For AI agents to access Semrush data through MCP:
 *
 * 1. Claude Code:
 *    claude mcp add --transport http semrush https://mcp.semrush.com/v1/mcp
 *
 * 2. VS Code:
 *    Create .vscode/mcp.json with:
 *    {
 *      "mcpServers": {
 *        "semrush": {
 *          "url": "https://mcp.semrush.com/v1/mcp"
 *        }
 *      }
 *    }
 *
 * 3. Cursor:
 *    Settings → Cursor Settings → MCP & Integrations
 *    Add the same JSON configuration
 *
 * 4. Claude (browser/desktop):
 *    Settings → Connectors → Add custom connector
 *    URL: https://mcp.semrush.com/v1/mcp
 */
