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
