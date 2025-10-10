#!/usr/bin/env node

/**
 * Tom Diff Mode
 * Validates only files changed since last commit (fast incremental validation)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('\n⚡ TOM DIFF MODE: Validating changed files...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const issues = {
  critical: [],
  high: [],
  medium: [],
  low: []
};

// Get changed files
function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD', {
      encoding: 'utf-8',
      cwd: rootDir
    }).trim();

    if (!output) {
      console.log('✅ No changed files detected\n');
      return [];
    }

    const files = output.split('\n').filter(Boolean);
    console.log(`📁 Found ${files.length} changed files:\n`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('');

    return files;
  } catch (error) {
    console.log('⚠️  Could not get git diff, analyzing all staged files...\n');
    try {
      const staged = execSync('git diff --cached --name-only', {
        encoding: 'utf-8',
        cwd: rootDir
      }).trim();
      return staged.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

// Validate API route changes
async function validateApiRoute(file) {
  console.log(`🔍 Validating API route: ${file}`);

  const filePath = path.join(rootDir, file);

  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Check for RLS issues
    if (content.includes('createClient()') && !content.includes('createAdminClient')) {
      issues.high.push({
        file,
        issue: 'Using createClient() - potential RLS issue',
        fix: 'Replace with createAdminClient() if experiencing RLS errors'
      });
      console.log('   ⚠️  HIGH: Potential RLS issue (using createClient)');
    }

    // Check for TODO comments
    if (/\/\/\s*TODO/i.test(content)) {
      issues.medium.push({
        file,
        issue: 'Contains TODO comments',
        fix: 'Complete implementation or remove TODO'
      });
      console.log('   ⚠️  MEDIUM: TODO comments found');
    }

    // Check for mock data
    if (content.includes('test-') || content.includes('mock') || content.includes('placeholder')) {
      issues.high.push({
        file,
        issue: 'May contain mock/placeholder data',
        fix: 'Review and replace with real implementation'
      });
      console.log('   ⚠️  HIGH: Possible mock data detected');
    }

    // Check for error handling
    if (!content.includes('try') && !content.includes('catch')) {
      issues.medium.push({
        file,
        issue: 'No error handling detected',
        fix: 'Add try/catch blocks for API calls'
      });
      console.log('   ⚠️  MEDIUM: No error handling');
    }

    console.log('   ✅ Validation complete\n');

  } catch (error) {
    console.log(`   ❌ Could not read file: ${error.message}\n`);
  }
}

// Validate component changes
async function validateComponent(file) {
  console.log(`🔍 Validating component: ${file}`);

  const filePath = path.join(rootDir, file);

  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Check for API calls without loading state
    const hasFetch = content.includes('fetch(') || content.includes('axios.');
    const hasLoadingState = /useState.*loading|isLoading/.test(content);

    if (hasFetch && !hasLoadingState) {
      issues.high.push({
        file,
        issue: 'Component makes API calls but has no loading state',
        fix: 'Add useState for loading state'
      });
      console.log('   ⚠️  HIGH: Missing loading state');
    }

    // Check for API calls without error handling
    if (hasFetch && !content.includes('catch')) {
      issues.high.push({
        file,
        issue: 'Component makes API calls but has no error handling',
        fix: 'Add try/catch or .catch() for error handling'
      });
      console.log('   ⚠️  HIGH: Missing error handling');
    }

    // Check for console.log
    if (content.includes('console.log')) {
      issues.low.push({
        file,
        issue: 'Contains console.log statements',
        fix: 'Remove or replace with proper logging'
      });
      console.log('   ⚠️  LOW: console.log found');
    }

    console.log('   ✅ Validation complete\n');

  } catch (error) {
    console.log(`   ❌ Could not read file: ${error.message}\n`);
  }
}

// Validate schema changes
async function validateSchema(file) {
  console.log(`🔍 Validating schema: ${file}`);

  // Check if corresponding migration exists
  const migrationPattern = /^\d+_.*\.sql$/;
  const hasNumber = /^\d+/.test(path.basename(file));

  if (!hasNumber) {
    issues.medium.push({
      file,
      issue: 'Schema file should have numbered migration format',
      fix: 'Rename to format: 001_description.sql'
    });
    console.log('   ⚠️  MEDIUM: Missing migration number');
  }

  // Check for ROLLBACK section
  const filePath = path.join(rootDir, file);

  try {
    const content = await fs.readFile(filePath, 'utf-8');

    if (!content.includes('-- ROLLBACK:')) {
      issues.medium.push({
        file,
        issue: 'Migration missing ROLLBACK section',
        fix: 'Add -- ROLLBACK: section with down migration'
      });
      console.log('   ⚠️  MEDIUM: Missing rollback');
    }

    console.log('   ✅ Validation complete\n');

  } catch (error) {
    console.log(`   ❌ Could not read file: ${error.message}\n`);
  }
}

// Validate package.json changes
async function validatePackageJson() {
  console.log(`🔍 Validating package.json changes`);

  const filePath = path.join(rootDir, 'package.json');

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const pkg = JSON.parse(content);

    // Check for version change
    console.log(`   ℹ️  Version: ${pkg.version}`);

    // Check scripts
    const scriptsCount = Object.keys(pkg.scripts || {}).length;
    console.log(`   ℹ️  Scripts: ${scriptsCount}`);

    // Check dependencies
    const depsCount = Object.keys(pkg.dependencies || {}).length;
    const devDepsCount = Object.keys(pkg.devDependencies || {}).length;
    console.log(`   ℹ️  Dependencies: ${depsCount} prod, ${devDepsCount} dev`);

    console.log('   ✅ Validation complete\n');

  } catch (error) {
    console.log(`   ❌ Could not parse package.json: ${error.message}\n`);
  }
}

// Generate report
function generateReport() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 TOM DIFF VALIDATION REPORT\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalIssues = issues.critical.length + issues.high.length + issues.medium.length + issues.low.length;

  if (totalIssues === 0) {
    console.log('✅ ALL CHECKS PASSED\n');
    console.log('Deployment Recommendation: ✅ SAFE TO DEPLOY\n');
    return;
  }

  console.log(`Issues Found: ${totalIssues}\n`);
  console.log(`  • ${issues.critical.length} CRITICAL`);
  console.log(`  • ${issues.high.length} HIGH`);
  console.log(`  • ${issues.medium.length} MEDIUM`);
  console.log(`  • ${issues.low.length} LOW\n`);

  if (issues.critical.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 CRITICAL ISSUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    issues.critical.forEach((item, i) => {
      console.log(`${i + 1}. ${item.file}`);
      console.log(`   Issue: ${item.issue}`);
      console.log(`   Fix: ${item.fix}\n`);
    });
  }

  if (issues.high.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  HIGH PRIORITY ISSUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    issues.high.forEach((item, i) => {
      console.log(`${i + 1}. ${item.file}`);
      console.log(`   Issue: ${item.issue}`);
      console.log(`   Fix: ${item.fix}\n`);
    });
  }

  if (issues.medium.length > 0 && issues.medium.length <= 5) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 MEDIUM PRIORITY ISSUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    issues.medium.forEach((item, i) => {
      console.log(`${i + 1}. ${item.file}`);
      console.log(`   Issue: ${item.issue}`);
      console.log(`   Fix: ${item.fix}\n`);
    });
  } else if (issues.medium.length > 5) {
    console.log(`\nℹ️  ${issues.medium.length} medium priority issues (run full Tom for details)\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (issues.critical.length > 0) {
    console.log('Deployment Recommendation: ❌ DO NOT DEPLOY\n');
  } else if (issues.high.length > 0) {
    console.log('Deployment Recommendation: ⚠️  REVIEW BEFORE DEPLOYING\n');
  } else {
    console.log('Deployment Recommendation: ✅ SAFE TO DEPLOY (minor issues)\n');
  }

  console.log('🔄 Next Steps:');
  console.log('   1. Fix critical/high issues');
  console.log('   2. Run full validation: npm run tom:genie');
  console.log('   3. Test changes locally');
  console.log('   4. Deploy when ready\n');
}

// Main execution
async function main() {
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log('✅ No files changed - nothing to validate\n');
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const file of changedFiles) {
    // API routes
    if (file.startsWith('app/api/') && file.endsWith('/route.ts')) {
      await validateApiRoute(file);
    }
    // Components
    else if (file.match(/\.(tsx|jsx)$/) && (file.startsWith('components/') || file.startsWith('app/'))) {
      await validateComponent(file);
    }
    // Database schemas
    else if (file.startsWith('database/') && file.endsWith('.sql')) {
      await validateSchema(file);
    }
    // package.json
    else if (file === 'package.json') {
      await validatePackageJson();
    }
    // Other files
    else {
      console.log(`⏭️  Skipping: ${file} (no validation rules)\n`);
    }
  }

  generateReport();
}

main();
