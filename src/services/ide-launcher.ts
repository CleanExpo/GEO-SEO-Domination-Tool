import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs-extra'

const execAsync = promisify(exec)

export type IDEType = 'vscode' | 'cursor' | 'webstorm' | 'pycharm' | 'sublime' | 'atom'

export interface IDEConfig {
  type: IDEType
  projectPath: string
  settings?: Record<string, any>
  extensions?: string[]
  launchConfig?: Record<string, any>
}

export interface IDELaunchResult {
  success: boolean
  message: string
  configFilesCreated: string[]
  errors: string[]
}

export class IDELauncher {
  // Launch IDE with project
  async launchIDE(config: IDEConfig): Promise<IDELaunchResult> {
    const result: IDELaunchResult = {
      success: false,
      message: '',
      configFilesCreated: [],
      errors: [],
    }

    try {
      // Create IDE-specific config files
      await this.createIDEConfig(config, result)

      // Launch the IDE
      const launched = await this.openInIDE(config.type, config.projectPath)

      if (launched) {
        result.success = true
        result.message = `Successfully opened project in ${this.getIDEDisplayName(config.type)}`
      } else {
        result.errors.push(`Failed to launch ${config.type}`)
        result.message = `Could not launch ${this.getIDEDisplayName(config.type)}. You can manually open: ${config.projectPath}`
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
      result.message = `Error launching IDE: ${error}`
    }

    return result
  }

  // Create IDE-specific configuration files
  private async createIDEConfig(config: IDEConfig, result: IDELaunchResult): Promise<void> {
    switch (config.type) {
      case 'vscode':
      case 'cursor':
        await this.createVSCodeConfig(config, result)
        break
      case 'webstorm':
        await this.createWebStormConfig(config, result)
        break
      case 'pycharm':
        await this.createPyCharmConfig(config, result)
        break
    }
  }

  // Create VS Code / Cursor configuration
  private async createVSCodeConfig(config: IDEConfig, result: IDELaunchResult): Promise<void> {
    const vscodeDir = path.join(config.projectPath, '.vscode')
    await fs.ensureDir(vscodeDir)

    // settings.json
    const settings = {
      'editor.formatOnSave': true,
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': 'explicit',
      },
      'typescript.tsdk': 'node_modules/typescript/lib',
      'typescript.enablePromptUseWorkspaceTsdk': true,
      'files.exclude': {
        '**/.git': true,
        '**/node_modules': true,
        '**/dist': true,
        '**/.next': true,
      },
      ...config.settings,
    }

    await fs.writeJSON(path.join(vscodeDir, 'settings.json'), settings, { spaces: 2 })
    result.configFilesCreated.push('.vscode/settings.json')

    // extensions.json
    const recommendedExtensions = [
      'dbaeumer.vscode-eslint',
      'esbenp.prettier-vscode',
      'bradlc.vscode-tailwindcss',
      'usernamehw.errorlens',
      'christian-kohler.path-intellisense',
      'dsznajder.es7-react-js-snippets',
      ...config.extensions || [],
    ]

    await fs.writeJSON(
      path.join(vscodeDir, 'extensions.json'),
      { recommendations: recommendedExtensions },
      { spaces: 2 }
    )
    result.configFilesCreated.push('.vscode/extensions.json')

    // launch.json for debugging
    const launchConfig = {
      version: '0.2.0',
      configurations: [
        {
          type: 'node',
          request: 'launch',
          name: 'Launch Program',
          skipFiles: ['<node_internals>/**'],
          program: '${workspaceFolder}/src/index.ts',
          preLaunchTask: 'tsc: build - tsconfig.json',
          outFiles: ['${workspaceFolder}/dist/**/*.js'],
        },
        {
          type: 'chrome',
          request: 'launch',
          name: 'Launch Chrome',
          url: 'http://localhost:3000',
          webRoot: '${workspaceFolder}/src',
        },
        ...config.launchConfig?.configurations || [],
      ],
    }

    await fs.writeJSON(path.join(vscodeDir, 'launch.json'), launchConfig, { spaces: 2 })
    result.configFilesCreated.push('.vscode/launch.json')

    // tasks.json
    const tasks = {
      version: '2.0.0',
      tasks: [
        {
          type: 'npm',
          script: 'dev',
          problemMatcher: [],
          label: 'npm: dev',
          detail: 'vite',
        },
        {
          type: 'npm',
          script: 'build',
          problemMatcher: [],
          label: 'npm: build',
          detail: 'vite build',
        },
      ],
    }

    await fs.writeJSON(path.join(vscodeDir, 'tasks.json'), tasks, { spaces: 2 })
    result.configFilesCreated.push('.vscode/tasks.json')
  }

  // Create WebStorm configuration
  private async createWebStormConfig(config: IDEConfig, result: IDELaunchResult): Promise<void> {
    const ideaDir = path.join(config.projectPath, '.idea')
    await fs.ensureDir(ideaDir)

    // workspace.xml
    const workspace = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="PropertiesComponent">
    <property name="nodejs_interpreter_path" value="node" />
    <property name="nodejs_package_manager_path" value="npm" />
  </component>
</project>`

    await fs.writeFile(path.join(ideaDir, 'workspace.xml'), workspace)
    result.configFilesCreated.push('.idea/workspace.xml')
  }

  // Create PyCharm configuration
  private async createPyCharmConfig(config: IDEConfig, result: IDELaunchResult): Promise<void> {
    const ideaDir = path.join(config.projectPath, '.idea')
    await fs.ensureDir(ideaDir)

    // Configure Python interpreter
    const workspace = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectRootManager" version="2" project-jdk-name="Python 3.11" project-jdk-type="Python SDK" />
</project>`

    await fs.writeFile(path.join(ideaDir, 'misc.xml'), workspace)
    result.configFilesCreated.push('.idea/misc.xml')
  }

  // Open project in IDE
  private async openInIDE(ide: IDEType, projectPath: string): Promise<boolean> {
    const absolutePath = path.resolve(projectPath)

    try {
      switch (ide) {
        case 'vscode':
          await execAsync(`code "${absolutePath}"`)
          return true

        case 'cursor':
          // Try cursor command first
          try {
            await execAsync(`cursor "${absolutePath}"`)
            return true
          } catch {
            // Fallback to direct path on Windows
            try {
              await execAsync(`"${process.env.LOCALAPPDATA}\\Programs\\cursor\\Cursor.exe" "${absolutePath}"`)
              return true
            } catch {
              return false
            }
          }

        case 'webstorm':
          await execAsync(`webstorm "${absolutePath}"`)
          return true

        case 'pycharm':
          await execAsync(`pycharm "${absolutePath}"`)
          return true

        case 'sublime':
          await execAsync(`subl "${absolutePath}"`)
          return true

        case 'atom':
          await execAsync(`atom "${absolutePath}"`)
          return true

        default:
          return false
      }
    } catch (error) {
      console.error(`Failed to open ${ide}:`, error)
      return false
    }
  }

  // Check if IDE is installed
  async isIDEInstalled(ide: IDEType): Promise<boolean> {
    try {
      switch (ide) {
        case 'vscode':
          await execAsync('code --version')
          return true
        case 'cursor':
          await execAsync('cursor --version')
          return true
        case 'webstorm':
          await execAsync('webstorm --version')
          return true
        case 'pycharm':
          await execAsync('pycharm --version')
          return true
        case 'sublime':
          await execAsync('subl --version')
          return true
        case 'atom':
          await execAsync('atom --version')
          return true
        default:
          return false
      }
    } catch {
      return false
    }
  }

  // Get available IDEs on system
  async getAvailableIDEs(): Promise<IDEType[]> {
    const ides: IDEType[] = ['vscode', 'cursor', 'webstorm', 'pycharm', 'sublime', 'atom']
    const available: IDEType[] = []

    for (const ide of ides) {
      if (await this.isIDEInstalled(ide)) {
        available.push(ide)
      }
    }

    return available
  }

  // Get display name for IDE
  private getIDEDisplayName(ide: IDEType): string {
    const names: Record<IDEType, string> = {
      vscode: 'Visual Studio Code',
      cursor: 'Cursor',
      webstorm: 'WebStorm',
      pycharm: 'PyCharm',
      sublime: 'Sublime Text',
      atom: 'Atom',
    }
    return names[ide]
  }

  // Generate vscode:// protocol URL
  generateVSCodeURL(projectPath: string): string {
    const absolutePath = path.resolve(projectPath)
    return `vscode://file/${absolutePath}`
  }

  // Generate cursor:// protocol URL
  generateCursorURL(projectPath: string): string {
    const absolutePath = path.resolve(projectPath)
    return `cursor://file/${absolutePath}`
  }
}

// Factory function
export const createIDELauncher = (): IDELauncher => {
  return new IDELauncher()
}

// Helper function to launch with auto-detection
export async function launchInBestIDE(projectPath: string): Promise<IDELaunchResult> {
  const launcher = createIDELauncher()
  const available = await launcher.getAvailableIDEs()

  if (available.length === 0) {
    return {
      success: false,
      message: 'No supported IDE found on your system',
      configFilesCreated: [],
      errors: ['No IDE installed'],
    }
  }

  // Prefer Cursor > VS Code > others
  const preferredOrder: IDEType[] = ['cursor', 'vscode', 'webstorm', 'pycharm', 'sublime', 'atom']
  const ideToUse = preferredOrder.find(ide => available.includes(ide)) || available[0]

  return launcher.launchIDE({
    type: ideToUse,
    projectPath,
  })
}
