import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs-extra'
import { EventEmitter } from 'events'
import { createTemplateEngine, TemplateEngine } from './template-engine'

const execAsync = promisify(exec)

export interface ProjectConfig {
  name: string
  slug: string
  outputPath: string
  templateId: string
  features: string[]
  integrations: string[]
  variables: Record<string, any>
  idePreference?: 'vscode' | 'cursor' | 'webstorm' | 'none'
}

export interface GenerationStep {
  name: string
  order: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: Date
  completedAt?: Date
  output?: string
  error?: string
}

export interface GenerationProgress {
  currentStep: string
  percentage: number
  steps: GenerationStep[]
  status: 'pending' | 'generating' | 'completed' | 'failed'
}

export class ProjectScaffolder extends EventEmitter {
  private templateEngine: TemplateEngine
  private currentProgress: GenerationProgress

  constructor() {
    super()
    this.templateEngine = createTemplateEngine('./templates')
    this.currentProgress = {
      currentStep: '',
      percentage: 0,
      steps: [],
      status: 'pending',
    }
  }

  // Main generation function
  async generateProject(config: ProjectConfig): Promise<string> {
    this.emit('progress', { message: 'Starting project generation...', percentage: 0 })

    const steps: GenerationStep[] = [
      { name: 'create_folder', order: 1, status: 'pending' },
      { name: 'generate_files', order: 2, status: 'pending' },
      { name: 'generate_env', order: 3, status: 'pending' },
      { name: 'install_dependencies', order: 4, status: 'pending' },
      { name: 'configure_integrations', order: 5, status: 'pending' },
      { name: 'migrate_database', order: 6, status: 'pending' },
      { name: 'initialize_git', order: 7, status: 'pending' },
      { name: 'open_ide', order: 8, status: 'pending' },
    ]

    this.currentProgress = {
      currentStep: '',
      percentage: 0,
      steps,
      status: 'generating',
    }

    try {
      // Step 1: Create project folder
      await this.executeStep(steps[0], async () => {
        await this.createProjectFolder(config)
      })

      // Step 2: Generate files from template
      await this.executeStep(steps[1], async () => {
        await this.generateFiles(config)
      })

      // Step 3: Generate environment files
      await this.executeStep(steps[2], async () => {
        await this.generateEnvironmentFiles(config)
      })

      // Step 4: Install dependencies
      await this.executeStep(steps[3], async () => {
        await this.installDependencies(config)
      })

      // Step 5: Configure integrations
      await this.executeStep(steps[4], async () => {
        await this.configureIntegrations(config)
      })

      // Step 6: Run database migrations (if needed)
      if (config.integrations.includes('supabase') || config.integrations.includes('database')) {
        await this.executeStep(steps[5], async () => {
          await this.runDatabaseMigrations(config)
        })
      } else {
        steps[5].status = 'skipped'
      }

      // Step 7: Initialize git repository
      await this.executeStep(steps[6], async () => {
        await this.initializeGit(config)
      })

      // Step 8: Open in IDE
      if (config.idePreference && config.idePreference !== 'none') {
        await this.executeStep(steps[7], async () => {
          await this.openInIDE(config)
        })
      } else {
        steps[7].status = 'skipped'
      }

      this.currentProgress.status = 'completed'
      this.currentProgress.percentage = 100
      this.emit('completed', { path: config.outputPath })

      return config.outputPath
    } catch (error) {
      this.currentProgress.status = 'failed'
      this.emit('failed', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  // Execute a generation step
  private async executeStep(step: GenerationStep, action: () => Promise<void>): Promise<void> {
    step.status = 'running'
    step.startedAt = new Date()
    this.currentProgress.currentStep = step.name

    const stepIndex = this.currentProgress.steps.findIndex(s => s.name === step.name)
    this.currentProgress.percentage = Math.floor(((stepIndex + 0.5) / this.currentProgress.steps.length) * 100)

    this.emit('progress', {
      step: step.name,
      percentage: this.currentProgress.percentage,
    })

    try {
      await action()
      step.status = 'completed'
      step.completedAt = new Date()

      this.currentProgress.percentage = Math.floor(((stepIndex + 1) / this.currentProgress.steps.length) * 100)
      this.emit('step-completed', { step: step.name })
    } catch (error) {
      step.status = 'failed'
      step.error = error instanceof Error ? error.message : String(error)
      throw error
    }
  }

  // Step 1: Create project folder
  private async createProjectFolder(config: ProjectConfig): Promise<void> {
    const fullPath = path.resolve(config.outputPath)
    await fs.ensureDir(fullPath)
    this.emit('log', `Created project folder: ${fullPath}`)
  }

  // Step 2: Generate files from template
  private async generateFiles(config: ProjectConfig): Promise<void> {
    await this.templateEngine.processTemplateDirectory(
      config.templateId,
      config.outputPath,
      {
        name: config.name,
        variables: config.variables,
        features: config.features,
        integrations: config.integrations,
      }
    )

    // Generate README
    await this.templateEngine.generateReadme(config.outputPath, {
      projectName: config.name,
      description: config.variables.description || `Generated project: ${config.name}`,
      features: config.features,
      integrations: config.integrations,
    })

    // Generate .gitignore
    await this.templateEngine.generateGitignore(config.outputPath)

    this.emit('log', 'Generated project files from template')
  }

  // Step 3: Generate environment files
  private async generateEnvironmentFiles(config: ProjectConfig): Promise<void> {
    const envVars: Record<string, string> = {}

    // Add integration-specific environment variables
    for (const integration of config.integrations) {
      const integrationVars = await this.getIntegrationEnvVars(integration, config)
      Object.assign(envVars, integrationVars)
    }

    // Add custom variables
    Object.assign(envVars, config.variables.envVars || {})

    await this.templateEngine.generateEnvFile(config.outputPath, envVars, 'development')
    this.emit('log', 'Generated environment files')
  }

  // Get environment variables for integration
  private async getIntegrationEnvVars(integration: string, config: ProjectConfig): Promise<Record<string, string>> {
    // This would fetch actual credentials from the database
    // For now, returning placeholders
    const vars: Record<string, string> = {}

    switch (integration) {
      case 'supabase':
        vars.SUPABASE_URL = config.variables.supabaseUrl || 'your-project.supabase.co'
        vars.SUPABASE_ANON_KEY = config.variables.supabaseKey || 'your-anon-key'
        break
      case 'github':
        vars.GITHUB_TOKEN = config.variables.githubToken || 'your-github-token'
        break
      case 'openai':
        vars.OPENAI_API_KEY = config.variables.openaiKey || 'your-openai-key'
        break
      case 'anthropic':
        vars.ANTHROPIC_API_KEY = config.variables.anthropicKey || 'your-anthropic-key'
        break
      case 'vercel':
        vars.VERCEL_TOKEN = config.variables.vercelToken || 'your-vercel-token'
        break
    }

    return vars
  }

  // Step 4: Install dependencies
  private async installDependencies(config: ProjectConfig): Promise<void> {
    const cwd = config.outputPath

    this.emit('log', 'Installing dependencies... This may take a few minutes')

    try {
      // Check if package.json exists
      const packageJsonPath = path.join(cwd, 'package.json')
      const hasPackageJson = await fs.pathExists(packageJsonPath)

      if (hasPackageJson) {
        const { stdout, stderr } = await execAsync('npm install --no-audit --progress=false', { cwd })
        if (stdout) this.emit('log', stdout)
        if (stderr) this.emit('log', stderr)
      } else {
        this.emit('log', 'No package.json found, skipping npm install')
      }
    } catch (error) {
      this.emit('log', `Warning: Dependency installation had issues: ${error}`)
      // Don't fail the entire generation for this
    }
  }

  // Step 5: Configure integrations
  private async configureIntegrations(config: ProjectConfig): Promise<void> {
    for (const integration of config.integrations) {
      this.emit('log', `Configuring ${integration}...`)

      switch (integration) {
        case 'supabase':
          await this.configureSupabase(config)
          break
        case 'github':
          await this.configureGitHub(config)
          break
        // Add more integrations as needed
      }
    }

    this.emit('log', 'Integrations configured')
  }

  // Configure Supabase
  private async configureSupabase(config: ProjectConfig): Promise<void> {
    // Create Supabase config file
    const supabaseConfig = {
      projectUrl: config.variables.supabaseUrl,
      anonKey: config.variables.supabaseKey,
    }

    await fs.writeJSON(
      path.join(config.outputPath, 'supabase.config.json'),
      supabaseConfig,
      { spaces: 2 }
    )

    this.emit('log', 'Supabase configuration created')
  }

  // Configure GitHub
  private async configureGitHub(config: ProjectConfig): Promise<void> {
    // Create GitHub Actions workflow if needed
    if (config.features.includes('ci_cd')) {
      const workflowDir = path.join(config.outputPath, '.github', 'workflows')
      await fs.ensureDir(workflowDir)

      const workflow = `name: CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm test
`

      await fs.writeFile(path.join(workflowDir, 'ci.yml'), workflow)
      this.emit('log', 'GitHub Actions workflow created')
    }
  }

  // Step 6: Run database migrations
  private async runDatabaseMigrations(config: ProjectConfig): Promise<void> {
    const cwd = config.outputPath

    try {
      // Check if migration scripts exist
      const packageJson = await fs.readJSON(path.join(cwd, 'package.json'))

      if (packageJson.scripts?.migrate) {
        const { stdout } = await execAsync('npm run migrate', { cwd })
        this.emit('log', stdout)
      } else {
        this.emit('log', 'No migration script found, skipping')
      }
    } catch (error) {
      this.emit('log', `Warning: Database migration had issues: ${error}`)
    }
  }

  // Step 7: Initialize git
  private async initializeGit(config: ProjectConfig): Promise<void> {
    const cwd = config.outputPath

    try {
      await execAsync('git init', { cwd })
      await execAsync('git add .', { cwd })
      await execAsync('git commit -m "Initial commit - Generated by GEO-SEO Tool"', { cwd })
      this.emit('log', 'Git repository initialized')
    } catch (error) {
      this.emit('log', `Warning: Git initialization had issues: ${error}`)
    }
  }

  // Step 8: Open in IDE
  private async openInIDE(config: ProjectConfig): Promise<void> {
    const cwd = config.outputPath

    try {
      switch (config.idePreference) {
        case 'vscode':
          await execAsync(`code "${cwd}"`)
          this.emit('log', 'Opened in VS Code')
          break
        case 'cursor':
          await execAsync(`cursor "${cwd}"`)
          this.emit('log', 'Opened in Cursor')
          break
        case 'webstorm':
          await execAsync(`webstorm "${cwd}"`)
          this.emit('log', 'Opened in WebStorm')
          break
      }
    } catch (error) {
      this.emit('log', `Could not open IDE: ${error}`)
      this.emit('log', `You can manually open the project at: ${cwd}`)
    }
  }

  // Get current progress
  getProgress(): GenerationProgress {
    return this.currentProgress
  }
}

// Factory function
export const createProjectScaffolder = (): ProjectScaffolder => {
  return new ProjectScaffolder()
}
