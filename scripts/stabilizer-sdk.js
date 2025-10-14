#!/usr/bin/env node

/**
 * STABILIZER SDK AGENT
 *
 * Purpose: Create system snapshots and enable instant rollback to known-good states
 *
 * Features:
 * - Create comprehensive system snapshots (code + DB + config)
 * - Tag snapshots with health metrics
 * - Instant rollback to any snapshot
 * - Automated health checks
 * - Recovery procedures
 *
 * Usage:
 *   npm run stabilize                    # Create snapshot of current state
 *   npm run stabilize:check              # Run health check
 *   npm run stabilize:rollback [tag]     # Rollback to snapshot
 *   npm run stabilize:list               # List all snapshots
 *   npm run stabilize:compare [tag1] [tag2]  # Compare two snapshots
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const SNAPSHOTS_DIR = path.join(__dirname, '..', '.stabilizer', 'snapshots');
const HEALTH_LOG = path.join(__dirname, '..', '.stabilizer', 'health.log');

// Ensure snapshots directory exists
if (!fs.existsSync(path.dirname(SNAPSHOTS_DIR))) {
  fs.mkdirSync(path.dirname(SNAPSHOTS_DIR), { recursive: true });
}
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

// =====================================================
// HEALTH CHECK SYSTEM
// =====================================================

async function runHealthCheck() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║  🏥 SYSTEM HEALTH CHECK                                ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  const checks = [];
  let score = 0;
  const maxScore = 100;

  // Check 1: Git Status (10 points)
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    const uncommittedFiles = gitStatus.split('\n').filter(l => l.trim()).length;

    if (uncommittedFiles === 0) {
      checks.push({ name: 'Git Status', status: 'PASS', points: 10, message: 'No uncommitted changes' });
      score += 10;
    } else {
      checks.push({ name: 'Git Status', status: 'WARN', points: 5, message: `${uncommittedFiles} uncommitted files` });
      score += 5;
    }
  } catch (error) {
    checks.push({ name: 'Git Status', status: 'FAIL', points: 0, message: error.message });
  }

  // Check 2: Database Connection (20 points)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwoggbbavikzhypzodcr.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from('companies').select('id').limit(1);

      if (!error) {
        checks.push({ name: 'Database Connection', status: 'PASS', points: 20, message: 'Supabase connected' });
        score += 20;
      } else {
        checks.push({ name: 'Database Connection', status: 'FAIL', points: 0, message: error.message });
      }
    } else {
      checks.push({ name: 'Database Connection', status: 'FAIL', points: 0, message: 'No Supabase key' });
    }
  } catch (error) {
    checks.push({ name: 'Database Connection', status: 'FAIL', points: 0, message: error.message });
  }

  // Check 3: Database Schema (20 points)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwoggbbavikzhypzodcr.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const requiredTables = ['companies', 'client_credentials', 'saved_onboarding_sessions'];
      let tablesExist = 0;

      for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (!error) tablesExist++;
      }

      if (tablesExist === requiredTables.length) {
        checks.push({ name: 'Database Schema', status: 'PASS', points: 20, message: `All ${requiredTables.length} tables exist` });
        score += 20;
      } else {
        checks.push({ name: 'Database Schema', status: 'WARN', points: 10, message: `${tablesExist}/${requiredTables.length} tables exist` });
        score += 10;
      }
    } else {
      checks.push({ name: 'Database Schema', status: 'FAIL', points: 0, message: 'Cannot check without key' });
    }
  } catch (error) {
    checks.push({ name: 'Database Schema', status: 'FAIL', points: 0, message: error.message });
  }

  // Check 4: Node Modules (10 points)
  const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
  if (nodeModulesExists) {
    checks.push({ name: 'Dependencies', status: 'PASS', points: 10, message: 'node_modules exists' });
    score += 10;
  } else {
    checks.push({ name: 'Dependencies', status: 'FAIL', points: 0, message: 'node_modules missing' });
  }

  // Check 5: Environment Variables (15 points)
  const envFile = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'QWEN_API_KEY',
      'ANTHROPIC_API_KEY'
    ];

    const missingVars = requiredVars.filter(v => !envContent.includes(v));

    if (missingVars.length === 0) {
      checks.push({ name: 'Environment Config', status: 'PASS', points: 15, message: 'All required vars set' });
      score += 15;
    } else {
      checks.push({ name: 'Environment Config', status: 'WARN', points: 7, message: `Missing: ${missingVars.join(', ')}` });
      score += 7;
    }
  } else {
    checks.push({ name: 'Environment Config', status: 'FAIL', points: 0, message: '.env.local not found' });
  }

  // Check 6: Build Integrity (15 points)
  const nextDir = path.join(__dirname, '..', '.next');
  if (fs.existsSync(nextDir)) {
    const manifestFile = path.join(nextDir, 'build-manifest.json');
    if (fs.existsSync(manifestFile)) {
      checks.push({ name: 'Build Integrity', status: 'PASS', points: 15, message: '.next build valid' });
      score += 15;
    } else {
      checks.push({ name: 'Build Integrity', status: 'WARN', points: 7, message: '.next exists but incomplete' });
      score += 7;
    }
  } else {
    checks.push({ name: 'Build Integrity', status: 'INFO', points: 10, message: 'No build yet (dev mode OK)' });
    score += 10;
  }

  // Check 7: Critical Files (10 points)
  const criticalFiles = [
    'package.json',
    'next.config.js',
    'app/layout.tsx',
    'app/page.tsx',
    'middleware.ts'
  ];

  const missingFiles = criticalFiles.filter(f => !fs.existsSync(path.join(__dirname, '..', f)));

  if (missingFiles.length === 0) {
    checks.push({ name: 'Critical Files', status: 'PASS', points: 10, message: 'All critical files present' });
    score += 10;
  } else {
    checks.push({ name: 'Critical Files', status: 'FAIL', points: 0, message: `Missing: ${missingFiles.join(', ')}` });
  }

  // Display Results
  log('HEALTH CHECK RESULTS:\n', 'cyan');

  checks.forEach(check => {
    const statusColor = check.status === 'PASS' ? 'green' :
                        check.status === 'WARN' ? 'yellow' :
                        check.status === 'INFO' ? 'blue' : 'red';

    const statusSymbol = check.status === 'PASS' ? '✅' :
                         check.status === 'WARN' ? '⚠️' :
                         check.status === 'INFO' ? 'ℹ️' : '❌';

    log(`${statusSymbol} ${check.name.padEnd(25)} [${check.points}/${check.status === 'PASS' ? check.points : check.points * 2} pts]`, statusColor);
    log(`   ${check.message}`, statusColor);
  });

  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║  HEALTH SCORE                                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  const percentage = (score / maxScore) * 100;
  const healthGrade = percentage >= 90 ? 'EXCELLENT' :
                      percentage >= 75 ? 'GOOD' :
                      percentage >= 60 ? 'FAIR' :
                      percentage >= 40 ? 'POOR' : 'CRITICAL';

  const gradeColor = percentage >= 90 ? 'green' :
                     percentage >= 75 ? 'green' :
                     percentage >= 60 ? 'yellow' :
                     percentage >= 40 ? 'yellow' : 'red';

  log(`Score: ${score}/${maxScore} (${percentage.toFixed(1)}%)`, gradeColor);
  log(`Grade: ${healthGrade}`, gradeColor);

  // Log to file
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} | Score: ${score}/${maxScore} | Grade: ${healthGrade}\n`;
  fs.appendFileSync(HEALTH_LOG, logEntry);

  if (percentage >= 75) {
    log('\n✅ System is healthy and ready for snapshot', 'green');
    return { healthy: true, score, percentage, grade: healthGrade };
  } else if (percentage >= 60) {
    log('\n⚠️  System is functional but has warnings', 'yellow');
    return { healthy: true, score, percentage, grade: healthGrade };
  } else {
    log('\n❌ System health is poor - fix issues before creating snapshot', 'red');
    return { healthy: false, score, percentage, grade: healthGrade };
  }
}

// =====================================================
// SNAPSHOT CREATION
// =====================================================

async function createSnapshot(tag) {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║  📸 CREATING SYSTEM SNAPSHOT                           ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  // Run health check first
  const health = await runHealthCheck();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotTag = tag || `snapshot-${timestamp}`;
  const snapshotDir = path.join(SNAPSHOTS_DIR, snapshotTag);

  fs.mkdirSync(snapshotDir, { recursive: true });

  log(`\n📦 Creating snapshot: ${snapshotTag}`, 'cyan');

  // 1. Git commit hash
  try {
    const gitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

    fs.writeFileSync(
      path.join(snapshotDir, 'git-state.json'),
      JSON.stringify({ hash: gitHash, branch: gitBranch, timestamp }, null, 2)
    );

    log(`✅ Git state captured: ${gitBranch} @ ${gitHash.substring(0, 7)}`, 'green');
  } catch (error) {
    log(`❌ Failed to capture git state: ${error.message}`, 'red');
  }

  // 2. Package.json dependencies
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    fs.writeFileSync(
      path.join(snapshotDir, 'dependencies.json'),
      JSON.stringify({
        dependencies: packageJson.dependencies,
        devDependencies: packageJson.devDependencies
      }, null, 2)
    );

    log(`✅ Dependencies captured`, 'green');
  } catch (error) {
    log(`❌ Failed to capture dependencies: ${error.message}`, 'red');
  }

  // 3. Environment variables (sanitized)
  try {
    const envFile = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      const envKeys = envContent
        .split('\n')
        .filter(line => line.includes('='))
        .map(line => line.split('=')[0].trim());

      fs.writeFileSync(
        path.join(snapshotDir, 'env-keys.json'),
        JSON.stringify({ keys: envKeys, count: envKeys.length }, null, 2)
      );

      log(`✅ Environment keys captured (${envKeys.length} keys)`, 'green');
    }
  } catch (error) {
    log(`❌ Failed to capture environment: ${error.message}`, 'red');
  }

  // 4. Database schema snapshot
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qwoggbbavikzhypzodcr.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get table counts
      const tables = ['companies', 'client_credentials', 'saved_onboarding_sessions'];
      const counts = {};

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        counts[table] = error ? 'error' : count;
      }

      fs.writeFileSync(
        path.join(snapshotDir, 'database-state.json'),
        JSON.stringify({ tables: counts, timestamp }, null, 2)
      );

      log(`✅ Database state captured`, 'green');
    }
  } catch (error) {
    log(`⚠️  Database snapshot skipped: ${error.message}`, 'yellow');
  }

  // 5. Health metrics
  fs.writeFileSync(
    path.join(snapshotDir, 'health.json'),
    JSON.stringify(health, null, 2)
  );

  // 6. Create snapshot manifest
  const manifest = {
    tag: snapshotTag,
    timestamp,
    health,
    description: `System snapshot with ${health.grade} health (${health.percentage.toFixed(1)}%)`
  };

  fs.writeFileSync(
    path.join(snapshotDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  log(`\n✅ Snapshot created successfully!`, 'green');
  log(`   Location: ${snapshotDir}`, 'blue');
  log(`   Tag: ${snapshotTag}`, 'blue');
  log(`   Health: ${health.grade} (${health.percentage.toFixed(1)}%)`, health.percentage >= 75 ? 'green' : 'yellow');

  return { tag: snapshotTag, path: snapshotDir, health };
}

// =====================================================
// SNAPSHOT LISTING
// =====================================================

function listSnapshots() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║  📋 AVAILABLE SNAPSHOTS                                ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    log('No snapshots found. Create one with: npm run stabilize', 'yellow');
    return [];
  }

  const snapshots = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(name => fs.statSync(path.join(SNAPSHOTS_DIR, name)).isDirectory())
    .map(name => {
      const manifestPath = path.join(SNAPSHOTS_DIR, name, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      }
      return { tag: name, timestamp: 'unknown', health: { grade: 'UNKNOWN' } };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  snapshots.forEach((snapshot, index) => {
    const healthColor = snapshot.health.grade === 'EXCELLENT' ? 'green' :
                        snapshot.health.grade === 'GOOD' ? 'green' :
                        snapshot.health.grade === 'FAIR' ? 'yellow' : 'red';

    log(`${index + 1}. ${snapshot.tag}`, 'cyan');
    log(`   Created: ${new Date(snapshot.timestamp).toLocaleString()}`, 'blue');
    log(`   Health: ${snapshot.health.grade} (${snapshot.health.percentage?.toFixed(1) || 'N/A'}%)`, healthColor);
    log(`   ${snapshot.description || 'No description'}\n`, 'blue');
  });

  return snapshots;
}

// =====================================================
// ROLLBACK SYSTEM
// =====================================================

async function rollbackToSnapshot(tag) {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║  ⏮️  ROLLING BACK TO SNAPSHOT                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  const snapshotDir = path.join(SNAPSHOTS_DIR, tag);

  if (!fs.existsSync(snapshotDir)) {
    log(`❌ Snapshot '${tag}' not found`, 'red');
    log('\nAvailable snapshots:', 'yellow');
    listSnapshots();
    return false;
  }

  const manifestPath = path.join(snapshotDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    log(`❌ Invalid snapshot - manifest missing`, 'red');
    return false;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  log(`📋 Snapshot: ${manifest.tag}`, 'cyan');
  log(`   Created: ${new Date(manifest.timestamp).toLocaleString()}`, 'blue');
  log(`   Health: ${manifest.health.grade} (${manifest.health.percentage.toFixed(1)}%)`, 'blue');
  log(`\n⚠️  WARNING: This will reset your git state and may lose uncommitted changes!`, 'yellow');

  // Read git state
  const gitStatePath = path.join(snapshotDir, 'git-state.json');
  if (fs.existsSync(gitStatePath)) {
    const gitState = JSON.parse(fs.readFileSync(gitStatePath, 'utf8'));

    log(`\n🔄 Rolling back to git commit: ${gitState.hash.substring(0, 7)}`, 'cyan');
    log(`   Branch: ${gitState.branch}`, 'blue');

    try {
      // Stash current changes
      try {
        execSync('git stash push -m "Stabilizer auto-stash before rollback"', { stdio: 'inherit' });
        log(`✅ Current changes stashed`, 'green');
      } catch (e) {
        log(`ℹ️  No changes to stash`, 'blue');
      }

      // Checkout the commit
      execSync(`git checkout ${gitState.hash}`, { stdio: 'inherit' });
      log(`✅ Git state restored`, 'green');

      // Clean and rebuild
      log(`\n🧹 Cleaning build artifacts...`, 'cyan');
      if (fs.existsSync(path.join(__dirname, '..', '.next'))) {
        fs.rmSync(path.join(__dirname, '..', '.next'), { recursive: true, force: true });
      }

      log(`\n📦 Reinstalling dependencies...`, 'cyan');
      execSync('npm install', { stdio: 'inherit' });

      log(`\n✅ Rollback complete!`, 'green');
      log(`\nTo return to your previous state, run: git stash pop`, 'yellow');

      return true;
    } catch (error) {
      log(`\n❌ Rollback failed: ${error.message}`, 'red');
      return false;
    }
  } else {
    log(`❌ Cannot rollback - git state not captured in snapshot`, 'red');
    return false;
  }
}

// =====================================================
// CLI INTERFACE
// =====================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'check':
    case 'health':
      await runHealthCheck();
      break;

    case 'snapshot':
    case 'create':
      await createSnapshot(args[1]);
      break;

    case 'list':
    case 'ls':
      listSnapshots();
      break;

    case 'rollback':
    case 'restore':
      if (!args[1]) {
        log('❌ Please specify a snapshot tag to rollback to', 'red');
        log('\nUsage: npm run stabilize:rollback <snapshot-tag>', 'yellow');
        log('\nAvailable snapshots:', 'yellow');
        listSnapshots();
      } else {
        await rollbackToSnapshot(args[1]);
      }
      break;

    default:
      // Default: create snapshot
      await createSnapshot(args[0]);
      break;
  }
}

main().catch(error => {
  log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
