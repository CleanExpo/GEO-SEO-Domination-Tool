import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs-extra'

const execAsync = promisify(exec)

export interface ShadcnSetupConfig {
  projectPath: string
  baseColor?: 'neutral' | 'slate' | 'stone' | 'gray' | 'zinc'
  cssVariables?: boolean
  components?: string[]
}

export interface ShadcnSetupResult {
  success: boolean
  componentsAdded: string[]
  filesCreated: string[]
  errors: string[]
}

export class ShadcnSetup {
  // Setup shadcn/ui for a React + Vite project
  async setupShadcn(config: ShadcnSetupConfig): Promise<ShadcnSetupResult> {
    const result: ShadcnSetupResult = {
      success: false,
      componentsAdded: [],
      filesCreated: [],
      errors: [],
    }

    try {
      // Step 1: Update package.json dependencies
      await this.installDependencies(config.projectPath, result)

      // Step 2: Update tsconfig files
      await this.updateTsConfig(config.projectPath, result)

      // Step 3: Update vite.config.ts
      await this.updateViteConfig(config.projectPath, result)

      // Step 4: Update src/index.css
      await this.updateIndexCSS(config.projectPath, result)

      // Step 5: Create components.json
      await this.createComponentsJson(config, result)

      // Step 6: Create lib/utils.ts
      await this.createUtilsFile(config.projectPath, result)

      // Step 7: Install initial components
      if (config.components && config.components.length > 0) {
        await this.installComponents(config.projectPath, config.components, result)
      }

      result.success = true
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  // Install required dependencies
  private async installDependencies(projectPath: string, result: ShadcnSetupResult): Promise<void> {
    const dependencies = [
      'tailwindcss',
      '@tailwindcss/vite',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'lucide-react',
    ]

    const devDependencies = ['@types/node']

    try {
      // Read package.json
      const packageJsonPath = path.join(projectPath, 'package.json')
      const packageJson = await fs.readJSON(packageJsonPath)

      // Add dependencies
      if (!packageJson.dependencies) packageJson.dependencies = {}
      if (!packageJson.devDependencies) packageJson.devDependencies = {}

      for (const dep of dependencies) {
        if (!packageJson.dependencies[dep]) {
          packageJson.dependencies[dep] = 'latest'
        }
      }

      for (const dep of devDependencies) {
        if (!packageJson.devDependencies[dep]) {
          packageJson.devDependencies[dep] = 'latest'
        }
      }

      await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 })
      result.filesCreated.push('package.json (updated)')
    } catch (error) {
      result.errors.push(`Failed to update dependencies: ${error}`)
    }
  }

  // Update tsconfig.json
  private async updateTsConfig(projectPath: string, result: ShadcnSetupResult): Promise<void> {
    try {
      const tsconfigPath = path.join(projectPath, 'tsconfig.json')
      const tsconfig = await fs.readJSON(tsconfigPath)

      if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {}

      tsconfig.compilerOptions.baseUrl = '.'
      tsconfig.compilerOptions.paths = {
        '@/*': ['./src/*'],
      }

      await fs.writeJSON(tsconfigPath, tsconfig, { spaces: 2 })
      result.filesCreated.push('tsconfig.json (updated)')

      // Update tsconfig.app.json if it exists
      const tsconfigAppPath = path.join(projectPath, 'tsconfig.app.json')
      if (await fs.pathExists(tsconfigAppPath)) {
        const tsconfigApp = await fs.readJSON(tsconfigAppPath)

        if (!tsconfigApp.compilerOptions) tsconfigApp.compilerOptions = {}

        tsconfigApp.compilerOptions.baseUrl = '.'
        tsconfigApp.compilerOptions.paths = {
          '@/*': ['./src/*'],
        }

        await fs.writeJSON(tsconfigAppPath, tsconfigApp, { spaces: 2 })
        result.filesCreated.push('tsconfig.app.json (updated)')
      }
    } catch (error) {
      result.errors.push(`Failed to update tsconfig: ${error}`)
    }
  }

  // Update vite.config.ts
  private async updateViteConfig(projectPath: string, result: ShadcnSetupResult): Promise<void> {
    const viteConfigPath = path.join(projectPath, 'vite.config.ts')

    const viteConfig = `import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
`

    try {
      await fs.writeFile(viteConfigPath, viteConfig)
      result.filesCreated.push('vite.config.ts')
    } catch (error) {
      result.errors.push(`Failed to update vite.config.ts: ${error}`)
    }
  }

  // Update src/index.css
  private async updateIndexCSS(projectPath: string, result: ShadcnSetupResult): Promise<void> {
    const indexCSSPath = path.join(projectPath, 'src', 'index.css')

    const indexCSS = `@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`

    try {
      await fs.writeFile(indexCSSPath, indexCSS)
      result.filesCreated.push('src/index.css')
    } catch (error) {
      result.errors.push(`Failed to update src/index.css: ${error}`)
    }
  }

  // Create components.json
  private async createComponentsJson(config: ShadcnSetupConfig, result: ShadcnSetupResult): Promise<void> {
    const componentsJson = {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: config.baseColor || 'neutral',
      rsc: false,
      tsx: true,
      tailwind: {
        config: 'tailwind.config.ts',
        css: 'src/index.css',
        baseColor: config.baseColor || 'neutral',
        cssVariables: config.cssVariables ?? true,
      },
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
      },
    }

    try {
      await fs.writeJSON(path.join(config.projectPath, 'components.json'), componentsJson, { spaces: 2 })
      result.filesCreated.push('components.json')
    } catch (error) {
      result.errors.push(`Failed to create components.json: ${error}`)
    }
  }

  // Create lib/utils.ts
  private async createUtilsFile(projectPath: string, result: ShadcnSetupResult): Promise<void> {
    const utilsContent = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`

    try {
      const utilsPath = path.join(projectPath, 'src', 'lib', 'utils.ts')
      await fs.ensureDir(path.dirname(utilsPath))
      await fs.writeFile(utilsPath, utilsContent)
      result.filesCreated.push('src/lib/utils.ts')
    } catch (error) {
      result.errors.push(`Failed to create utils.ts: ${error}`)
    }
  }

  // Install shadcn components
  private async installComponents(projectPath: string, components: string[], result: ShadcnSetupResult): Promise<void> {
    try {
      for (const component of components) {
        try {
          const { stdout } = await execAsync(
            `npx shadcn@latest add ${component} --yes`,
            { cwd: projectPath }
          )
          result.componentsAdded.push(component)
        } catch (error) {
          result.errors.push(`Failed to install component ${component}: ${error}`)
        }
      }
    } catch (error) {
      result.errors.push(`Component installation error: ${error}`)
    }
  }

  // Get list of available shadcn components
  getAvailableComponents(): string[] {
    return [
      'button',
      'card',
      'input',
      'label',
      'select',
      'textarea',
      'dialog',
      'dropdown-menu',
      'popover',
      'tooltip',
      'form',
      'table',
      'tabs',
      'accordion',
      'alert',
      'badge',
      'checkbox',
      'radio-group',
      'switch',
      'slider',
      'progress',
      'avatar',
      'separator',
      'skeleton',
      'toast',
      'sheet',
      'navigation-menu',
      'command',
      'calendar',
      'date-picker',
    ]
  }
}

// Factory function
export const createShadcnSetup = (): ShadcnSetup => {
  return new ShadcnSetup()
}
