#!/usr/bin/env node

/**
 * MCP Server Verification Script
 *
 * Checks which MCP servers are properly configured and working
 * Provides recommendations for fixing any issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

// Expected MCP servers from settings.local.json
const expectedServers = [
  'shadcn-ui',
  'shadcn',
  'supabase',
  'perplexity',
  'github',
  'google-maps',
  'filesystem',
  'puppeteer-docker',
  'playwright-docker',
  'qwen-max',
  'vercel',
  'playwright',
  'brave-search',
  'postgres',
  'geo-builders'
];

// Check if Claude Desktop config exists
function checkClaudeConfig() {
  header('Checking Claude Desktop Configuration');

  const possiblePaths = [
    path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'),
    path.join(process.env.HOME || '', '.config', 'Claude', 'claude_desktop_config.json')
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      log(`✓ Found Claude config: ${configPath}`, 'green');
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const mcpServers = Object.keys(config.mcpServers || {});
        log(`✓ ${mcpServers.length} MCP servers configured:`, 'green');
        mcpServers.forEach(server => {
          log(`  - ${server}`, 'dim');
        });
        return { path: configPath, config, servers: mcpServers };
      } catch (error) {
        log(`✗ Error reading config: ${error.message}`, 'red');
        return null;
      }
    }
  }

  log('✗ Claude Desktop config not found', 'red');
  return null;
}

// Check local project settings
function checkLocalSettings() {
  header('Checking Project-Local Settings');

  const settingsPath = path.join(process.cwd(), '.claude', 'settings.local.json');

  if (!fs.existsSync(settingsPath)) {
    log('✗ .claude/settings.local.json not found', 'red');
    return null;
  }

  log(`✓ Found: ${settingsPath}`, 'green');

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const enabledServers = settings.enabledMcpjsonServers || [];
    log(`✓ ${enabledServers.length} MCP servers enabled:`, 'green');
    enabledServers.forEach(server => {
      log(`  - ${server}`, 'dim');
    });
    return { settings, enabledServers };
  } catch (error) {
    log(`✗ Error reading settings: ${error.message}`, 'red');
    return null;
  }
}

// Check if NPM packages are installed
function checkNpmPackages() {
  header('Checking NPM Package Availability');

  const packages = [
    '@modelcontextprotocol/server-memory',
    '@modelcontextprotocol/server-sequential-thinking',
    '@playwright/mcp',
    '@upstash/context7-mcp',
    '@modelcontextprotocol/server-github',
    'n8n-mcp'
  ];

  const results = {};

  for (const pkg of packages) {
    try {
      execSync(`npm list -g ${pkg}`, { stdio: 'ignore' });
      log(`✓ ${pkg} (global)`, 'green');
      results[pkg] = 'global';
    } catch {
      try {
        execSync(`npm list ${pkg}`, { stdio: 'ignore' });
        log(`✓ ${pkg} (local)`, 'green');
        results[pkg] = 'local';
      } catch {
        log(`✗ ${pkg} (not installed)`, 'yellow');
        results[pkg] = 'missing';
      }
    }
  }

  return results;
}

// Check custom MCP servers
function checkCustomServers() {
  header('Checking Custom MCP Servers');

  const geoBuilderPath = path.join(process.cwd(), 'tools', 'geo-builders-mcp', 'dist', 'index.js');

  if (fs.existsSync(geoBuilderPath)) {
    log(`✓ geo-builders MCP server found: ${geoBuilderPath}`, 'green');
    return { geoBuilders: true, path: geoBuilderPath };
  } else {
    log(`✗ geo-builders MCP server not found: ${geoBuilderPath}`, 'red');
    log('  Run: cd tools/geo-builders-mcp && npm install && npm run build', 'yellow');
    return { geoBuilders: false };
  }
}

// Compare expected vs configured
function compareServers(localSettings, claudeConfig) {
  header('Server Configuration Comparison');

  const enabledLocal = localSettings?.enabledServers || [];
  const configuredGlobal = claudeConfig?.servers || [];

  log('Expected servers from settings.local.json:', 'blue');
  expectedServers.forEach(server => {
    const inLocal = enabledLocal.includes(server);
    const inGlobal = configuredGlobal.includes(server);

    if (inLocal && inGlobal) {
      log(`  ✓ ${server} (enabled + configured)`, 'green');
    } else if (inLocal && !inGlobal) {
      log(`  ⚠ ${server} (enabled but NOT configured in Claude)`, 'yellow');
    } else if (!inLocal && inGlobal) {
      log(`  ℹ ${server} (configured but not enabled locally)`, 'dim');
    } else {
      log(`  ✗ ${server} (missing everywhere)`, 'red');
    }
  });

  // Find servers configured but not expected
  const unexpected = configuredGlobal.filter(s => !expectedServers.includes(s));
  if (unexpected.length > 0) {
    log('\nExtra servers in Claude Desktop config:', 'blue');
    unexpected.forEach(server => {
      log(`  + ${server}`, 'cyan');
    });
  }
}

// Generate recommendations
function generateRecommendations(localSettings, claudeConfig, customServers, npmPackages) {
  header('Recommendations');

  const recommendations = [];

  // Check for missing global config
  if (!claudeConfig) {
    recommendations.push({
      priority: 'HIGH',
      message: 'Claude Desktop config file not found',
      action: 'Install Claude Desktop from claude.ai and configure MCP servers'
    });
  }

  // Check for missing local settings
  if (!localSettings) {
    recommendations.push({
      priority: 'HIGH',
      message: 'Project-local settings not found',
      action: 'Create .claude/settings.local.json with enabled MCP servers'
    });
  }

  // Check for missing geo-builders
  if (!customServers?.geoBuilders) {
    recommendations.push({
      priority: 'MEDIUM',
      message: 'Custom geo-builders MCP server not built',
      action: 'cd tools/geo-builders-mcp && npm install && npm run build'
    });
  }

  // Check for missing NPM packages
  const missingPackages = Object.entries(npmPackages || {})
    .filter(([pkg, status]) => status === 'missing')
    .map(([pkg]) => pkg);

  if (missingPackages.length > 0) {
    recommendations.push({
      priority: 'LOW',
      message: `${missingPackages.length} NPM packages not installed`,
      action: `Install with: npx -y <package-name> (they'll be auto-installed on first use)`
    });
  }

  // Check for mismatches
  if (localSettings && claudeConfig) {
    const enabledLocal = localSettings.enabledServers || [];
    const configuredGlobal = claudeConfig.servers || [];

    const missingFromGlobal = enabledLocal.filter(s => !configuredGlobal.includes(s));

    if (missingFromGlobal.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        message: `${missingFromGlobal.length} servers enabled locally but not configured in Claude Desktop`,
        action: `Add to Claude Desktop config: ${missingFromGlobal.join(', ')}`
      });
    }
  }

  // Display recommendations
  if (recommendations.length === 0) {
    log('✓ All MCP servers are properly configured!', 'green');
    log('  You can use MCP tools in Claude Code without issues.', 'dim');
  } else {
    recommendations.forEach(rec => {
      const priorityColor = rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'dim';
      log(`\n[${rec.priority}] ${rec.message}`, priorityColor);
      log(`  → ${rec.action}`, 'cyan');
    });
  }
}

// Main execution
async function main() {
  log('\n🔍 MCP Server Verification Tool', 'cyan');
  log('='  .repeat(60), 'cyan');

  const claudeConfig = checkClaudeConfig();
  const localSettings = checkLocalSettings();
  const npmPackages = checkNpmPackages();
  const customServers = checkCustomServers();

  compareServers(localSettings, claudeConfig);
  generateRecommendations(localSettings, claudeConfig, customServers, npmPackages);

  header('Summary');

  const totalExpected = expectedServers.length;
  const totalConfigured = claudeConfig?.servers?.length || 0;
  const totalEnabled = localSettings?.enabledServers?.length || 0;

  log(`Expected MCP servers: ${totalExpected}`, 'blue');
  log(`Configured in Claude Desktop: ${totalConfigured}`, 'blue');
  log(`Enabled locally: ${totalEnabled}`, 'blue');

  const health = totalConfigured >= totalExpected * 0.8 ? 'green' : 'yellow';
  log(`\nOverall Status: ${totalConfigured}/${totalExpected} servers configured`, health);

  log('\n' + '='.repeat(60), 'cyan');
  log('✓ Verification complete', 'cyan');
  log('='  .repeat(60) + '\n', 'cyan');
}

main().catch(error => {
  log(`\n✗ Error: ${error.message}`, 'red');
  process.exit(1);
});
