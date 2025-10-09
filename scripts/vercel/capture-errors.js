#!/usr/bin/env node

/**
 * Vercel Build Error Capture
 * Extracts and analyzes build errors from failed deployments
 *
 * Usage:
 *   node scripts/vercel/capture-errors.js <deployment-url>
 *   node scripts/vercel/capture-errors.js --latest
 *   node scripts/vercel/capture-errors.js --all-failed
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * Execute Vercel CLI command
 */
async function vercelCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(`vercel ${command}`, { maxBuffer: 10 * 1024 * 1024 });
    return { stdout, stderr, error: null };
  } catch (error) {
    return { stdout: error.stdout || '', stderr: error.stderr || '', error };
  }
}

/**
 * Get deployment logs
 */
async function getDeploymentLogs(url) {
  console.log(`${colors.cyan}Fetching logs from:${colors.reset} ${url}`);
  const result = await vercelCommand(`inspect ${url} --logs`);
  return result.stdout;
}

/**
 * Parse build errors from logs
 */
function parseBuildErrors(logs) {
  const errors = {
    moduleNotFound: [],
    typeErrors: [],
    syntaxErrors: [],
    otherErrors: [],
    warnings: [],
  };

  const lines = logs.split('\n');
  let currentError = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const timestamp = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/)?.[1];

    // Module not found errors
    if (line.includes('Module not found')) {
      const moduleName = line.match(/Can't resolve '([^']+)'/)?.[1];
      const filePath = lines[i - 1]?.match(/\.\/(.*)/)?.[1];

      currentError = {
        type: 'Module Not Found',
        module: moduleName || 'unknown',
        file: filePath || lines[i + 2]?.trim() || 'unknown',
        timestamp,
        rawMessage: line.trim(),
        importTrace: [],
      };

      // Capture import trace
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('./') || lines[j].includes('node_modules')) {
          currentError.importTrace.push(lines[j].trim());
        }
        if (lines[j].trim() === '' && currentError.importTrace.length > 0) break;
      }

      errors.moduleNotFound.push(currentError);
    }

    // TypeScript errors
    else if (line.includes('Type error:') || line.includes('TS')) {
      const errorMatch = line.match(/Type error: (.*)/);
      const tsCodeMatch = line.match(/TS\d{4}/);

      currentError = {
        type: 'TypeScript Error',
        message: errorMatch?.[1] || line.trim(),
        code: tsCodeMatch?.[0] || null,
        file: lines[i - 1]?.match(/\.\/(.*)/)?.[1] || 'unknown',
        timestamp,
      };

      errors.typeErrors.push(currentError);
    }

    // Syntax errors
    else if (line.includes('SyntaxError:')) {
      currentError = {
        type: 'Syntax Error',
        message: line.replace(/.*SyntaxError:\s*/, '').trim(),
        file: lines[i - 1]?.match(/\.\/(.*)/)?.[1] || 'unknown',
        timestamp,
      };

      errors.syntaxErrors.push(currentError);
    }

    // Generic errors
    else if (line.includes('Error:') && !line.includes('Module not found')) {
      currentError = {
        type: 'Build Error',
        message: line.replace(/.*Error:\s*/, '').trim(),
        timestamp,
      };

      errors.otherErrors.push(currentError);
    }

    // Warnings
    else if (line.includes('warn') || line.includes('Warning:')) {
      errors.warnings.push({
        message: line.trim(),
        timestamp,
      });
    }
  }

  return errors;
}

/**
 * Generate error report
 */
function generateErrorReport(url, logs, errors) {
  const deploymentId = url.match(/([a-z0-9-]+)\.vercel\.app/)?.[1] || 'unknown';
  const timestamp = new Date().toISOString();

  const report = {
    metadata: {
      deploymentUrl: url,
      deploymentId,
      analyzedAt: timestamp,
      totalErrors: Object.values(errors).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0),
    },
    errors,
    buildMetadata: extractBuildMetadata(logs),
    recommendations: generateRecommendations(errors),
  };

  return report;
}

/**
 * Extract build metadata from logs
 */
function extractBuildMetadata(logs) {
  const metadata = {};

  // Next.js version
  const nextVersionMatch = logs.match(/Next\.js (\d+\.\d+\.\d+)/);
  if (nextVersionMatch) metadata.nextVersion = nextVersionMatch[1];

  // Build location
  const locationMatch = logs.match(/Running build in ([^–]+) – (\w+)/);
  if (locationMatch) {
    metadata.buildLocation = locationMatch[1].trim();
    metadata.region = locationMatch[2];
  }

  // Build machine
  const machineMatch = logs.match(/(\d+) cores, (\d+) GB/);
  if (machineMatch) {
    metadata.cores = machineMatch[1];
    metadata.memory = machineMatch[2] + ' GB';
  }

  // Commit hash
  const commitMatch = logs.match(/Commit: ([a-f0-9]{7})/);
  if (commitMatch) metadata.commit = commitMatch[1];

  // Branch
  const branchMatch = logs.match(/Branch: ([^,]+)/);
  if (branchMatch) metadata.branch = branchMatch[1];

  // Build time
  const buildTimeMatch = logs.match(/Build Completed in.*\[([^\]]+)\]/);
  if (buildTimeMatch) metadata.buildTime = buildTimeMatch[1];

  return metadata;
}

/**
 * Generate recommendations based on errors
 */
function generateRecommendations(errors) {
  const recommendations = [];

  // Module not found recommendations
  if (errors.moduleNotFound.length > 0) {
    const missingModules = [...new Set(errors.moduleNotFound.map(e => e.module))];

    missingModules.forEach(module => {
      if (module.startsWith('@/')) {
        recommendations.push({
          severity: 'high',
          issue: `Path alias import not resolved: ${module}`,
          fix: `Check if the file exists at the aliased path. Verify tsconfig.json paths configuration.`,
          command: `find . -name "${module.replace('@/', '')}"`,
        });
      } else if (!module.includes('/')) {
        recommendations.push({
          severity: 'high',
          issue: `Missing npm package: ${module}`,
          fix: `Install the missing package`,
          command: `npm install ${module}`,
        });
      } else {
        recommendations.push({
          severity: 'medium',
          issue: `Missing module: ${module}`,
          fix: `Check if the file exists and the import path is correct`,
        });
      }
    });
  }

  // TypeScript error recommendations
  if (errors.typeErrors.length > 0) {
    recommendations.push({
      severity: 'medium',
      issue: `${errors.typeErrors.length} TypeScript type error(s) found`,
      fix: 'Run local TypeScript check to see detailed errors',
      command: 'npx tsc --noEmit',
    });
  }

  // Syntax error recommendations
  if (errors.syntaxErrors.length > 0) {
    recommendations.push({
      severity: 'high',
      issue: `${errors.syntaxErrors.length} syntax error(s) found`,
      fix: 'Check for missing brackets, quotes, or invalid JavaScript syntax',
      command: 'npm run lint',
    });
  }

  return recommendations;
}

/**
 * Display error report in terminal
 */
function displayReport(report) {
  console.log(`\n${colors.cyan}${'═'.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}  Build Error Report${colors.reset}`);
  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);

  // Metadata
  console.log(`${colors.bright}Deployment:${colors.reset} ${report.metadata.deploymentUrl}`);
  console.log(`${colors.bright}Analyzed:${colors.reset} ${report.metadata.analyzedAt}`);
  console.log(`${colors.bright}Total Errors:${colors.reset} ${report.metadata.totalErrors}\n`);

  if (Object.keys(report.buildMetadata).length > 0) {
    console.log(`${colors.bright}Build Environment:${colors.reset}`);
    Object.entries(report.buildMetadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
  }

  // Module Not Found Errors
  if (report.errors.moduleNotFound.length > 0) {
    console.log(`${colors.red}${colors.bright}Module Not Found (${report.errors.moduleNotFound.length}):${colors.reset}`);
    report.errors.moduleNotFound.forEach((error, index) => {
      console.log(`\n  ${index + 1}. ${colors.red}${error.module}${colors.reset}`);
      console.log(`     File: ${colors.yellow}${error.file}${colors.reset}`);
      if (error.importTrace.length > 0) {
        console.log(`     Import chain:`);
        error.importTrace.slice(0, 3).forEach(trace => {
          console.log(`       → ${trace}`);
        });
      }
    });
    console.log('');
  }

  // TypeScript Errors
  if (report.errors.typeErrors.length > 0) {
    console.log(`${colors.red}${colors.bright}TypeScript Errors (${report.errors.typeErrors.length}):${colors.reset}`);
    report.errors.typeErrors.forEach((error, index) => {
      console.log(`\n  ${index + 1}. ${error.message}`);
      console.log(`     File: ${colors.yellow}${error.file}${colors.reset}`);
      if (error.code) console.log(`     Code: ${error.code}`);
    });
    console.log('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log(`${colors.green}${colors.bright}Recommendations:${colors.reset}\n`);
    report.recommendations.forEach((rec, index) => {
      const severityColor = rec.severity === 'high' ? colors.red : colors.yellow;
      console.log(`  ${index + 1}. ${severityColor}[${rec.severity.toUpperCase()}]${colors.reset} ${rec.issue}`);
      console.log(`     ${colors.green}Fix:${colors.reset} ${rec.fix}`);
      if (rec.command) {
        console.log(`     ${colors.cyan}Command:${colors.reset} ${rec.command}`);
      }
      console.log('');
    });
  }

  console.log(`${colors.cyan}${'═'.repeat(60)}${colors.reset}\n`);
}

/**
 * Save report to file
 */
async function saveReport(report) {
  const dir = path.join(process.cwd(), 'logs', 'vercel-errors');
  await fs.mkdir(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `error-report-${report.metadata.deploymentId}-${timestamp}.json`;
  const filepath = path.join(dir, filename);

  await fs.writeFile(filepath, JSON.stringify(report, null, 2));
  console.log(`${colors.green}✓ Report saved:${colors.reset} ${filename}\n`);

  return filepath;
}

/**
 * Get latest failed deployment
 */
async function getLatestFailedDeployment() {
  const result = await vercelCommand('ls --prod');
  const lines = result.stdout.split('\n');

  for (const line of lines) {
    if (line.includes('Error')) {
      const urlMatch = line.match(/https:\/\/[^\s]+/);
      if (urlMatch) return urlMatch[0];
    }
  }

  return null;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  let deploymentUrl;

  if (args.includes('--latest') || args.includes('-l')) {
    console.log(`${colors.yellow}Finding latest failed deployment...${colors.reset}\n`);
    deploymentUrl = await getLatestFailedDeployment();
    if (!deploymentUrl) {
      console.log(`${colors.green}No failed deployments found!${colors.reset}`);
      return;
    }
  } else if (args[0] && args[0].startsWith('http')) {
    deploymentUrl = args[0];
  } else {
    console.log(`${colors.red}Usage:${colors.reset}`);
    console.log('  node scripts/vercel/capture-errors.js <deployment-url>');
    console.log('  node scripts/vercel/capture-errors.js --latest');
    process.exit(1);
  }

  // Fetch logs
  const logs = await getDeploymentLogs(deploymentUrl);

  // Parse errors
  console.log(`${colors.yellow}Analyzing build logs...${colors.reset}\n`);
  const errors = parseBuildErrors(logs);

  // Generate report
  const report = generateErrorReport(deploymentUrl, logs, errors);

  // Display report
  displayReport(report);

  // Save report
  await saveReport(report);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  });
}

module.exports = {
  getDeploymentLogs,
  parseBuildErrors,
  generateErrorReport,
};
