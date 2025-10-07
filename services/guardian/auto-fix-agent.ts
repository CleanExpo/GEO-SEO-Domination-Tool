/**
 * Auto-Fix Agent
 *
 * Layer 2 of Self-Healing Guardian System
 * Automatically applies solutions for common build and configuration issues
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import type { MCPHealthStatus } from './mcp-health-monitor';

export interface FixAction {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  automated: boolean;
  requiresApproval: boolean;
  estimatedDuration: string;
  changes: string[];
}

export interface FixResult {
  success: boolean;
  fixId: string;
  appliedAt: Date;
  duration: number;
  message: string;
  changes: string[];
  errors?: string[];
  rollbackAvailable: boolean;
}

export interface AutoFixReport {
  timestamp: Date;
  totalIssues: number;
  fixedCount: number;
  failedCount: number;
  skippedCount: number;
  fixes: FixResult[];
}

export class AutoFixAgent {
  private logPath: string;
  private backupPath: string;
  private fixHistory: FixResult[] = [];

  constructor(
    logPath: string = join(process.cwd(), 'server/logs/auto-fix'),
    backupPath: string = join(process.cwd(), 'server/backups/auto-fix')
  ) {
    this.logPath = logPath;
    this.backupPath = backupPath;
  }

  /**
   * Analyze health issues and suggest fixes
   */
  async analyzeIssues(healthStatuses: MCPHealthStatus[]): Promise<FixAction[]> {
    const fixes: FixAction[] = [];

    for (const status of healthStatuses) {
      if (status.status === 'healthy') continue;

      // Docker daemon not running
      if (status.error?.includes('Docker daemon')) {
        fixes.push({
          id: `docker-to-npx-${status.name}`,
          name: `Switch ${status.name} from Docker to npx`,
          description: 'Replace Docker-based MCP with npx-based alternative (no daemon required)',
          severity: 'high',
          automated: true,
          requiresApproval: false,
          estimatedDuration: '5 seconds',
          changes: [
            'Update .vscode/mcp.json configuration',
            `Change command from "docker" to "npx"`,
            'Update args to use npm package instead of container',
          ],
        });
      }

      // Missing environment variable
      if (status.error?.includes('environment variable') || status.error?.includes('not configured')) {
        fixes.push({
          id: `env-var-${status.name}`,
          name: `Add missing environment variable for ${status.name}`,
          description: 'Create placeholder environment variable with secure prompt',
          severity: 'medium',
          automated: false, // Requires user input
          requiresApproval: true,
          estimatedDuration: '10 seconds',
          changes: ['Add environment variable to .env.local', 'Update MCP configuration'],
        });
      }

      // Authentication failed
      if (status.error?.includes('Authentication failed') || status.error?.includes('401') || status.error?.includes('403')) {
        fixes.push({
          id: `auth-refresh-${status.name}`,
          name: `Refresh authentication for ${status.name}`,
          description: 'Update expired OAuth token or API key',
          severity: 'high',
          automated: false, // Requires user credentials
          requiresApproval: true,
          estimatedDuration: '30 seconds',
          changes: ['Update API credentials', 'Refresh OAuth token'],
        });
      }

      // Connection timeout
      if (status.error?.includes('timeout') || status.error?.includes('Connection failed')) {
        fixes.push({
          id: `connection-retry-${status.name}`,
          name: `Retry connection for ${status.name}`,
          description: 'Attempt reconnection with exponential backoff',
          severity: 'medium',
          automated: true,
          requiresApproval: false,
          estimatedDuration: '15 seconds',
          changes: ['Retry connection up to 3 times', 'Wait 5s between retries'],
        });
      }

      // Missing package/module
      if (status.error?.includes('Module not found') || status.error?.includes('Cannot find module')) {
        const moduleName = this.extractModuleName(status.error);
        fixes.push({
          id: `install-module-${moduleName}`,
          name: `Install missing module: ${moduleName}`,
          description: 'Automatically install required npm package',
          severity: 'high',
          automated: true,
          requiresApproval: false,
          estimatedDuration: '30 seconds',
          changes: [`Run: npm install ${moduleName}`, 'Restart affected services'],
        });
      }
    }

    return fixes;
  }

  /**
   * Apply automated fixes
   */
  async applyFixes(fixes: FixAction[], autoApprove: boolean = false): Promise<AutoFixReport> {
    await this.ensureDirectories();
    const startTime = Date.now();
    const results: FixResult[] = [];

    let fixedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const fix of fixes) {
      // Skip if requires approval and auto-approve is false
      if (fix.requiresApproval && !autoApprove) {
        skippedCount++;
        results.push({
          success: false,
          fixId: fix.id,
          appliedAt: new Date(),
          duration: 0,
          message: 'Skipped - requires manual approval',
          changes: [],
          rollbackAvailable: false,
        });
        continue;
      }

      // Apply fix
      const result = await this.applyFix(fix);
      results.push(result);

      if (result.success) {
        fixedCount++;
        this.fixHistory.push(result);
      } else {
        failedCount++;
      }
    }

    const report: AutoFixReport = {
      timestamp: new Date(),
      totalIssues: fixes.length,
      fixedCount,
      failedCount,
      skippedCount,
      fixes: results,
    };

    await this.logReport(report);
    console.log(
      `[Auto-Fix Agent] Completed: ${fixedCount} fixed, ${failedCount} failed, ${skippedCount} skipped (${Date.now() - startTime}ms)`
    );

    return report;
  }

  /**
   * Apply individual fix
   */
  private async applyFix(fix: FixAction): Promise<FixResult> {
    const startTime = Date.now();
    console.log(`[Auto-Fix Agent] Applying fix: ${fix.name}`);

    try {
      // Create backup before applying fix
      const backup = await this.createBackup(fix);

      // Execute fix based on type
      if (fix.id.startsWith('docker-to-npx-')) {
        return await this.fixDockerToNpx(fix, backup);
      } else if (fix.id.startsWith('install-module-')) {
        return await this.fixInstallModule(fix, backup);
      } else if (fix.id.startsWith('connection-retry-')) {
        return await this.fixConnectionRetry(fix, backup);
      }

      // Unknown fix type
      return {
        success: false,
        fixId: fix.id,
        appliedAt: new Date(),
        duration: Date.now() - startTime,
        message: 'Unknown fix type',
        changes: [],
        errors: ['Fix type not implemented'],
        rollbackAvailable: false,
      };
    } catch (error) {
      return {
        success: false,
        fixId: fix.id,
        appliedAt: new Date(),
        duration: Date.now() - startTime,
        message: 'Fix failed with error',
        changes: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        rollbackAvailable: false,
      };
    }
  }

  /**
   * Fix: Docker to npx conversion
   */
  private async fixDockerToNpx(fix: FixAction, backupPath: string): Promise<FixResult> {
    const startTime = Date.now();
    const changes: string[] = [];

    try {
      // Extract MCP name from fix ID
      const mcpName = fix.id.replace('docker-to-npx-', '');

      // Load MCP config
      const mcpConfigPath = join(
        process.cwd(),
        '../geo-seo-domination-tool/.vscode/mcp.json'
      );
      const content = await fs.readFile(mcpConfigPath, 'utf-8');
      const config = JSON.parse(content);

      if (!config.mcpServers[mcpName]) {
        throw new Error(`MCP server "${mcpName}" not found in configuration`);
      }

      // Update configuration
      const oldConfig = { ...config.mcpServers[mcpName] };
      const newConfig = this.convertDockerToNpx(mcpName, oldConfig);

      config.mcpServers[mcpName] = newConfig;
      changes.push(`Updated ${mcpName} configuration from Docker to npx`);

      // Write updated config
      await fs.writeFile(mcpConfigPath, JSON.stringify(config, null, 2));
      changes.push(`Saved changes to ${mcpConfigPath}`);

      return {
        success: true,
        fixId: fix.id,
        appliedAt: new Date(),
        duration: Date.now() - startTime,
        message: `Successfully converted ${mcpName} from Docker to npx`,
        changes,
        rollbackAvailable: true,
      };
    } catch (error) {
      return {
        success: false,
        fixId: fix.id,
        appliedAt: new Date(),
        duration: Date.now() - startTime,
        message: 'Failed to convert Docker to npx',
        changes,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        rollbackAvailable: true,
      };
    }
  }

  /**
   * Fix: Install missing module
   */
  private async fixInstallModule(fix: FixAction, backupPath: string): Promise<FixResult> {
    const startTime = Date.now();
    const changes: string[] = [];

    try {
      const moduleName = fix.id.replace('install-module-', '');

      // Run npm install
      const result = await this.runCommand('npm', ['install', moduleName]);
      changes.push(`Installed ${moduleName} via npm`);

      if (!result.success) {
        throw new Error(result.error || 'npm install failed');
      }

      return {
        success: true,
        fixId: fix.id,
        appliedAt: new Date(),
        duration: Date.now() - startTime,
        message: `Successfully installed ${moduleName}`,
        changes,
        rollbackAvailable: true,
      };
    } catch (error) {
      return {
        success: false,
        fixId: fix.id,
        appliedAt: new Date(),
        duration: Date.now() - startTime,
        message: 'Failed to install module',
        changes,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        rollbackAvailable: false,
      };
    }
  }

  /**
   * Fix: Retry connection
   */
  private async fixConnectionRetry(fix: FixAction, backupPath: string): Promise<FixResult> {
    const startTime = Date.now();
    const changes: string[] = [];

    // This is a no-op fix - the health monitor will retry on next check
    return {
      success: true,
      fixId: fix.id,
      appliedAt: new Date(),
      duration: Date.now() - startTime,
      message: 'Connection will be retried on next health check',
      changes: ['Scheduled retry for next health check cycle'],
      rollbackAvailable: false,
    };
  }

  /**
   * Convert Docker MCP config to npx
   */
  private convertDockerToNpx(mcpName: string, oldConfig: any): any {
    // GitHub MCP
    if (mcpName === 'github') {
      return {
        ...oldConfig,
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
      };
    }

    // Playwright MCP
    if (mcpName === 'playwright') {
      return {
        ...oldConfig,
        command: 'npx',
        args: ['@playwright/mcp@latest'],
      };
    }

    // Generic conversion
    return {
      ...oldConfig,
      command: 'npx',
      args: ['-y', oldConfig.args?.[oldConfig.args.length - 1] || mcpName],
    };
  }

  /**
   * Extract module name from error message
   */
  private extractModuleName(error: string): string {
    const match = error.match(/['"]([^'"]+)['"]/);
    return match ? match[1] : 'unknown-module';
  }

  /**
   * Run shell command
   */
  private async runCommand(
    command: string,
    args: string[]
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    return new Promise((resolve) => {
      const proc = spawn(command, args, { shell: true });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout,
          error: stderr,
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        proc.kill();
        resolve({
          success: false,
          error: 'Command timeout',
        });
      }, 60000);
    });
  }

  /**
   * Create backup before applying fix
   */
  private async createBackup(fix: FixAction): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(this.backupPath, `${fix.id}-${timestamp}`);

    await fs.mkdir(backupDir, { recursive: true });

    // Backup MCP config if fix involves MCP
    if (fix.id.includes('docker-to-npx')) {
      const mcpConfigPath = join(
        process.cwd(),
        '../geo-seo-domination-tool/.vscode/mcp.json'
      );
      const content = await fs.readFile(mcpConfigPath, 'utf-8');
      await fs.writeFile(join(backupDir, 'mcp.json'), content);
    }

    return backupDir;
  }

  /**
   * Ensure log and backup directories exist
   */
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.logPath, { recursive: true });
    await fs.mkdir(this.backupPath, { recursive: true });
  }

  /**
   * Log auto-fix report
   */
  private async logReport(report: AutoFixReport): Promise<void> {
    try {
      const logFile = join(
        this.logPath,
        `auto-fix-${report.timestamp.toISOString().split('T')[0]}.ndjson`
      );

      const logEntry = JSON.stringify({
        timestamp: report.timestamp.toISOString(),
        totalIssues: report.totalIssues,
        fixedCount: report.fixedCount,
        failedCount: report.failedCount,
        skippedCount: report.skippedCount,
        fixes: report.fixes.map((f) => ({
          fixId: f.fixId,
          success: f.success,
          duration: f.duration,
          message: f.message,
          changes: f.changes,
          errors: f.errors,
        })),
      });

      await fs.appendFile(logFile, logEntry + '\n');
    } catch (error) {
      console.error('[Auto-Fix Agent] Failed to write log:', error);
    }
  }

  /**
   * Get fix history
   */
  getFixHistory(): FixResult[] {
    return this.fixHistory;
  }

  /**
   * Rollback a fix
   */
  async rollback(fixId: string): Promise<boolean> {
    try {
      // Find most recent backup for this fix
      const backups = await fs.readdir(this.backupPath);
      const fixBackups = backups
        .filter((b) => b.startsWith(fixId))
        .sort()
        .reverse();

      if (fixBackups.length === 0) {
        console.error(`[Auto-Fix Agent] No backup found for fix: ${fixId}`);
        return false;
      }

      const backupDir = join(this.backupPath, fixBackups[0]);

      // Restore MCP config if exists
      const mcpBackup = join(backupDir, 'mcp.json');
      try {
        const content = await fs.readFile(mcpBackup, 'utf-8');
        const mcpConfigPath = join(
          process.cwd(),
          '../geo-seo-domination-tool/.vscode/mcp.json'
        );
        await fs.writeFile(mcpConfigPath, content);
        console.log(`[Auto-Fix Agent] Rolled back fix: ${fixId}`);
        return true;
      } catch {
        // Backup doesn't exist, nothing to rollback
        return false;
      }
    } catch (error) {
      console.error(`[Auto-Fix Agent] Rollback failed for ${fixId}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const autoFixAgent = new AutoFixAgent();
