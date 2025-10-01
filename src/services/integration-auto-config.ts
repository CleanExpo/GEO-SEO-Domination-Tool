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

      const setupResult = await shadcnSetup.setupShadcn({
        projectPath: this.projectPath,
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
