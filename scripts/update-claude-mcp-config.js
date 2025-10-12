#!/usr/bin/env node

/**
 * Update Claude Desktop MCP Configuration
 *
 * Automatically updates Claude Desktop config with all MCP servers
 * Backs up existing config before making changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

// Find Claude Desktop config path
function getClaudeConfigPath() {
  const possiblePaths = [
    path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'),
    path.join(process.env.HOME || '', '.config', 'Claude', 'claude_desktop_config.json')
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  // Return default path even if it doesn't exist
  return possiblePaths[0];
}

// Backup existing config
function backupConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    log('No existing config to backup', 'yellow');
    return null;
  }

  const backupPath = configPath.replace('.json', `.backup.${Date.now()}.json`);
  fs.copyFileSync(configPath, backupPath);
  log(`✓ Backed up to: ${backupPath}`, 'green');
  return backupPath;
}

// Load new config template
function loadNewConfig() {
  const templatePath = path.join(process.cwd(), 'claude_desktop_config_COMPLETE.json');

  if (!fs.existsSync(templatePath)) {
    log(`✗ Template not found: ${templatePath}`, 'red');
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  } catch (error) {
    log(`✗ Error reading template: ${error.message}`, 'red');
    return null;
  }
}

// Merge configs (preserve any custom servers)
function mergeConfigs(existingPath, newConfig) {
  if (!fs.existsSync(existingPath)) {
    return newConfig;
  }

  try {
    const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    const existingServers = existing.mcpServers || {};
    const newServers = newConfig.mcpServers || {};

    // Merge: new servers take precedence, but keep any custom ones
    const merged = { ...existingServers };

    for (const [name, config] of Object.entries(newServers)) {
      merged[name] = config;
    }

    return { mcpServers: merged };
  } catch (error) {
    log(`⚠ Error merging configs: ${error.message}`, 'yellow');
    return newConfig;
  }
}

// Write updated config
function writeConfig(configPath, config) {
  try {
    // Ensure directory exists
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    log(`✓ Updated: ${configPath}`, 'green');
    return true;
  } catch (error) {
    log(`✗ Error writing config: ${error.message}`, 'red');
    return false;
  }
}

// Main execution
async function main() {
  header('Update Claude Desktop MCP Configuration');

  // 1. Find config path
  const configPath = getClaudeConfigPath();
  log(`Config path: ${configPath}`, 'blue');

  // 2. Backup existing config
  log('\nBacking up existing config...', 'blue');
  const backupPath = backupConfig(configPath);

  // 3. Load new config template
  log('\nLoading new config template...', 'blue');
  const newConfig = loadNewConfig();

  if (!newConfig) {
    log('\n✗ Failed to load new config template', 'red');
    process.exit(1);
  }

  log(`✓ Loaded template with ${Object.keys(newConfig.mcpServers).length} servers`, 'green');

  // 4. Merge configs
  log('\nMerging configurations...', 'blue');
  const mergedConfig = mergeConfigs(configPath, newConfig);
  log(`✓ Merged config has ${Object.keys(mergedConfig.mcpServers).length} servers`, 'green');

  // 5. Write updated config
  log('\nWriting updated config...', 'blue');
  const success = writeConfig(configPath, mergedConfig);

  if (!success) {
    log('\n✗ Failed to update config', 'red');
    if (backupPath) {
      log(`Backup is available at: ${backupPath}`, 'yellow');
    }
    process.exit(1);
  }

  // 6. Summary
  header('Summary');

  log('MCP Servers Configured:', 'blue');
  Object.keys(mergedConfig.mcpServers).forEach(server => {
    log(`  ✓ ${server}`, 'green');
  });

  log('\n⚠ IMPORTANT: Restart Claude Desktop for changes to take effect', 'yellow');

  log('\n' + '='.repeat(60), 'cyan');
  log('✓ Configuration update complete!', 'green');
  log('='  .repeat(60) + '\n', 'cyan');
}

main().catch(error => {
  log(`\n✗ Error: ${error.message}`, 'red');
  process.exit(1);
});
