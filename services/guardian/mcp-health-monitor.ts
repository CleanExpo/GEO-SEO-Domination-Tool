/**
 * MCP Health Monitor Agent
 *
 * Layer 1 of Self-Healing Guardian System
 * Continuously monitors MCP server health and detects configuration issues
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface MCPServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  description?: string;
  capabilities?: string[];
}

export interface MCPHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'misconfigured';
  lastCheck: Date;
  responseTime?: number;
  error?: string;
  suggestions?: string[];
  autoFixAvailable?: boolean;
}

export interface HealthMonitorReport {
  timestamp: Date;
  totalServers: number;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  misconfiguredCount: number;
  servers: MCPHealthStatus[];
  criticalIssues: string[];
  recommendations: string[];
}

export class MCPHealthMonitor {
  private mcpConfigPath: string;
  private logPath: string;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthHistory: Map<string, MCPHealthStatus[]> = new Map();

  constructor(
    mcpConfigPath: string = join(process.cwd(), '../geo-seo-domination-tool/.vscode/mcp.json'),
    logPath: string = join(process.cwd(), 'server/logs/mcp-health')
  ) {
    this.mcpConfigPath = mcpConfigPath;
    this.logPath = logPath;
  }

  /**
   * Start continuous health monitoring
   */
  async startMonitoring(intervalMinutes: number = 5): Promise<void> {
    console.log(`[MCP Health Monitor] Starting monitoring (${intervalMinutes}min intervals)`);
    await this.ensureLogDirectory();

    // Initial health check
    await this.performHealthCheck();

    // Schedule recurring checks
    this.monitoringInterval = setInterval(
      async () => {
        await this.performHealthCheck();
      },
      intervalMinutes * 60 * 1000
    );
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[MCP Health Monitor] Stopped monitoring');
    }
  }

  /**
   * Perform comprehensive health check of all MCP servers
   */
  async performHealthCheck(): Promise<HealthMonitorReport> {
    const startTime = Date.now();
    console.log('[MCP Health Monitor] Starting health check...');

    try {
      const config = await this.loadMCPConfig();
      const servers: MCPHealthStatus[] = [];
      const criticalIssues: string[] = [];
      const recommendations: string[] = [];

      let healthyCount = 0;
      let degradedCount = 0;
      let downCount = 0;
      let misconfiguredCount = 0;

      // Check each MCP server
      for (const [name, serverConfig] of Object.entries(config.mcpServers || {})) {
        const status = await this.checkServerHealth(name, serverConfig);
        servers.push(status);

        // Track history
        if (!this.healthHistory.has(name)) {
          this.healthHistory.set(name, []);
        }
        const history = this.healthHistory.get(name)!;
        history.push(status);
        // Keep last 100 checks
        if (history.length > 100) {
          history.shift();
        }

        // Categorize status
        switch (status.status) {
          case 'healthy':
            healthyCount++;
            break;
          case 'degraded':
            degradedCount++;
            criticalIssues.push(`${name}: Degraded performance - ${status.error}`);
            break;
          case 'down':
            downCount++;
            criticalIssues.push(`${name}: Server down - ${status.error}`);
            if (status.autoFixAvailable) {
              recommendations.push(`Auto-fix available for ${name}: ${status.suggestions?.join(', ')}`);
            }
            break;
          case 'misconfigured':
            misconfiguredCount++;
            criticalIssues.push(`${name}: Configuration error - ${status.error}`);
            if (status.autoFixAvailable) {
              recommendations.push(`Auto-fix available for ${name}: ${status.suggestions?.join(', ')}`);
            }
            break;
        }
      }

      const report: HealthMonitorReport = {
        timestamp: new Date(),
        totalServers: servers.length,
        healthyCount,
        degradedCount,
        downCount,
        misconfiguredCount,
        servers,
        criticalIssues,
        recommendations,
      };

      // Log report
      await this.logHealthReport(report);

      const duration = Date.now() - startTime;
      console.log(
        `[MCP Health Monitor] Check complete: ${healthyCount}/${servers.length} healthy (${duration}ms)`
      );

      // Alert if critical issues detected
      if (criticalIssues.length > 0) {
        console.warn(`[MCP Health Monitor] ⚠️  ${criticalIssues.length} critical issues detected`);
      }

      return report;
    } catch (error) {
      console.error('[MCP Health Monitor] Health check failed:', error);
      throw error;
    }
  }

  /**
   * Check health of individual MCP server
   */
  private async checkServerHealth(
    name: string,
    config: MCPServerConfig
  ): Promise<MCPHealthStatus> {
    const startTime = Date.now();

    try {
      // URL-based MCP (remote)
      if (config.url) {
        return await this.checkRemoteMCPHealth(name, config);
      }

      // Command-based MCP (local)
      if (config.command) {
        return await this.checkLocalMCPHealth(name, config);
      }

      return {
        name,
        status: 'misconfigured',
        lastCheck: new Date(),
        error: 'Neither URL nor command specified',
        suggestions: ['Add either "url" or "command" to MCP configuration'],
        autoFixAvailable: false,
      };
    } catch (error) {
      return {
        name,
        status: 'down',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: ['Check MCP server logs', 'Verify environment variables'],
        autoFixAvailable: false,
      };
    }
  }

  /**
   * Check remote MCP server (URL-based)
   */
  private async checkRemoteMCPHealth(
    name: string,
    config: MCPServerConfig
  ): Promise<MCPHealthStatus> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(config.url!, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          name,
          status: 'healthy',
          lastCheck: new Date(),
          responseTime,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          name,
          status: 'misconfigured',
          lastCheck: new Date(),
          responseTime,
          error: `Authentication failed (${response.status})`,
          suggestions: [
            'Check API credentials in environment variables',
            'Verify OAuth token has not expired',
          ],
          autoFixAvailable: false,
        };
      }

      return {
        name,
        status: 'degraded',
        lastCheck: new Date(),
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        suggestions: ['Check MCP server status', 'Review error logs'],
        autoFixAvailable: false,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          name,
          status: 'down',
          lastCheck: new Date(),
          responseTime,
          error: 'Connection timeout (>10s)',
          suggestions: ['Check network connectivity', 'Verify MCP URL is correct'],
          autoFixAvailable: false,
        };
      }

      return {
        name,
        status: 'down',
        lastCheck: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Connection failed',
        suggestions: ['Check network connectivity', 'Verify MCP server is running'],
        autoFixAvailable: false,
      };
    }
  }

  /**
   * Check local MCP server (command-based)
   */
  private async checkLocalMCPHealth(
    name: string,
    config: MCPServerConfig
  ): Promise<MCPHealthStatus> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      // Docker-based check
      if (config.command === 'docker') {
        this.checkDockerAvailability().then((dockerAvailable) => {
          if (!dockerAvailable) {
            resolve({
              name,
              status: 'misconfigured',
              lastCheck: new Date(),
              responseTime: Date.now() - startTime,
              error: 'Docker daemon not running',
              suggestions: [
                'Install Docker Desktop',
                'Start Docker daemon',
                'Switch to npx-based MCP (recommended)',
              ],
              autoFixAvailable: true, // Can auto-switch to npx
            });
            return;
          }

          // Docker available, try to run
          this.testDockerMCP(name, config).then((result) => {
            resolve(result);
          });
        });
        return;
      }

      // npx-based check
      if (config.command === 'npx') {
        this.checkNpxAvailability().then((npxAvailable) => {
          if (!npxAvailable) {
            resolve({
              name,
              status: 'misconfigured',
              lastCheck: new Date(),
              responseTime: Date.now() - startTime,
              error: 'npx not available (Node.js required)',
              suggestions: ['Install Node.js', 'Verify npx is in PATH'],
              autoFixAvailable: false,
            });
            return;
          }

          // npx available
          resolve({
            name,
            status: 'healthy',
            lastCheck: new Date(),
            responseTime: Date.now() - startTime,
          });
        });
        return;
      }

      // Other commands
      resolve({
        name,
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
      });
    });
  }

  /**
   * Check if Docker is available
   */
  private async checkDockerAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const docker = spawn('docker', ['version'], { shell: true });
      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      docker.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      docker.on('close', (code) => {
        resolve(code === 0 && !stderr.includes('daemon'));
      });

      docker.on('error', () => {
        resolve(false);
      });

      // Timeout after 3 seconds
      setTimeout(() => {
        docker.kill();
        resolve(false);
      }, 3000);
    });
  }

  /**
   * Test Docker-based MCP
   */
  private async testDockerMCP(
    name: string,
    config: MCPServerConfig
  ): Promise<MCPHealthStatus> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const docker = spawn(config.command!, config.args || [], {
        shell: true,
        env: { ...process.env, ...config.env },
      });

      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      docker.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      docker.on('close', (code) => {
        const responseTime = Date.now() - startTime;

        if (code === 0) {
          resolve({
            name,
            status: 'healthy',
            lastCheck: new Date(),
            responseTime,
          });
        } else {
          resolve({
            name,
            status: 'down',
            lastCheck: new Date(),
            responseTime,
            error: `Docker container exited with code ${code}`,
            suggestions: ['Check Docker logs', 'Verify image exists', 'Check environment variables'],
            autoFixAvailable: true,
          });
        }
      });

      docker.on('error', (error) => {
        resolve({
          name,
          status: 'down',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
          error: error.message,
          suggestions: ['Check Docker installation', 'Verify Docker daemon is running'],
          autoFixAvailable: true,
        });
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        docker.kill();
        resolve({
          name,
          status: 'healthy',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime,
        });
      }, 5000);
    });
  }

  /**
   * Check if npx is available
   */
  private async checkNpxAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const npx = spawn('npx', ['--version'], { shell: true });

      npx.on('close', (code) => {
        resolve(code === 0);
      });

      npx.on('error', () => {
        resolve(false);
      });

      // Timeout after 2 seconds
      setTimeout(() => {
        npx.kill();
        resolve(false);
      }, 2000);
    });
  }

  /**
   * Load MCP configuration
   */
  private async loadMCPConfig(): Promise<{
    mcpServers: Record<string, MCPServerConfig>;
  }> {
    try {
      const content = await fs.readFile(this.mcpConfigPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('[MCP Health Monitor] Failed to load MCP config:', error);
      throw new Error(`Cannot read MCP config at ${this.mcpConfigPath}`);
    }
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logPath, { recursive: true });
    } catch (error) {
      console.error('[MCP Health Monitor] Failed to create log directory:', error);
    }
  }

  /**
   * Log health report
   */
  private async logHealthReport(report: HealthMonitorReport): Promise<void> {
    try {
      const logFile = join(
        this.logPath,
        `health-${report.timestamp.toISOString().split('T')[0]}.ndjson`
      );

      const logEntry = JSON.stringify({
        timestamp: report.timestamp.toISOString(),
        totalServers: report.totalServers,
        healthyCount: report.healthyCount,
        degradedCount: report.degradedCount,
        downCount: report.downCount,
        misconfiguredCount: report.misconfiguredCount,
        criticalIssues: report.criticalIssues,
        recommendations: report.recommendations,
        servers: report.servers.map((s) => ({
          name: s.name,
          status: s.status,
          responseTime: s.responseTime,
          error: s.error,
        })),
      });

      await fs.appendFile(logFile, logEntry + '\n');
    } catch (error) {
      console.error('[MCP Health Monitor] Failed to write log:', error);
    }
  }

  /**
   * Get health history for a specific server
   */
  getServerHistory(serverName: string): MCPHealthStatus[] {
    return this.healthHistory.get(serverName) || [];
  }

  /**
   * Get uptime percentage for a server
   */
  getServerUptime(serverName: string, periodHours: number = 24): number {
    const history = this.getServerHistory(serverName);
    if (history.length === 0) return 100;

    const cutoffTime = Date.now() - periodHours * 60 * 60 * 1000;
    const recentChecks = history.filter(
      (check) => check.lastCheck.getTime() > cutoffTime
    );

    if (recentChecks.length === 0) return 100;

    const healthyChecks = recentChecks.filter(
      (check) => check.status === 'healthy'
    ).length;

    return (healthyChecks / recentChecks.length) * 100;
  }

  /**
   * Get latest health status
   */
  async getLatestStatus(): Promise<HealthMonitorReport | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logFile = join(this.logPath, `health-${today}.ndjson`);
      const content = await fs.readFile(logFile, 'utf-8');
      const lines = content.trim().split('\n');
      if (lines.length === 0) return null;

      const lastLine = lines[lines.length - 1];
      const data = JSON.parse(lastLine);

      return {
        ...data,
        timestamp: new Date(data.timestamp),
        servers: data.servers.map((s: any) => ({
          ...s,
          lastCheck: new Date(s.lastCheck || data.timestamp),
        })),
      };
    } catch (error) {
      return null;
    }
  }
}

// Singleton instance
export const mcpHealthMonitor = new MCPHealthMonitor();
