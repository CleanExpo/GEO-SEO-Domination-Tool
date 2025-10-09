#!/usr/bin/env node

/**
 * Vercel Deployment Monitor
 * Monitors deployment status and captures build errors
 *
 * Usage:
 *   node scripts/vercel/monitor-deployments.js
 *   node scripts/vercel/monitor-deployments.js --watch
 *   node scripts/vercel/monitor-deployments.js --errors-only
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  project: 'geo-seo-domination-tool',
  team: 'unite-group',
  checkInterval: 60000, // 1 minute
  errorLogDir: path.join(process.cwd(), 'logs', 'vercel-errors'),
  maxDeployments: 20,
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Execute Vercel CLI command
 */
async function vercelCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(`vercel ${command}`);
    return { stdout, stderr, error: null };
  } catch (error) {
    return { stdout: error.stdout, stderr: error.stderr, error };
  }
}

/**
 * Get list of deployments
 */
async function getDeployments(environment = 'production') {
  const envFlag = environment === 'production' ? '--prod' : '';
  const result = await vercelCommand(`ls ${envFlag}`);

  if (result.error) {
    console.error(`${colors.red}Error fetching deployments:${colors.reset}`, result.stderr);
    return [];
  }

  return parseDeploymentList(result.stdout);
}

/**
 * Parse deployment list from CLI output
 */
function parseDeploymentList(output) {
  const lines = output.split('\n');
  const deployments = [];

  // Find the header line with "Age" to know where data starts
  const headerIndex = lines.findIndex(line => line.includes('Age') && line.includes('Deployment'));
  if (headerIndex === -1) return deployments;

  // Parse deployment lines
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('─')) continue;

    // Extract URL and status
    const urlMatch = line.match(/https:\/\/[^\s]+/);
    const statusMatch = line.match(/(Ready|Error|Canceled|Building)/);
    const ageMatch = line.match(/^\s*(\d+[smhd])/);

    if (urlMatch && statusMatch) {
      deployments.push({
        url: urlMatch[0],
        status: statusMatch[1],
        age: ageMatch ? ageMatch[1] : 'unknown',
        rawLine: line,
      });
    }
  }

  return deployments.slice(0, CONFIG.maxDeployments);
}

/**
 * Get deployment logs
 */
async function getDeploymentLogs(deploymentUrl) {
  const result = await vercelCommand(`inspect ${deploymentUrl} --logs`);
  return {
    logs: result.stdout,
    hasError: result.error !== null || result.stdout.includes('Failed to compile'),
  };
}

/**
 * Extract error details from logs
 */
function extractErrors(logs) {
  const errors = [];
  const lines = logs.split('\n');

  let inErrorBlock = false;
  let currentError = { message: '', trace: [], timestamp: '' };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect error start
    if (line.includes('Failed to compile') || line.includes('Module not found') || line.includes('Error:')) {
      inErrorBlock = true;
      currentError.timestamp = line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)?.[0] || '';
    }

    if (inErrorBlock) {
      // Capture error message
      if (line.includes('Module not found') || line.includes('Error:')) {
        currentError.message = line.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*/, '').trim();
      }

      // Capture file paths
      if (line.includes('./') && !line.includes('https://')) {
        currentError.trace.push(line.trim());
      }

      // End of error block
      if (line.trim() === '' && currentError.message) {
        errors.push({ ...currentError });
        currentError = { message: '', trace: [], timestamp: '' };
        inErrorBlock = false;
      }
    }
  }

  return errors;
}

/**
 * Save error report to file
 */
async function saveErrorReport(deployment, errors, logs) {
  await fs.mkdir(CONFIG.errorLogDir, { recursive: true });

  const deploymentId = deployment.url.match(/([a-z0-9-]+)\.vercel\.app/)?.[1] || 'unknown';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `error-${deploymentId}-${timestamp}.json`;
  const filepath = path.join(CONFIG.errorLogDir, filename);

  const report = {
    deployment: {
      url: deployment.url,
      status: deployment.status,
      age: deployment.age,
      timestamp: new Date().toISOString(),
    },
    errors,
    fullLogs: logs,
  };

  await fs.writeFile(filepath, JSON.stringify(report, null, 2));
  console.log(`${colors.green}✓${colors.reset} Error report saved: ${colors.cyan}${filename}${colors.reset}`);

  return filepath;
}

/**
 * Display deployment status
 */
function displayDeployment(deployment, index) {
  const statusColors = {
    'Ready': colors.green,
    'Error': colors.red,
    'Canceled': colors.yellow,
    'Building': colors.blue,
  };

  const statusColor = statusColors[deployment.status] || colors.reset;
  const statusIcon = deployment.status === 'Ready' ? '✓' : deployment.status === 'Error' ? '✗' : '⚠';

  console.log(
    `${colors.bright}${index + 1}.${colors.reset} ` +
    `${statusColor}${statusIcon} ${deployment.status}${colors.reset} ` +
    `${colors.cyan}${deployment.age}${colors.reset} ` +
    `${colors.magenta}${deployment.url}${colors.reset}`
  );
}

/**
 * Display error summary
 */
function displayErrors(errors) {
  if (errors.length === 0) {
    console.log(`${colors.green}No errors found${colors.reset}`);
    return;
  }

  console.log(`\n${colors.red}${colors.bright}Errors Found: ${errors.length}${colors.reset}\n`);

  errors.forEach((error, index) => {
    console.log(`${colors.red}${index + 1}. ${error.message}${colors.reset}`);
    if (error.trace.length > 0) {
      console.log(`   ${colors.yellow}Trace:${colors.reset}`);
      error.trace.forEach(line => {
        console.log(`   ${colors.yellow}→${colors.reset} ${line}`);
      });
    }
    console.log('');
  });
}

/**
 * Check deployment for errors
 */
async function checkDeployment(deployment) {
  console.log(`\n${colors.cyan}Checking deployment:${colors.reset} ${deployment.url}`);

  const { logs, hasError } = await getDeploymentLogs(deployment.url);

  if (!hasError) {
    console.log(`${colors.green}✓ No errors found${colors.reset}`);
    return null;
  }

  const errors = extractErrors(logs);
  displayErrors(errors);

  if (errors.length > 0) {
    const reportPath = await saveErrorReport(deployment, errors, logs);
    return { deployment, errors, reportPath };
  }

  return null;
}

/**
 * Monitor deployments (single check)
 */
async function monitorOnce(errorsOnly = false) {
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  Vercel Deployment Monitor${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  console.log(`${colors.yellow}Fetching deployments...${colors.reset}\n`);
  const deployments = await getDeployments('production');

  if (deployments.length === 0) {
    console.log(`${colors.yellow}No deployments found${colors.reset}`);
    return;
  }

  console.log(`${colors.bright}Production Deployments (${deployments.length}):${colors.reset}\n`);

  if (!errorsOnly) {
    deployments.forEach((deployment, index) => {
      displayDeployment(deployment, index);
    });
  }

  // Check for errors in failed deployments
  const failedDeployments = deployments.filter(d => d.status === 'Error' || d.status === 'Canceled');

  if (failedDeployments.length === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ All deployments successful!${colors.reset}`);
    return;
  }

  console.log(`\n${colors.yellow}Checking ${failedDeployments.length} failed deployment(s)...${colors.reset}`);

  const errorReports = [];
  for (const deployment of failedDeployments) {
    const result = await checkDeployment(deployment);
    if (result) {
      errorReports.push(result);
    }
  }

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total deployments: ${deployments.length}`);
  console.log(`  ${colors.green}Successful: ${deployments.filter(d => d.status === 'Ready').length}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failedDeployments.length}${colors.reset}`);
  console.log(`  ${colors.yellow}Error reports saved: ${errorReports.length}${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
}

/**
 * Watch mode - continuously monitor deployments
 */
async function watch() {
  console.log(`${colors.bright}${colors.green}Watch mode enabled${colors.reset}`);
  console.log(`Checking every ${CONFIG.checkInterval / 1000} seconds...\n`);

  while (true) {
    await monitorOnce(true); // Only show errors in watch mode
    await new Promise(resolve => setTimeout(resolve, CONFIG.checkInterval));
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch') || args.includes('-w');
  const errorsOnly = args.includes('--errors-only') || args.includes('-e');

  if (watchMode) {
    await watch();
  } else {
    await monitorOnce(errorsOnly);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = {
  getDeployments,
  getDeploymentLogs,
  extractErrors,
  checkDeployment,
};
