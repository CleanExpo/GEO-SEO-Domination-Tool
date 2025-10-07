import Handlebars from 'handlebars'
import fs from 'fs-extra'
import path from 'path'

export interface TemplateVariable {
  key: string
  value: string | number | boolean
}

export interface TemplateFile {
  sourcePath: string
  targetPath: string
  isTemplate: boolean
}

export interface TemplateConfig {
  name: string
  variables: Record<string, any>
  features: string[]
  integrations: string[]
}

export class TemplateEngine {
  private templatesBasePath: string
  private handlebars: typeof Handlebars

  constructor(templatesBasePath: string = './templates') {
    this.templatesBasePath = templatesBasePath
    this.handlebars = Handlebars.create()
    this.registerHelpers()
  }

  // Register custom Handlebars helpers
  private registerHelpers() {
    // Convert to PascalCase
    this.handlebars.registerHelper('pascalCase', (str: string) => {
      return str
        .split(/[-_\s]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')
    })

    // Convert to camelCase
    this.handlebars.registerHelper('camelCase', (str: string) => {
      const pascal = str
        .split(/[-_\s]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')
      return pascal.charAt(0).toLowerCase() + pascal.slice(1)
    })

    // Convert to kebab-case
    this.handlebars.registerHelper('kebabCase', (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase()
    })

    // Convert to snake_case
    this.handlebars.registerHelper('snakeCase', (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase()
    })

    // Conditional feature check
    this.handlebars.registerHelper('hasFeature', (feature: string, features: string[], options: any) => {
      return features.includes(feature) ? options.fn(this) : options.inverse(this)
    })

    // Conditional integration check
    this.handlebars.registerHelper('hasIntegration', (integration: string, integrations: string[], options: any) => {
      return integrations.includes(integration) ? options.fn(this) : options.inverse(this)
    })

    // JSON stringify
    this.handlebars.registerHelper('json', (context: any) => {
      return JSON.stringify(context, null, 2)
    })

    // Current year
    this.handlebars.registerHelper('currentYear', () => {
      return new Date().getFullYear()
    })
  }

  // Load template from file
  async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = path.join(this.templatesBasePath, templatePath)
    return await fs.readFile(fullPath, 'utf-8')
  }

  // Compile and render template
  render(templateContent: string, variables: Record<string, any>): string {
    const template = this.handlebars.compile(templateContent)
    return template(variables)
  }

  // Process a template file
  async processTemplateFile(
    sourceFile: string,
    targetFile: string,
    variables: Record<string, any>
  ): Promise<void> {
    const content = await this.loadTemplate(sourceFile)
    const rendered = this.render(content, variables)
    await fs.outputFile(targetFile, rendered)
  }

  // Copy directory structure with template processing
  async processTemplateDirectory(
    templateDir: string,
    targetDir: string,
    config: TemplateConfig
  ): Promise<void> {
    const sourcePath = path.join(this.templatesBasePath, templateDir)

    // Ensure source exists
    const exists = await fs.pathExists(sourcePath)
    if (!exists) {
      throw new Error(`Template directory not found: ${sourcePath}`)
    }

    await this.copyDirectoryRecursive(sourcePath, targetDir, config)
  }

  // Recursive directory copy with template processing
  private async copyDirectoryRecursive(
    source: string,
    target: string,
    config: TemplateConfig
  ): Promise<void> {
    await fs.ensureDir(target)

    const entries = await fs.readdir(source, { withFileTypes: true })

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name)
      let targetPath = path.join(target, entry.name)

      // Process filename as template if it contains {{}}
      if (entry.name.includes('{{')) {
        const processedName = this.render(entry.name, config.variables)
        targetPath = path.join(target, processedName)
      }

      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (this.shouldSkipDirectory(entry.name)) {
          continue
        }
        await this.copyDirectoryRecursive(sourcePath, targetPath, config)
      } else {
        // Process file
        if (this.isTemplateFile(entry.name)) {
          // Process as template
          const content = await fs.readFile(sourcePath, 'utf-8')
          const rendered = this.render(content, {
            ...config.variables,
            features: config.features,
            integrations: config.integrations,
          })
          await fs.writeFile(targetPath, rendered)
        } else {
          // Copy as-is (binary files, etc.)
          await fs.copy(sourcePath, targetPath)
        }
      }
    }
  }

  // Check if file should be processed as template
  private isTemplateFile(filename: string): boolean {
    const textExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt',
      '.html', '.css', '.scss', '.sass', '.less',
      '.yml', '.yaml', '.toml', '.env', '.env.example',
      '.py', '.rb', '.go', '.rs', '.java', '.kt',
      '.vue', '.svelte', '.astro',
      '.sh', '.bash', '.zsh',
      '.gitignore', '.eslintrc', '.prettierrc'
    ]

    return textExtensions.some(ext => filename.endsWith(ext)) ||
           filename.includes('.template')
  }

  // Check if directory should be skipped
  private shouldSkipDirectory(dirname: string): boolean {
    const skipDirs = [
      'node_modules',
      '.git',
      '.next',
      '.nuxt',
      'dist',
      'build',
      '__pycache__',
      '.venv',
      'venv',
      '.DS_Store'
    ]
    return skipDirs.includes(dirname)
  }

  // Generate environment file
  async generateEnvFile(
    targetPath: string,
    envVariables: Record<string, string>,
    mode: 'development' | 'production' = 'development'
  ): Promise<void> {
    const envContent = Object.entries(envVariables)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    const filename = mode === 'development' ? '.env.development' : '.env.production'
    await fs.writeFile(path.join(targetPath, filename), envContent)

    // Also create .env.example
    const exampleContent = Object.keys(envVariables)
      .map(key => `${key}=`)
      .join('\n')
    await fs.writeFile(path.join(targetPath, '.env.example'), exampleContent)
  }

  // Generate package.json
  async generatePackageJson(
    targetPath: string,
    config: {
      name: string
      version?: string
      description?: string
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
      scripts?: Record<string, string>
    }
  ): Promise<void> {
    const packageJson = {
      name: config.name,
      version: config.version || '0.1.0',
      description: config.description || '',
      private: true,
      scripts: config.scripts || {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: config.dependencies || {},
      devDependencies: config.devDependencies || {},
    }

    await fs.writeJSON(
      path.join(targetPath, 'package.json'),
      packageJson,
      { spaces: 2 }
    )
  }

  // Create README.md
  async generateReadme(
    targetPath: string,
    config: {
      projectName: string
      description: string
      features: string[]
      integrations: string[]
      setup?: string[]
    }
  ): Promise<void> {
    const readmeTemplate = `# ${config.projectName}

${config.description}

## Features

${config.features.map(f => `- ${f}`).join('\n')}

## Integrations

${config.integrations.map(i => `- ${i}`).join('\n')}

## Setup

${config.setup?.map((s, i) => `${i + 1}. ${s}`).join('\n') || '1. Install dependencies: `npm install`\n2. Run dev server: `npm run dev`'}

## Generated with

🤖 GEO-SEO Domination Tool - Project Generator
`

    await fs.writeFile(path.join(targetPath, 'README.md'), readmeTemplate)
  }

  // Generate .gitignore
  async generateGitignore(
    targetPath: string,
    additional: string[] = []
  ): Promise<void> {
    const defaultIgnores = [
      'node_modules/',
      'dist/',
      'build/',
      '.env',
      '.env.local',
      '.env.*.local',
      '*.log',
      '.DS_Store',
      'coverage/',
      '.vscode/',
      '.idea/',
    ]

    const allIgnores = [...new Set([...defaultIgnores, ...additional])]
    const content = allIgnores.join('\n')

    await fs.writeFile(path.join(targetPath, '.gitignore'), content)
  }
}

// Factory function
export const createTemplateEngine = (templatesBasePath?: string): TemplateEngine => {
  return new TemplateEngine(templatesBasePath)
}
