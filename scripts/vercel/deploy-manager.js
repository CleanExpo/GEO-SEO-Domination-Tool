#!/usr/bin/env node

/**
 * Vercel Deployment Manager
 * Manage deployments with pre-flight checks and rollback
 *
 * Usage:
 *   node scripts/vercel/deploy-manager.js --deploy
 *   node scripts/vercel/deploy-manager.js --deploy --prod
 *   node scripts/vercel/deploy-manager.js --rollback
 *   node scripts/vercel/deploy-manager.js --promote <deployment-url>
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * Run pre-flight checks
 */
async function runPreflightChecks() {
  console.log(`${colors.cyan}Running pre-flight checks...${colors.reset}\n`);

  const checks = [
    {
      name: 'TypeScript compilation',
      command: 'npx tsc --noEmit',
      critical: true,
    },
    {
      name: 'ESLint',
      command: 'npm run lint',
      critical: false,
    },
    {
      name: 'Build test',
      command: 'npm run build',
      critical: true,
    },
  ];

  const results = [];

  for (const check of checks) {
    process.stdout.write(`  ${check.name}... `);

    try {
      await execAsync(check.command, { maxBuffer: 10 * 1024 * 1024 });
      console.log(`${colors.green}✓${colors.reset}`);
      results.push({ ...check, passed: true });
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset}`);
      results.push({ ...check, passed: false, error: error.message });

      if (check.critical) {
        console.log(`\n${colors.red}Critical check failed!${colors.reset}`);
        console.log(`${colors.yellow}Error:${colors.reset}`, error.message.split('\n').slice(0, 10).join('\n'));
        return { passed: false, results };
      }
    }
  }

  console.log(`\n${colors.green}✓ All critical checks passed${colors.reset}\n`);
  return { passed: true, results };
}

/**
 * Deploy to Vercel
 */
async function deploy(isProd = false) {
  console.log(`${colors.bright}${colors.cyan}Deploying to Vercel${colors.reset}`);
  console.log(`Environment: ${isProd ? colors.red + 'PRODUCTION' : colors.yellow + 'Preview'}${colors.reset}\n`);

  // Run pre-flight checks
  const checkResults = await runPreflightChecks();

  if (!checkResults.passed) {
    console.log(`${colors.red}Deployment aborted due to failed checks${colors.reset}`);
    return { success: false, checkResults };
  }

  // Confirm production deployment
  if (isProd) {
    console.log(`${colors.yellow}${colors.bright}⚠ WARNING: Deploying to PRODUCTION${colors.reset}\n`);

    // In CI/CD or automated environments, skip confirmation
    if (!process.env.CI && process.stdin.isTTY) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise(resolve => {
        readline.question('Continue? (yes/no): ', resolve);
      });

      readline.close();

      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log(`${colors.yellow}Deployment canceled${colors.reset}`);
        return { success: false, canceled: true };
      }
    }
  }

  // Deploy
  console.log(`${colors.cyan}Deploying...${colors.reset}\n`);

  try {
    const prodFlag = isProd ? '--prod' : '';
    const result = await execAsync(`vercel ${prodFlag} --yes`, { maxBuffer: 10 * 1024 * 1024 });

    const deploymentUrl = result.stdout.match(/(https:\/\/[^\s]+vercel\.app)/)?.[1];

    console.log(`\n${colors.green}${colors.bright}✓ Deployment successful!${colors.reset}`);
    console.log(`${colors.cyan}URL: ${deploymentUrl}${colors.reset}\n`);

    // Save deployment record
    await saveDeploymentRecord({
      url: deploymentUrl,
      isProd,
      timestamp: new Date().toISOString(),
      checks: checkResults,
    });

    return { success: true, url: deploymentUrl, checkResults };
  } catch (error) {
    console.log(`\n${colors.red}✗ Deployment failed${colors.reset}`);
    console.log(`${colors.yellow}Error:${colors.reset}`, error.message);
    return { success: false, error: error.message, checkResults };
  }
}

/**
 * Get previous production deployment
 */
async function getPreviousProduction() {
  const result = await execAsync('vercel ls --prod');
  const lines = result.stdout.split('\n');

  const readyDeployments = [];

  for (const line of lines) {
    if (line.includes('Ready')) {
      const urlMatch = line.match(/(https:\/\/[^\s]+)/);
      if (urlMatch) {
        readyDeployments.push(urlMatch[1]);
      }
    }
  }

  // Return second ready deployment (first is current, second is previous)
  return readyDeployments[1] || null;
}

/**
 * Rollback to previous deployment
 */
async function rollback() {
  console.log(`${colors.yellow}${colors.bright}Rolling back to previous production deployment...${colors.reset}\n`);

  const previousUrl = await getPreviousProduction();

  if (!previousUrl) {
    console.log(`${colors.red}No previous deployment found${colors.reset}`);
    return { success: false };
  }

  console.log(`Previous deployment: ${colors.cyan}${previousUrl}${colors.reset}\n`);

  // Confirm rollback
  if (!process.env.CI && process.stdin.isTTY) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise(resolve => {
      readline.question('Proceed with rollback? (yes/no): ', resolve);
    });

    readline.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log(`${colors.yellow}Rollback canceled${colors.reset}`);
      return { success: false, canceled: true };
    }
  }

  try {
    await execAsync(`vercel promote ${previousUrl} --yes`);
    console.log(`\n${colors.green}${colors.bright}✓ Rollback successful${colors.reset}`);
    console.log(`${colors.cyan}Production URL: ${previousUrl}${colors.reset}\n`);

    return { success: true, url: previousUrl };
  } catch (error) {
    console.log(`\n${colors.red}✗ Rollback failed${colors.reset}`);
    console.log(`${colors.yellow}Error:${colors.reset}`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Promote deployment to production
 */
async function promote(deploymentUrl) {
  console.log(`${colors.cyan}Promoting deployment to production...${colors.reset}\n`);
  console.log(`Deployment: ${colors.cyan}${deploymentUrl}${colors.reset}\n`);

  try {
    await execAsync(`vercel promote ${deploymentUrl} --yes`);
    console.log(`\n${colors.green}${colors.bright}✓ Promotion successful${colors.reset}`);
    console.log(`${colors.cyan}Production URL: ${deploymentUrl}${colors.reset}\n`);

    return { success: true, url: deploymentUrl };
  } catch (error) {
    console.log(`\n${colors.red}✗ Promotion failed${colors.reset}`);
    console.log(`${colors.yellow}Error:${colors.reset}`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Save deployment record
 */
async function saveDeploymentRecord(record) {
  const dir = path.join(process.cwd(), 'logs', 'deployments');
  await fs.mkdir(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `deployment-${timestamp}.json`;
  const filepath = path.join(dir, filename);

  await fs.writeFile(filepath, JSON.stringify(record, null, 2));
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--deploy') || args.includes('-d')) {
    const isProd = args.includes('--prod') || args.includes('-p');
    const result = await deploy(isProd);
    process.exit(result.success ? 0 : 1);
  } else if (args.includes('--rollback') || args.includes('-r')) {
    const result = await rollback();
    process.exit(result.success ? 0 : 1);
  } else if (args.includes('--promote')) {
    const urlIndex = args.indexOf('--promote') + 1;
    const deploymentUrl = args[urlIndex];

    if (!deploymentUrl) {
      console.log(`${colors.red}Error: Deployment URL required${colors.reset}`);
      console.log('Usage: node deploy-manager.js --promote <deployment-url>');
      process.exit(1);
    }

    const result = await promote(deploymentUrl);
    process.exit(result.success ? 0 : 1);
  } else {
    console.log(`${colors.cyan}Vercel Deployment Manager${colors.reset}\n`);
    console.log('Usage:');
    console.log('  node scripts/vercel/deploy-manager.js --deploy           # Deploy to preview');
    console.log('  node scripts/vercel/deploy-manager.js --deploy --prod    # Deploy to production');
    console.log('  node scripts/vercel/deploy-manager.js --rollback         # Rollback to previous');
    console.log('  node scripts/vercel/deploy-manager.js --promote <url>    # Promote to production');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = {
  runPreflightChecks,
  deploy,
  rollback,
  promote,
};
