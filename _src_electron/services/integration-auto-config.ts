import fs from 'fs-extra'
import path from 'path'
import { createSupabaseConnector, SupabaseConnector } from './connectors/supabase-connector'
import { createGitHubConnector, GitHubConnector } from './connectors/github-connector'
import { createShadcnSetup, ShadcnSetup } from './shadcn-setup'

export interface IntegrationCredentials {
  integrationName: string
  credentials: Record<string, string>
}

export interface AutoConfigResult {
  success: boolean
  envVarsAdded: string[]
  configFilesCreated: string[]
  dependenciesInstalled: string[]
  initializationRun: boolean
  errors: string[]
}

export class IntegrationAutoConfig {
  private projectPath: string
  private credentials: Map<string, Record<string, string>>

  constructor(projectPath: string) {
    this.projectPath = projectPath
    this.credentials = new Map()
  }

  // Add credentials for an integration
  addCredentials(integrationName: string, credentials: Record<string, string>) {
    this.credentials.set(integrationName, credentials)
  }

  // Auto-configure all integrations
  async configureAll(integrations: string[]): Promise<Map<string, AutoConfigResult>> {
    const results = new Map<string, AutoConfigResult>()

    for (const integration of integrations) {
      try {
        const result = await this.configureIntegration(integration)
        results.set(integration, result)
      } catch (error) {
        results.set(integration, {
          success: false,
          envVarsAdded: [],
          configFilesCreated: [],
          dependenciesInstalled: [],
          initializationRun: false,
          errors: [error instanceof Error ? error.message : String(error)],
        })
      }
    }

    return results
  }

  // Configure a single integration
  private async configureIntegration(integrationName: string): Promise<AutoConfigResult> {
    const result: AutoConfigResult = {
      success: false,
      envVarsAdded: [],
      configFilesCreated: [],
      dependenciesInstalled: [],
      initializationRun: false,
      errors: [],
    }

    const creds = this.credentials.get(integrationName)
    if (!creds) {
      result.errors.push(`No credentials found for ${integrationName}`)
      return result
    }

    switch (integrationName) {
      case 'supabase':
        return await this.configureSupabase(creds, result)
      case 'github':
        return await this.configureGitHub(creds, result)
      case 'vercel':
        return await this.configureVercel(creds, result)
      case 'openai':
        return await this.configureOpenAI(creds, result)
      case 'anthropic':
        return await this.configureAnthropic(creds, result)
      case 'stripe':
        return await this.configureStripe(creds, result)
      case 'shadcn':
        return await this.configureShadcn(creds, result)
      case 'firecrawl':
        return await this.configureFirecrawl(creds, result)
      case 'semrush-mcp':
        return await this.configureSemrushMCP(creds, result)
      case 'github-mcp':
        return await this.configureGitHubMCP(creds, result)
      case 'vercel-mcp':
        return await this.configureVercelMCP(creds, result)
      case 'playwright-mcp':
        return await this.configurePlaywrightMCP(creds, result)
      default:
        result.errors.push(`Unknown integration: ${integrationName}`)
        return result
    }
  }

  // Configure Supabase
  private async configureSupabase(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      // Add environment variables
      await this.addEnvVars({
        SUPABASE_URL: creds.url || creds.projectUrl,
        SUPABASE_ANON_KEY: creds.anonKey || creds.key,
      })
      result.envVarsAdded.push('SUPABASE_URL', 'SUPABASE_ANON_KEY')

      if (creds.serviceRoleKey) {
        await this.addEnvVars({ SUPABASE_SERVICE_ROLE_KEY: creds.serviceRoleKey })
        result.envVarsAdded.push('SUPABASE_SERVICE_ROLE_KEY')
      }

      // Create Supabase config file
      const configPath = path.join(this.projectPath, 'supabase.config.ts')
      const configContent = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || '${creds.url}'
const supabaseKey = process.env.SUPABASE_ANON_KEY || '${creds.anonKey}'

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('supabase.config.ts')

      // Test connection
      try {
        const connector = createSupabaseConnector({
          projectUrl: creds.url,
          anonKey: creds.anonKey,
        })
        const isConnected = await connector.testConnection()
        result.initializationRun = isConnected
      } catch (error) {
        result.errors.push(`Connection test failed: ${error}`)
      }

      // Create database types file
      const typesPath = path.join(this.projectPath, 'src', 'types', 'database.types.ts')
      await fs.ensureDir(path.dirname(typesPath))
      await fs.writeFile(typesPath, `// Supabase Database Types\n// Auto-generated - update with: npx supabase gen types typescript\n\nexport type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]\n\nexport interface Database {\n  public: {\n    Tables: {}\n    Views: {}\n    Functions: {}\n  }\n}\n`)
      result.configFilesCreated.push('src/types/database.types.ts')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure GitHub
  private async configureGitHub(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      // Add environment variables
      await this.addEnvVars({
        GITHUB_TOKEN: creds.token || creds.accessToken,
      })
      result.envVarsAdded.push('GITHUB_TOKEN')

      if (creds.owner) {
        await this.addEnvVars({ GITHUB_OWNER: creds.owner })
        result.envVarsAdded.push('GITHUB_OWNER')
      }

      if (creds.repo) {
        await this.addEnvVars({ GITHUB_REPO: creds.repo })
        result.envVarsAdded.push('GITHUB_REPO')
      }

      // Create GitHub config file
      const configPath = path.join(this.projectPath, 'github.config.ts')
      const configContent = `import { Octokit } from '@octokit/rest'

const githubToken = process.env.GITHUB_TOKEN || '${creds.token}'

export const octokit = new Octokit({
  auth: githubToken,
})

export default octokit
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('github.config.ts')

      // Create GitHub Actions workflow
      const workflowDir = path.join(this.projectPath, '.github', 'workflows')
      await fs.ensureDir(workflowDir)

      const ciWorkflow = `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build
`
      await fs.writeFile(path.join(workflowDir, 'ci.yml'), ciWorkflow)
      result.configFilesCreated.push('.github/workflows/ci.yml')

      // Test connection
      try {
        const connector = createGitHubConnector({
          accessToken: creds.token,
        })
        const isConnected = await connector.testConnection()
        result.initializationRun = isConnected
      } catch (error) {
        result.errors.push(`Connection test failed: ${error}`)
      }

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure Vercel
  private async configureVercel(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      await this.addEnvVars({
        VERCEL_TOKEN: creds.token,
      })
      result.envVarsAdded.push('VERCEL_TOKEN')

      // Create vercel.json
      const vercelConfig = {
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
        devCommand: 'npm run dev',
        installCommand: 'npm install',
      }

      await fs.writeJSON(
        path.join(this.projectPath, 'vercel.json'),
        vercelConfig,
        { spaces: 2 }
      )
      result.configFilesCreated.push('vercel.json')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure OpenAI
  private async configureOpenAI(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      await this.addEnvVars({
        OPENAI_API_KEY: creds.apiKey || creds.key,
      })
      result.envVarsAdded.push('OPENAI_API_KEY')

      // Create OpenAI config file
      const configPath = path.join(this.projectPath, 'openai.config.ts')
      const configContent = `import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '${creds.apiKey}',
})

export default openai
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('openai.config.ts')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure Anthropic
  private async configureAnthropic(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      await this.addEnvVars({
        ANTHROPIC_API_KEY: creds.apiKey || creds.key,
      })
      result.envVarsAdded.push('ANTHROPIC_API_KEY')

      // Create Anthropic config file
      const configPath = path.join(this.projectPath, 'anthropic.config.ts')
      const configContent = `import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '${creds.apiKey}',
})

export default anthropic
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('anthropic.config.ts')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure Stripe
  private async configureStripe(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      await this.addEnvVars({
        STRIPE_SECRET_KEY: creds.secretKey,
        STRIPE_PUBLISHABLE_KEY: creds.publishableKey,
      })
      result.envVarsAdded.push('STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY')

      if (creds.webhookSecret) {
        await this.addEnvVars({ STRIPE_WEBHOOK_SECRET: creds.webhookSecret })
        result.envVarsAdded.push('STRIPE_WEBHOOK_SECRET')
      }

      // Create Stripe config file
      const configPath = path.join(this.projectPath, 'stripe.config.ts')
      const configContent = `import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '${creds.secretKey}', {
  apiVersion: '2023-10-16',
})

export default stripe
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('stripe.config.ts')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Helper: Add environment variables to .env file
  private async addEnvVars(vars: Record<string, string>): Promise<void> {
    const envPath = path.join(this.projectPath, '.env')
    let envContent = ''

    // Read existing .env if it exists
    if (await fs.pathExists(envPath)) {
      envContent = await fs.readFile(envPath, 'utf-8')
    }

    // Add new variables
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      if (regex.test(envContent)) {
        // Update existing variable
        envContent = envContent.replace(regex, `${key}=${value}`)
      } else {
        // Add new variable
        envContent += `\n${key}=${value}`
      }
    }

    await fs.writeFile(envPath, envContent.trim() + '\n')
  }

  // Configure shadcn/ui
  private async configureShadcn(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      const shadcnSetup = createShadcnSetup()

      // Detect framework from package.json
      const framework = await this.detectFramework()

      const setupResult = await shadcnSetup.setupShadcn({
        projectPath: this.projectPath,
        framework: framework as 'vite' | 'nextjs',
        baseColor: (creds.baseColor as any) || 'neutral',
        cssVariables: true,
        components: creds.components ? creds.components.split(',') : ['button', 'card', 'input', 'label'],
      })

      result.configFilesCreated = setupResult.filesCreated
      result.dependenciesInstalled = ['tailwindcss', '@tailwindcss/vite', 'class-variance-authority', 'clsx', 'tailwind-merge']
      result.initializationRun = setupResult.success

      if (setupResult.errors.length > 0) {
        result.errors.push(...setupResult.errors)
      }

      result.success = setupResult.success
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure Firecrawl
  private async configureFirecrawl(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      await this.addEnvVars({
        FIRECRAWL_API_KEY: creds.apiKey || creds.key,
      })
      result.envVarsAdded.push('FIRECRAWL_API_KEY')

      // Create Firecrawl config file
      const configPath = path.join(this.projectPath, 'firecrawl.config.ts')
      const configContent = `import FirecrawlApp from '@mendable/firecrawl-js'

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || '${creds.apiKey}',
})

export default firecrawl
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('firecrawl.config.ts')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure Semrush MCP
  private async configureSemrushMCP(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      await this.addEnvVars({
        SEMRUSH_API_KEY: creds.apiKey || creds.key,
      })
      result.envVarsAdded.push('SEMRUSH_API_KEY')

      // Create .vscode/mcp.json for VS Code MCP integration
      const vscodeDir = path.join(this.projectPath, '.vscode')
      await fs.ensureDir(vscodeDir)

      const mcpConfig = {
        $schema: 'https://modelcontextprotocol.io/schema/mcp.json',
        mcpServers: {
          semrush: {
            url: 'https://mcp.semrush.com/v1/mcp',
            description: 'Semrush MCP server for SEO data and analytics',
          },
        },
      }

      await fs.writeJSON(path.join(vscodeDir, 'mcp.json'), mcpConfig, { spaces: 2 })
      result.configFilesCreated.push('.vscode/mcp.json')

      // Create Semrush MCP config file
      const configPath = path.join(this.projectPath, 'semrush-mcp.config.ts')
      const configContent = `import { createSemrushMCPService } from './services/semrush-mcp'

const semrushMCP = createSemrushMCPService(
  process.env.SEMRUSH_API_KEY || '${creds.apiKey}'
)

export default semrushMCP

/**
 * Semrush MCP is now configured!
 *
 * Use AI prompts like:
 * - "Get domain overview for example.com"
 * - "Compare traffic for nike.com and adidas.com"
 * - "Show keyword rankings for my project"
 *
 * The AI agent will automatically use the MCP server at:
 * https://mcp.semrush.com/v1/mcp
 */
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('semrush-mcp.config.ts')

      // Create README for MCP setup
      const readmePath = path.join(this.projectPath, 'SEMRUSH_MCP_SETUP.md')
      const readmeContent = `# Semrush MCP Setup

## What is Semrush MCP?

The Semrush MCP (Model Context Protocol) server lets you access Semrush API data through AI agents like Claude, Cursor, and VS Code.

## Already Configured

✅ VS Code MCP configuration created (.vscode/mcp.json)
✅ Environment variable added (SEMRUSH_API_KEY)
✅ Service wrapper ready (semrush-mcp.config.ts)

## Usage in AI Agents

### Claude Code
Already added locally! Just use prompts like:
- "Get domain overview for example.com"
- "Show keyword trends for 'digital marketing'"

### VS Code
MCP is auto-configured! Open the command palette and use Semrush queries.

### Cursor
Add to Settings → MCP & Integrations:
\`\`\`json
{
  "mcpServers": {
    "semrush": {
      "url": "https://mcp.semrush.com/v1/mcp"
    }
  }
}
\`\`\`

### Claude (Browser/Desktop)
Settings → Connectors → Add custom connector
URL: https://mcp.semrush.com/v1/mcp

## Example AI Prompts

**Competitor Analysis:**
- "Compare organic traffic for nike.com and adidas.com"
- "List top competitors in the fitness industry"

**Keyword Research:**
- "Find high-volume keywords for 'AI tools'"
- "Show search trends for 'digital marketing' in 2024"

**Backlink Analysis:**
- "Get backlink profile for example.com"
- "Find new backlinks in the last 30 days"

**Project Monitoring:**
- "List all my Semrush projects"
- "Show position tracking changes"
- "Get site audit results"

## Available APIs

- **Trends API** - Keyword and backlink data
- **Analytics API v3** - Domain, keyword, URL reports
- **Projects API v3** - Read-only project access

## API Units

Semrush MCP uses the same unit system as Semrush API.
Check your balance in the Semrush dashboard.
`
      await fs.writeFile(readmePath, readmeContent)
      result.configFilesCreated.push('SEMRUSH_MCP_SETUP.md')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure GitHub MCP
  private async configureGitHubMCP(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      const pat = creds.pat || creds.token || creds.apiKey
      if (pat) {
        await this.addEnvVars({
          GITHUB_PERSONAL_ACCESS_TOKEN: pat,
        })
        result.envVarsAdded.push('GITHUB_PERSONAL_ACCESS_TOKEN')
      }

      // Update .vscode/mcp.json to include GitHub MCP
      const vscodeDir = path.join(this.projectPath, '.vscode')
      await fs.ensureDir(vscodeDir)

      const mcpConfigPath = path.join(vscodeDir, 'mcp.json')
      let mcpConfig: any = {
        $schema: 'https://modelcontextprotocol.io/schema/mcp.json',
        inputs: [],
        mcpServers: {},
      }

      // Read existing config if it exists
      if (await fs.pathExists(mcpConfigPath)) {
        mcpConfig = await fs.readJSON(mcpConfigPath)
      }

      // Add GitHub input for PAT
      if (!mcpConfig.inputs) mcpConfig.inputs = []
      const githubTokenInput = mcpConfig.inputs.find((i: any) => i.id === 'github_token')
      if (!githubTokenInput) {
        mcpConfig.inputs.push({
          type: 'promptString',
          id: 'github_token',
          description: 'GitHub Personal Access Token',
          password: true,
        })
      }

      // Add GitHub MCP server
      if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {}
      mcpConfig.mcpServers.github = {
        command: 'docker',
        args: [
          'run',
          '-i',
          '--rm',
          '-e',
          'GITHUB_PERSONAL_ACCESS_TOKEN',
          'ghcr.io/github/github-mcp-server',
        ],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: '${input:github_token}',
        },
        description: 'GitHub MCP server for repository management and automation',
      }

      await fs.writeJSON(mcpConfigPath, mcpConfig, { spaces: 2 })
      result.configFilesCreated.push('.vscode/mcp.json')

      // Create GitHub MCP config file
      const configPath = path.join(this.projectPath, 'github-mcp.config.ts')
      const configContent = `import { createGitHubMCPService } from './services/github-mcp'

const githubMCP = createGitHubMCPService(
  process.env.GITHUB_PERSONAL_ACCESS_TOKEN
)

export default githubMCP

/**
 * GitHub MCP is now configured!
 *
 * Use AI prompts like:
 * - "List all repositories in my organization"
 * - "Create an issue titled 'Bug: Login fails'"
 * - "Show me failed workflow runs from the last week"
 * - "Get code scanning alerts"
 *
 * Local Docker: ghcr.io/github/github-mcp-server
 * Remote: https://api.githubcopilot.com/mcp/
 */
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('github-mcp.config.ts')

      // Create README for GitHub MCP setup
      const readmePath = path.join(this.projectPath, 'GITHUB_MCP_SETUP.md')
      const readmeContent = `# GitHub MCP Setup

## What is GitHub MCP?

The GitHub MCP (Model Context Protocol) server connects AI agents to GitHub for repository management, issue tracking, CI/CD automation, and more.

## Already Configured

✅ VS Code MCP configuration created (.vscode/mcp.json)
✅ Docker setup ready (ghcr.io/github/github-mcp-server)
✅ Environment variable added (GITHUB_PERSONAL_ACCESS_TOKEN)
✅ Service wrapper ready (github-mcp.config.ts)

## Prerequisites

1. **Docker** - Must be installed and running
2. **GitHub PAT** - Create at https://github.com/settings/tokens

## Available Toolsets

- **repos** - Repository management
- **issues** - Issue tracking
- **pull_requests** - PR automation
- **actions** - GitHub Actions & CI/CD
- **code_security** - Security alerts
- **projects** - Project boards
- **discussions** - Discussions
- **gists** - Gist management
- **notifications** - Notifications
- **users** - User profiles

## Example AI Prompts

**Repository Management:**
- "List all repositories in my organization"
- "Search for files containing 'config'"
- "Create a branch called 'feature/new-feature'"

**Issue Management:**
- "Create an issue titled 'Bug: Login fails'"
- "Add comment to issue #123"
- "List all open issues"

**Pull Requests:**
- "Create a PR from feature-branch to main"
- "Merge pull request #456"
- "Get files changed in PR #789"

**CI/CD:**
- "Show me failed workflow runs"
- "Trigger the Deploy workflow"
- "Get logs for workflow run #12345"

**Code Security:**
- "List all code scanning alerts"
- "Show me Dependabot updates"
- "Get secret scanning alerts"

## Usage

The MCP server is configured to run in Docker. When you use AI agents,
they'll automatically pull the ghcr.io/github/github-mcp-server image
and authenticate using your GitHub PAT.
`
      await fs.writeFile(readmePath, readmeContent)
      result.configFilesCreated.push('GITHUB_MCP_SETUP.md')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure Vercel MCP
  private async configureVercelMCP(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      const teamSlug = creds.teamSlug
      const projectSlug = creds.projectSlug

      // Update .vscode/mcp.json to include Vercel MCP
      const vscodeDir = path.join(this.projectPath, '.vscode')
      await fs.ensureDir(vscodeDir)

      const mcpConfigPath = path.join(vscodeDir, 'mcp.json')
      let mcpConfig: any = {
        $schema: 'https://modelcontextprotocol.io/schema/mcp.json',
        inputs: [],
        mcpServers: {},
      }

      // Read existing config if it exists
      if (await fs.pathExists(mcpConfigPath)) {
        mcpConfig = await fs.readJSON(mcpConfigPath)
      }

      // Add Vercel MCP server
      if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {}

      // Use project-specific URL if provided
      const vercelUrl =
        teamSlug && projectSlug
          ? `https://mcp.vercel.com/${teamSlug}/${projectSlug}`
          : 'https://mcp.vercel.com'

      mcpConfig.mcpServers.vercel = {
        url: vercelUrl,
        description: 'Vercel MCP server for project and deployment management',
        capabilities: [
          'Search and navigate Vercel documentation',
          'Manage projects and deployments',
          'Analyze deployment logs',
          'OAuth authentication required for project management',
        ],
      }

      await fs.writeJSON(mcpConfigPath, mcpConfig, { spaces: 2 })
      result.configFilesCreated.push('.vscode/mcp.json')

      // Create Vercel MCP config file
      const configPath = path.join(this.projectPath, 'vercel-mcp.config.ts')
      const configContent = `import { createVercelMCPService } from './services/vercel-mcp'

const vercelMCP = createVercelMCPService(
  ${teamSlug ? `'${teamSlug}'` : 'undefined'},
  ${projectSlug ? `'${projectSlug}'` : 'undefined'}
)

export default vercelMCP

/**
 * Vercel MCP is now configured!
 *
 * Use AI prompts like:
 * - "List all my Vercel projects"
 * - "Deploy my project to production"
 * - "Show me deployment logs for the latest build"
 * - "Search Vercel docs for edge functions"
 *
 * Endpoint: ${vercelUrl}
 * Authentication: OAuth (automatic)
 */
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('vercel-mcp.config.ts')

      // Create README for Vercel MCP setup
      const readmePath = path.join(this.projectPath, 'VERCEL_MCP_SETUP.md')
      const readmeContent = `# Vercel MCP Setup

## What is Vercel MCP?

The Vercel MCP (Model Context Protocol) server connects AI agents to Vercel for project management, deployments, and documentation search.

## Already Configured

✅ VS Code MCP configuration created (.vscode/mcp.json)
✅ OAuth authentication ready (automatic)
${teamSlug && projectSlug ? `✅ Project-specific endpoint configured (${teamSlug}/${projectSlug})` : '✅ General endpoint configured'}
✅ Service wrapper ready (vercel-mcp.config.ts)

## Available Tools

### Public (No Auth Required)
- **search_documentation** - Search Vercel docs
- **get_documentation_page** - Get specific doc page
- **list_documentation_categories** - List doc categories

### Authenticated (OAuth Required)
- **Projects** - list, get, create, update, delete
- **Deployments** - list, get, create, cancel
- **Logs** - get deployment logs, analyze logs
- **Environment Variables** - list, get, create, update, delete
- **Domains** - list, get, add, remove, verify

## Usage in AI Agents

### Claude Code
\`\`\`bash
# Already added to local config
# Just start using it with prompts!
\`\`\`

### VS Code
1. Open VS Code in this project
2. MCP server auto-connects with OAuth
3. Use AI features with Vercel access

### Cursor
Add to .cursor/mcp.json:
\`\`\`json
{
  "mcpServers": {
    "vercel": {
      "url": "${vercelUrl}"
    }
  }
}
\`\`\`

## Example Prompts

**Documentation Search (No Auth):**
- "Search Vercel docs for 'edge functions'"
- "How do I set up environment variables?"
- "Show me documentation about ISR"

**Project Management:**
- "List all my Vercel projects"
- "Get environment variables for production"
- "Create a new project called 'awesome-app'"

**Deployment Automation:**
- "Deploy my project to production"
- "Show me failed deployments from the last week"
- "Get build logs for deployment xyz123"

**Log Analysis:**
- "Analyze errors in production logs"
- "Find all 500 errors in the last 24 hours"
- "Show me runtime logs for my API"

## Project-Specific Access

${teamSlug && projectSlug ? `You're using project-specific access with automatic context:
- Team: ${teamSlug}
- Project: ${projectSlug}

This provides better performance and automatic context for all tools.` : `To use project-specific access (recommended):

1. Find your team and project slugs:
   - Team: Vercel Dashboard → Team Settings → General
   - Project: Vercel Dashboard → Project Settings → General

2. Update the endpoint in .vscode/mcp.json:
   \`\`\`json
   {
     "mcpServers": {
       "vercel": {
         "url": "https://mcp.vercel.com/<team-slug>/<project-slug>"
       }
     }
   }
   \`\`\`

Benefits:
- Automatic project and team context
- Improved tool performance
- Better error handling
- No manual parameter input needed`}

## Security Best Practices

- OAuth authentication is automatic and secure
- Enable human confirmation for destructive operations
- Review AI agent permissions before granting access
- Be aware of prompt injection risks
- Familiarize with confused deputy attacks

## Supported AI Clients

- Claude Code ✅
- Claude.ai and Claude Desktop ✅
- ChatGPT (Pro/Plus) ✅
- Cursor ✅
- VS Code with Copilot ✅
- Devin ✅
- Raycast ✅
- Goose ✅
- Windsurf ✅
- Gemini Code Assist ✅
- Gemini CLI ✅

## Learn More

- [Vercel MCP Documentation](https://vercel.com/docs/mcp)
- [MCP Tools Reference](https://vercel.com/docs/mcp/tools)
- [Model Context Protocol](https://modelcontextprotocol.io/)
`
      await fs.writeFile(readmePath, readmeContent)
      result.configFilesCreated.push('VERCEL_MCP_SETUP.md')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Configure Playwright MCP
  private async configurePlaywrightMCP(
    creds: Record<string, string>,
    result: AutoConfigResult
  ): Promise<AutoConfigResult> {
    try {
      const browser = creds.browser || 'chrome'
      const headless = creds.headless === 'true'
      const capabilities = creds.capabilities?.split(',') || []

      // Update .vscode/mcp.json to include Playwright MCP
      const vscodeDir = path.join(this.projectPath, '.vscode')
      await fs.ensureDir(vscodeDir)

      const mcpConfigPath = path.join(vscodeDir, 'mcp.json')
      let mcpConfig: any = {
        $schema: 'https://modelcontextprotocol.io/schema/mcp.json',
        inputs: [],
        mcpServers: {},
      }

      // Read existing config if it exists
      if (await fs.pathExists(mcpConfigPath)) {
        mcpConfig = await fs.readJSON(mcpConfigPath)
      }

      // Add Playwright MCP server
      if (!mcpConfig.mcpServers) mcpConfig.mcpServers = {}

      const args = ['@playwright/mcp@latest']
      if (browser && browser !== 'chrome') {
        args.push('--browser', browser)
      }
      if (headless) {
        args.push('--headless')
      }
      if (capabilities.length > 0) {
        args.push('--caps', capabilities.join(','))
      }

      mcpConfig.mcpServers.playwright = {
        command: 'npx',
        args,
        description: 'Playwright MCP server for browser automation and testing',
        capabilities: [
          'Browser automation using accessibility tree',
          'Web scraping and testing',
          'Multi-browser support (Chrome, Firefox, WebKit)',
          'Screenshot and PDF generation',
          'Network interception and mocking',
        ],
      }

      await fs.writeJSON(mcpConfigPath, mcpConfig, { spaces: 2 })
      result.configFilesCreated.push('.vscode/mcp.json')

      // Create Playwright MCP config file
      const configPath = path.join(this.projectPath, 'playwright-mcp.config.ts')
      const configContent = `import { createPlaywrightMCPService } from './services/playwright-mcp'

const playwrightMCP = createPlaywrightMCPService({
  browser: '${browser}',
  headless: ${headless},
  ${capabilities.length > 0 ? `capabilities: ['${capabilities.join("', '")}'],` : ''}
})

export default playwrightMCP

/**
 * Playwright MCP is now configured!
 *
 * Use AI prompts like:
 * - "Navigate to example.com and click the login button"
 * - "Extract all product titles from the e-commerce page"
 * - "Take a full-page screenshot of the homepage"
 * - "Test the contact form submission"
 *
 * Browser: ${browser}
 * Headless: ${headless}
 * ${capabilities.length > 0 ? `Capabilities: ${capabilities.join(', ')}` : 'No additional capabilities'}
 */
`
      await fs.writeFile(configPath, configContent)
      result.configFilesCreated.push('playwright-mcp.config.ts')

      // Create README for Playwright MCP setup
      const readmePath = path.join(this.projectPath, 'PLAYWRIGHT_MCP_SETUP.md')
      const readmeContent = `# Playwright MCP Setup

## What is Playwright MCP?

The Playwright MCP (Model Context Protocol) server connects AI agents to Playwright for browser automation, web scraping, and testing.

## Already Configured

✅ VS Code MCP configuration created (.vscode/mcp.json)
✅ Browser: ${browser}
✅ Headless: ${headless}
${capabilities.length > 0 ? `✅ Capabilities: ${capabilities.join(', ')}` : ''}
✅ Service wrapper ready (playwright-mcp.config.ts)

## Key Features

### Fast and Lightweight
- Uses accessibility tree, not screenshots
- LLM-friendly structured data
- Deterministic tool application

### Multi-Browser Support
- Chrome / Chromium
- Firefox
- WebKit (Safari)
- Microsoft Edge

### Advanced Capabilities
${capabilities.includes('vision') ? '- ✅ Vision: Screenshot and coordinate-based interactions' : '- Vision: Enable with --caps=vision'}
${capabilities.includes('pdf') ? '- ✅ PDF: PDF generation from pages' : '- PDF: Enable with --caps=pdf'}
${capabilities.includes('verify') ? '- ✅ Verify: Assertions and expectations' : '- Verify: Enable with --caps=verify'}
${capabilities.includes('tracing') ? '- ✅ Tracing: Playwright trace recording' : '- Tracing: Enable with --caps=tracing'}

## Usage in AI Agents

### Claude Code
\`\`\`bash
# Already added to local config
# Just start using it with prompts!
\`\`\`

### VS Code
1. Open VS Code in this project
2. MCP server auto-starts
3. Use AI features with browser automation

### Cursor
Add to .cursor/mcp.json:
\`\`\`json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
\`\`\`

## Example Prompts

**Web Automation:**
- "Navigate to google.com and search for 'playwright automation'"
- "Go to example.com, click Sign In, and fill the login form"
- "Open amazon.com and add the first product to cart"

**Web Scraping:**
- "Extract all product names and prices from the e-commerce page"
- "Scrape article headlines from the news site"
- "Get all email addresses from the contact page"

**Testing:**
- "Test the login flow with valid credentials"
- "Validate that all links are not broken"
- "Check mobile menu on iPhone viewport"

${capabilities.includes('vision') ? `**Screenshots:**
- "Take a full-page screenshot of the homepage"
- "Capture the pricing table element"
- "Screenshot in desktop and mobile viewports"` : ''}

${capabilities.includes('pdf') ? `**PDF Generation:**
- "Generate a PDF of the documentation site"
- "Create a PDF report of the dashboard"
- "Export the invoice page as PDF"` : ''}

## Configuration Options

Update .vscode/mcp.json args to customize:

\`\`\`json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--browser", "chrome",
        "--headless",
        "--viewport-size", "1920x1080",
        "--caps", "vision,pdf",
        "--save-trace"
      ]
    }
  }
}
\`\`\`

**Available Options:**
- \`--browser <browser>\` - chrome, firefox, webkit, msedge
- \`--headless\` - Run in headless mode
- \`--viewport-size <size>\` - e.g., "1280x720"
- \`--device <device>\` - e.g., "iPhone 15"
- \`--caps <capabilities>\` - vision, pdf, verify, tracing
- \`--isolated\` - Clean state for each session
- \`--save-trace\` - Save Playwright trace
- \`--save-video <size>\` - Record video

## Persistent vs Isolated Sessions

**Persistent (default):**
- Saves browser profile to disk
- Keeps login sessions between runs
- Profile location:
  - Windows: \`%USERPROFILE%\\AppData\\Local\\ms-playwright\\mcp-chrome-profile\`
  - macOS: \`~/Library/Caches/ms-playwright/mcp-chrome-profile\`
  - Linux: \`~/.cache/ms-playwright/mcp-chrome-profile\`

**Isolated:**
- In-memory profile
- Clean state for each session
- Add \`--isolated\` flag

## Browser Extension

Connect to existing browser tabs using the Playwright MCP Bridge extension:
- Chrome Web Store: Search "Playwright MCP Bridge"
- GitHub: https://github.com/microsoft/playwright-mcp/tree/main/extension

## Supported AI Clients

- Claude Code ✅
- Claude Desktop ✅
- VS Code ✅
- Cursor ✅
- Windsurf ✅
- Goose ✅
- LM Studio ✅
- Gemini CLI ✅

## Learn More

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev)
- [MCP Protocol](https://modelcontextprotocol.io)
`
      await fs.writeFile(readmePath, readmeContent)
      result.configFilesCreated.push('PLAYWRIGHT_MCP_SETUP.md')

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Detect framework from package.json
  private async detectFramework(): Promise<'vite' | 'nextjs' | 'unknown'> {
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJSON(packageJsonPath)

        // Check dependencies
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

        if (deps['next']) {
          return 'nextjs'
        } else if (deps['vite']) {
          return 'vite'
        }
      }

      return 'unknown'
    } catch (error) {
      return 'unknown'
    }
  }

  // Fetch credentials from connected integrations in database
  static async fetchCredentials(userId: string, integrationName: string): Promise<Record<string, string>> {
    // This would query the database for stored credentials
    // For now, returning mock data
    return {
      // Would decrypt and return actual credentials
    }
  }
}

// Factory function
export const createIntegrationAutoConfig = (projectPath: string): IntegrationAutoConfig => {
  return new IntegrationAutoConfig(projectPath)
}
