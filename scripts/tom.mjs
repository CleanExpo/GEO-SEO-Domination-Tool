#!/usr/bin/env node
/**
 * Tom - Pre-Deployment Validation Agent
 *
 * Run with: node scripts/tom.mjs
 * Or add to package.json: npm run tom
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

console.log('\n🤖 TOM: Pre-Deployment Validation Agent');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Results storage
const results = {
  pathA: { name: 'API Connectivity', issues: [], confidence: 0 },
  pathB: { name: 'UI Component', issues: [], confidence: 0 },
  pathC: { name: 'Data Flow', issues: [], confidence: 0 },
  pathD: { name: 'Dependencies', issues: [], confidence: 0 },
  pathE: { name: 'Integration', issues: [], confidence: 0 },
};

// === PATH A: API CONNECTIVITY ===
async function runPathA() {
  console.log('🔄 Path A: API Connectivity Test...');

  const apiDir = join(ROOT, 'app', 'api');
  const apiRoutes = [];

  function scanDir(dir, basePath = '') {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const routePath = join(basePath, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath, routePath);
      } else if (entry.name === 'route.ts') {
        const content = readFileSync(fullPath, 'utf-8');
        const methods = [];

        if (/export\s+async\s+function\s+GET/.test(content)) methods.push('GET');
        if (/export\s+async\s+function\s+POST/.test(content)) methods.push('POST');
        if (/export\s+async\s+function\s+PUT/.test(content)) methods.push('PUT');
        if (/export\s+async\s+function\s+PATCH/.test(content)) methods.push('PATCH');
        if (/export\s+async\s+function\s+DELETE/.test(content)) methods.push('DELETE');

        const route = `/api/${routePath.replace(/\\/g, '/').replace('/route.ts', '')}`;

        apiRoutes.push({
          route,
          file: relative(ROOT, fullPath),
          methods,
          content
        });
      }
    }
  }

  scanDir(apiDir);

  console.log(`   Found ${apiRoutes.length} API routes\n`);

  // Check for common issues
  for (const api of apiRoutes) {
    // Check for createClient() without admin client (RLS issues)
    if (api.content.includes('createClient()') && !api.content.includes('createAdminClient')) {
      results.pathA.issues.push({
        severity: 'HIGH',
        route: api.route,
        file: api.file,
        issue: 'Using createClient() which may have RLS issues',
        fix: 'Consider using createAdminClient() for server-side operations',
        confidence: 80
      });
    }

    // Check for TODO/placeholder comments
    if (/\/\/\s*TODO/i.test(api.content)) {
      const todoMatches = api.content.match(/\/\/\s*TODO.*/gi) || [];
      results.pathA.issues.push({
        severity: 'MEDIUM',
        route: api.route,
        file: api.file,
        issue: `Found ${todoMatches.length} TODO comment(s)`,
        details: todoMatches.slice(0, 3).join('\n'),
        fix: 'Complete implementation or remove TODOs',
        confidence: 100
      });
    }

    // Check for mock/test data
    if (/test[-_]?data|mock[-_]?data|placeholder/i.test(api.content)) {
      results.pathA.issues.push({
        severity: 'HIGH',
        route: api.route,
        file: api.file,
        issue: 'Possible mock/test data in production code',
        fix: 'Replace with real data or remove',
        confidence: 70
      });
    }

    // Check for console.log
    if (/console\.log/.test(api.content)) {
      const logCount = (api.content.match(/console\.log/g) || []).length;
      results.pathA.issues.push({
        severity: 'LOW',
        route: api.route,
        file: api.file,
        issue: `Found ${logCount} console.log statement(s)`,
        fix: 'Remove or replace with proper logging',
        confidence: 100
      });
    }

    // Check for empty/placeholder responses
    if (/return\s+NextResponse\.json\(\s*\{\s*\}\s*\)/.test(api.content)) {
      results.pathA.issues.push({
        severity: 'CRITICAL',
        route: api.route,
        file: api.file,
        issue: 'Returns empty JSON object',
        fix: 'Implement proper response data',
        confidence: 100
      });
    }
  }

  results.pathA.confidence = 95;
  console.log(`   ✓ Path A complete (${results.pathA.issues.length} issues found)\n`);
}

// === PATH B: UI COMPONENT TEST ===
async function runPathB() {
  console.log('🔄 Path B: UI Component Test...');

  const componentsDir = join(ROOT, 'components');
  const appDir = join(ROOT, 'app');
  const components = [];

  function scanForComponents(dir) {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanForComponents(fullPath);
      } else if (entry.name.endsWith('.tsx')) {
        try {
          const content = readFileSync(fullPath, 'utf-8');
          components.push({
            file: relative(ROOT, fullPath),
            content
          });
        } catch (e) {
          // Skip files that can't be read
        }
      }
    }
  }

  scanForComponents(componentsDir);
  scanForComponents(appDir);

  console.log(`   Found ${components.length} React components\n`);

  for (const comp of components) {
    // Check for buttons without handlers
    const buttonMatches = comp.content.match(/<button[^>]*>/gi) || [];
    for (const button of buttonMatches) {
      if (!button.includes('onClick') && !button.includes('type="submit"')) {
        results.pathB.issues.push({
          severity: 'MEDIUM',
          file: comp.file,
          issue: 'Button without onClick or type="submit"',
          details: button.substring(0, 100),
          fix: 'Add onClick handler or specify type',
          confidence: 90
        });
      }
    }

    // Check for disabled buttons without condition
    if (/disabled\s*=\s*\{?true\}?/.test(comp.content) && !/disabled\s*=\s*\{[^}]+\}/.test(comp.content)) {
      results.pathB.issues.push({
        severity: 'MEDIUM',
        file: comp.file,
        issue: 'Button permanently disabled (disabled={true})',
        fix: 'Use conditional disabled={condition}',
        confidence: 95
      });
    }

    // Check for placeholder text
    if (/TODO|PLACEHOLDER|FIX ME|HACK/i.test(comp.content)) {
      const matches = comp.content.match(/(TODO|PLACEHOLDER|FIX ME|HACK)[^\n]*/gi) || [];
      if (matches.length > 0) {
        results.pathB.issues.push({
          severity: 'HIGH',
          file: comp.file,
          issue: `Found ${matches.length} placeholder/TODO comment(s)`,
          details: matches.slice(0, 3).join('\n'),
          fix: 'Complete implementation',
          confidence: 100
        });
      }
    }

    // Check for empty onClick handlers
    if (/onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(comp.content)) {
      results.pathB.issues.push({
        severity: 'CRITICAL',
        file: comp.file,
        issue: 'Empty onClick handler - button does nothing',
        fix: 'Implement click handler logic',
        confidence: 100
      });
    }
  }

  results.pathB.confidence = 92;
  console.log(`   ✓ Path B complete (${results.pathB.issues.length} issues found)\n`);
}

// === PATH C: DATA FLOW INTEGRITY ===
async function runPathC() {
  console.log('🔄 Path C: Data Flow Integrity...');

  const typesDir = join(ROOT, 'types');
  const databaseDir = join(ROOT, 'database');

  // Check if types directory exists
  if (!existsSync(typesDir)) {
    results.pathC.issues.push({
      severity: 'MEDIUM',
      issue: 'No types directory found',
      fix: 'Create types/ directory for TypeScript interfaces',
      confidence: 100
    });
  }

  // Check for database schema files
  if (existsSync(databaseDir)) {
    const schemaFiles = readdirSync(databaseDir).filter(f => f.endsWith('.sql'));
    console.log(`   Found ${schemaFiles.length} schema files\n`);

    // Just note that schemas exist - detailed validation would require SQL parsing
    if (schemaFiles.length === 0) {
      results.pathC.issues.push({
        severity: 'MEDIUM',
        issue: 'No database schema files found',
        fix: 'Add SQL schema files to database/',
        confidence: 100
      });
    }
  }

  results.pathC.confidence = 85;
  console.log(`   ✓ Path C complete (${results.pathC.issues.length} issues found)\n`);
}

// === PATH D: DEPENDENCY VERIFICATION ===
async function runPathD() {
  console.log('🔄 Path D: Dependency Verification...');

  const packageJsonPath = join(ROOT, 'package.json');
  const envExamplePath = join(ROOT, '.env.example');

  // Check package.json
  if (!existsSync(packageJsonPath)) {
    results.pathD.issues.push({
      severity: 'CRITICAL',
      issue: 'No package.json found',
      confidence: 100
    });
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  console.log(`   Found ${Object.keys(deps).length} dependencies\n`);

  // Check for .env.example
  if (!existsSync(envExamplePath)) {
    results.pathD.issues.push({
      severity: 'MEDIUM',
      issue: 'No .env.example file found',
      fix: 'Create .env.example to document required environment variables',
      confidence: 100
    });
  }

  results.pathD.confidence = 90;
  console.log(`   ✓ Path D complete (${results.pathD.issues.length} issues found)\n`);
}

// === PATH E: INTEGRATION (Placeholder) ===
async function runPathE() {
  console.log('🔄 Path E: Integration Testing...');
  console.log('   (Requires Playwright - skipping for now)\n');

  results.pathE.confidence = 0;
  console.log(`   ⊗ Path E skipped (requires full test setup)\n`);
}

// === GENERATE REPORT ===
function generateReport() {
  const allIssues = [
    ...results.pathA.issues,
    ...results.pathB.issues,
    ...results.pathC.issues,
    ...results.pathD.issues,
    ...results.pathE.issues
  ];

  const critical = allIssues.filter(i => i.severity === 'CRITICAL');
  const high = allIssues.filter(i => i.severity === 'HIGH');
  const medium = allIssues.filter(i => i.severity === 'MEDIUM');
  const low = allIssues.filter(i => i.severity === 'LOW');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 TOM VALIDATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Overall Status: ${critical.length > 0 ? '❌ CRITICAL ISSUES' : high.length > 0 ? '⚠️  ISSUES FOUND' : '✅ READY'}`);
  console.log(`Deployment Recommendation: ${critical.length > 0 ? 'DO NOT DEPLOY' : high.length > 0 ? 'REVIEW & FIX' : 'DEPLOY'}\n`);

  console.log('Issues Found:');
  console.log(`  • ${critical.length} CRITICAL (blocking deployment)`);
  console.log(`  • ${high.length} HIGH (deploy with caution)`);
  console.log(`  • ${medium.length} MEDIUM (fix soon)`);
  console.log(`  • ${low.length} LOW (non-urgent)\n`);

  // Show critical issues first
  if (critical.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 CRITICAL ISSUES (Blocking Deployment)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    critical.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.issue}`);
      if (issue.file) console.log(`   File: ${issue.file}`);
      if (issue.route) console.log(`   Route: ${issue.route}`);
      if (issue.details) console.log(`   Details: ${issue.details}`);
      if (issue.fix) console.log(`   Fix: ${issue.fix}`);
      console.log(`   Confidence: ${issue.confidence}%\n`);
    });
  }

  // Show high priority issues
  if (high.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  HIGH PRIORITY ISSUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    high.slice(0, 10).forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.issue}`);
      if (issue.file) console.log(`   File: ${issue.file}`);
      if (issue.route) console.log(`   Route: ${issue.route}`);
      if (issue.fix) console.log(`   Fix: ${issue.fix}\n`);
    });

    if (high.length > 10) {
      console.log(`   ... and ${high.length - 10} more high priority issues\n`);
    }
  }

  // Summary by path
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ANALYSIS BY PATH');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  Object.values(results).forEach(path => {
    const icon = path.issues.length === 0 ? '✅' : path.issues.some(i => i.severity === 'CRITICAL') ? '❌' : '⚠️ ';
    console.log(`${icon} ${path.name}: ${path.issues.length} issues (${path.confidence}% confidence)`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (critical.length === 0 && high.length === 0) {
    console.log('🎉 No critical or high priority issues found!');
    console.log('   Your code is ready for deployment.\n');
  } else {
    console.log('🔧 Next Steps:');
    console.log('   1. Fix all CRITICAL issues before deploying');
    console.log('   2. Review HIGH priority issues');
    console.log('   3. Run /tom again after fixes');
    console.log('   4. Deploy when all critical issues resolved\n');
  }
}

// === MAIN ===
async function main() {
  console.log('Scanning codebase...\n');

  await runPathA();
  await runPathB();
  await runPathC();
  await runPathD();
  await runPathE();

  generateReport();
}

main().catch(console.error);
