#!/usr/bin/env node

/**
 * Vercel Deployment Status Checker
 * Quick status check and deployment comparison
 *
 * Usage:
 *   node scripts/vercel/deployment-status.js
 *   node scripts/vercel/deployment-status.js --compare
 *   node scripts/vercel/deployment-status.js --json
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function vercelCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(`vercel ${command}`);
    return { stdout, stderr, error: null };
  } catch (error) {
    return { stdout: error.stdout || '', stderr: error.stderr || '', error };
  }
}

function parseDeployments(output) {
  const lines = output.split('\n');
  const deployments = [];

  let inDataSection = false;

  for (const line of lines) {
    if (line.includes('Age') && line.includes('Deployment')) {
      inDataSection = true;
      continue;
    }

    if (!inDataSection || !line.trim()) continue;

    const urlMatch = line.match(/(https:\/\/[^\s]+)/);
    const statusMatch = line.match(/(Ready|Error|Canceled|Building)/);
    const ageMatch = line.match(/^\s*(\d+[smhd]|now)/);
    const durationMatch = line.match(/(\d+[smh])\s+\w+\s*$/);

    if (urlMatch && statusMatch) {
      const deploymentId = urlMatch[1].match(/([a-z0-9-]+)\.vercel\.app/)?.[1];
      deployments.push({
        url: urlMatch[1],
        id: deploymentId,
        status: statusMatch[1],
        age: ageMatch ? ageMatch[1] : 'unknown',
        duration: durationMatch ? durationMatch[1] : null,
      });
    }
  }

  return deployments;
}

function getStatusIcon(status) {
  const icons = {
    'Ready': '✓',
    'Error': '✗',
    'Canceled': '⚠',
    'Building': '⟳',
  };
  return icons[status] || '?';
}

function getStatusColor(status) {
  const statusColors = {
    'Ready': colors.green,
    'Error': colors.red,
    'Canceled': colors.yellow,
    'Building': colors.blue,
  };
  return statusColors[status] || colors.reset;
}

function displayStatus(deployments) {
  console.log(`\n${colors.bright}${colors.cyan}Deployment Status${colors.reset}\n`);

  const stats = {
    total: deployments.length,
    ready: deployments.filter(d => d.status === 'Ready').length,
    error: deployments.filter(d => d.status === 'Error').length,
    canceled: deployments.filter(d => d.status === 'Canceled').length,
    building: deployments.filter(d => d.status === 'Building').length,
  };

  console.log(`${colors.bright}Overview:${colors.reset}`);
  console.log(`  Total: ${stats.total}`);
  console.log(`  ${colors.green}Ready: ${stats.ready}${colors.reset}`);
  console.log(`  ${colors.red}Error: ${stats.error}${colors.reset}`);
  console.log(`  ${colors.yellow}Canceled: ${stats.canceled}${colors.reset}`);
  console.log(`  ${colors.blue}Building: ${stats.building}${colors.reset}\n`);

  console.log(`${colors.bright}Recent Deployments:${colors.reset}\n`);

  deployments.slice(0, 10).forEach((deployment, index) => {
    const statusColor = getStatusColor(deployment.status);
    const icon = getStatusIcon(deployment.status);

    console.log(
      `${colors.bright}${index + 1}.${colors.reset} ` +
      `${statusColor}${icon} ${deployment.status.padEnd(10)}${colors.reset} ` +
      `${colors.cyan}${deployment.age.padEnd(6)}${colors.reset} ` +
      `${deployment.duration ? colors.yellow + deployment.duration.padEnd(5) + colors.reset : '     '} ` +
      `${colors.blue}${deployment.id}${colors.reset}`
    );
  });

  console.log('');

  return stats;
}

async function compareDeployments(deployments) {
  if (deployments.length < 2) {
    console.log(`${colors.yellow}Not enough deployments to compare${colors.reset}`);
    return;
  }

  const latest = deployments[0];
  const previous = deployments.find((d, i) => i > 0 && d.status === 'Ready');

  if (!previous) {
    console.log(`${colors.yellow}No previous successful deployment to compare${colors.reset}`);
    return;
  }

  console.log(`\n${colors.bright}${colors.cyan}Deployment Comparison${colors.reset}\n`);

  console.log(`${colors.bright}Latest:${colors.reset}`);
  console.log(`  Status: ${getStatusColor(latest.status)}${latest.status}${colors.reset}`);
  console.log(`  Age: ${latest.age}`);
  console.log(`  ID: ${latest.id}`);
  console.log(`  URL: ${colors.cyan}${latest.url}${colors.reset}\n`);

  console.log(`${colors.bright}Previous (successful):${colors.reset}`);
  console.log(`  Status: ${getStatusColor(previous.status)}${previous.status}${colors.reset}`);
  console.log(`  Age: ${previous.age}`);
  console.log(`  ID: ${previous.id}`);
  console.log(`  URL: ${colors.cyan}${previous.url}${colors.reset}\n`);

  // Get diff
  console.log(`${colors.yellow}Fetching deployment diff...${colors.reset}\n`);

  const latestInspect = await vercelCommand(`inspect ${latest.url}`);
  const previousInspect = await vercelCommand(`inspect ${previous.url}`);

  const latestCommit = latestInspect.stdout.match(/Commit: ([a-f0-9]{7})/)?.[1];
  const previousCommit = previousInspect.stdout.match(/Commit: ([a-f0-9]{7})/)?.[1];

  if (latestCommit && previousCommit && latestCommit !== previousCommit) {
    console.log(`${colors.bright}Git Changes:${colors.reset}`);
    console.log(`  Latest commit: ${colors.cyan}${latestCommit}${colors.reset}`);
    console.log(`  Previous commit: ${colors.cyan}${previousCommit}${colors.reset}\n`);

    const gitDiff = await execAsync(`git log --oneline ${previousCommit}..${latestCommit}`).catch(() => null);
    if (gitDiff && gitDiff.stdout) {
      console.log(`${colors.bright}Commits between deployments:${colors.reset}`);
      gitDiff.stdout.split('\n').filter(Boolean).forEach(line => {
        console.log(`  ${colors.yellow}→${colors.reset} ${line}`);
      });
      console.log('');
    }
  }
}

async function getCurrentDeployment() {
  const result = await vercelCommand('ls --prod');
  const deployments = parseDeployments(result.stdout);

  if (deployments.length === 0) {
    return null;
  }

  const current = deployments.find(d => d.status === 'Ready') || deployments[0];

  // Get detailed info
  const inspect = await vercelCommand(`inspect ${current.url}`);

  const commit = inspect.stdout.match(/Commit: ([a-f0-9]{7})/)?.[1];
  const branch = inspect.stdout.match(/Branch: ([^,]+)/)?.[1];

  return {
    ...current,
    commit,
    branch,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const compare = args.includes('--compare') || args.includes('-c');

  const result = await vercelCommand('ls --prod');

  if (result.error) {
    console.error(`${colors.red}Error fetching deployments:${colors.reset}`, result.stderr);
    process.exit(1);
  }

  const deployments = parseDeployments(result.stdout);

  if (deployments.length === 0) {
    console.log(`${colors.yellow}No deployments found${colors.reset}`);
    return;
  }

  if (jsonOutput) {
    const current = await getCurrentDeployment();
    console.log(JSON.stringify({ deployments, current }, null, 2));
    return;
  }

  const stats = displayStatus(deployments);

  if (compare) {
    await compareDeployments(deployments);
  }

  // Show current production deployment
  const current = await getCurrentDeployment();
  if (current) {
    console.log(`${colors.bright}${colors.green}Current Production:${colors.reset}`);
    console.log(`  ${colors.cyan}${current.url}${colors.reset}`);
    if (current.commit) console.log(`  Commit: ${current.commit}`);
    if (current.branch) console.log(`  Branch: ${current.branch}`);
    console.log('');
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  });
}

module.exports = {
  parseDeployments,
  displayStatus,
  getCurrentDeployment,
};
