#!/usr/bin/env node

/**
 * Tom Auto-Fix
 * Automatically fixes common issues found by Tom validation
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('\n🔧 TOM AUTO-FIX: Applying automated fixes...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const fixes = {
  applied: [],
  skipped: [],
  failed: []
};

// Fix #1: Replace createClient() with createAdminClient() in API routes
async function fixRLSIssues() {
  console.log('🔍 Scanning for RLS issues (createClient in API routes)...\n');

  const apiRoutes = [
    'app/api/keywords/route.ts',
    'app/api/keywords/[id]/route.ts',
    'app/api/rankings/route.ts',
    'app/api/rankings/[id]/route.ts',
    'app/api/scheduled-jobs/route.ts',
    'app/api/scheduled-jobs/[id]/route.ts',
    'app/api/ai-search/campaigns/route.ts',
    'app/api/ai-search/campaigns/[id]/route.ts',
    'app/api/reports/route.ts'
  ];

  for (const route of apiRoutes) {
    const filePath = path.join(rootDir, route);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Check if already using admin client
      if (content.includes('createAdminClient')) {
        console.log(`   ⏭️  SKIP: ${route} (already using admin client)`);
        fixes.skipped.push({ file: route, reason: 'Already fixed' });
        continue;
      }

      // Check if using regular client
      if (!content.includes('createClient()')) {
        console.log(`   ⏭️  SKIP: ${route} (not using createClient)`);
        fixes.skipped.push({ file: route, reason: 'Not applicable' });
        continue;
      }

      // Apply fix: Replace import and usage
      let fixed = content;

      // Replace import statement
      if (content.includes("import { createClient } from '@/lib/auth/supabase-server'")) {
        fixed = fixed.replace(
          "import { createClient } from '@/lib/auth/supabase-server'",
          "import { createAdminClient } from '@/lib/auth/supabase-admin'"
        );
      }

      // Replace usage
      fixed = fixed.replace(
        /const supabase = await createClient\(\);/g,
        'const supabase = createAdminClient();'
      );

      // Write back
      await fs.writeFile(filePath, fixed, 'utf-8');

      console.log(`   ✅ FIXED: ${route}`);
      console.log(`      - Replaced: createClient() → createAdminClient()`);
      fixes.applied.push({
        file: route,
        fix: 'RLS bypass',
        confidence: 100
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`   ⏭️  SKIP: ${route} (file not found)`);
        fixes.skipped.push({ file: route, reason: 'File not found' });
      } else {
        console.log(`   ❌ FAILED: ${route} (${error.message})`);
        fixes.failed.push({ file: route, error: error.message });
      }
    }
  }

  console.log('');
}

// Fix #2: Remove console.log statements
async function removeConsoleLogs() {
  console.log('🔍 Removing console.log statements from production code...\n');

  // Scan all .ts and .tsx files
  const { execSync } = await import('child_process');

  try {
    const filesWithConsoleLog = execSync(
      'git grep -l "console\\.log" -- "*.ts" "*.tsx" | grep -v node_modules | grep -v ".next"',
      { encoding: 'utf-8', cwd: rootDir }
    ).trim().split('\n').filter(Boolean);

    for (const file of filesWithConsoleLog.slice(0, 10)) { // Limit to first 10
      const filePath = path.join(rootDir, file);

      try {
        const content = await fs.readFile(filePath, 'utf-8');

        // Remove console.log lines (but keep console.error, console.warn)
        const fixed = content.replace(
          /^\s*console\.log\([^)]*\);?\s*$/gm,
          ''
        );

        if (fixed !== content) {
          await fs.writeFile(filePath, fixed, 'utf-8');
          console.log(`   ✅ CLEANED: ${file}`);
          fixes.applied.push({
            file,
            fix: 'Removed console.log',
            confidence: 95
          });
        }
      } catch (error) {
        console.log(`   ❌ FAILED: ${file} (${error.message})`);
        fixes.failed.push({ file, error: error.message });
      }
    }

    if (filesWithConsoleLog.length > 10) {
      console.log(`\n   ℹ️  Found ${filesWithConsoleLog.length} files with console.log (showed first 10)`);
    }

  } catch (error) {
    console.log('   ⏭️  SKIP: No console.log statements found\n');
  }

  console.log('');
}

// Fix #3: Add missing .env.example entries
async function updateEnvExample() {
  console.log('🔍 Checking .env.example for missing variables...\n');

  try {
    const envExamplePath = path.join(rootDir, '.env.example');
    const envLocalPath = path.join(rootDir, '.env.local');

    const envExample = await fs.readFile(envExamplePath, 'utf-8');
    const envLocal = await fs.readFile(envLocalPath, 'utf-8');

    // Extract variable names from .env.local
    const localVars = envLocal
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=')[0])
      .filter(Boolean);

    // Extract variable names from .env.example
    const exampleVars = envExample
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.split('=')[0])
      .filter(Boolean);

    // Find missing variables
    const missing = localVars.filter(v => !exampleVars.includes(v));

    if (missing.length > 0) {
      console.log(`   ⚠️  Found ${missing.length} variables in .env.local not in .env.example:`);
      missing.forEach(v => console.log(`      - ${v}`));

      // Add to .env.example
      let updated = envExample;
      if (!updated.endsWith('\n')) updated += '\n';
      updated += '\n# Auto-added by Tom Fix\n';
      missing.forEach(v => {
        updated += `${v}=\n`;
      });

      await fs.writeFile(envExamplePath, updated, 'utf-8');

      console.log(`\n   ✅ UPDATED: .env.example (added ${missing.length} variables)`);
      fixes.applied.push({
        file: '.env.example',
        fix: `Added ${missing.length} missing variables`,
        confidence: 100
      });
    } else {
      console.log('   ✅ All environment variables documented\n');
    }

  } catch (error) {
    console.log(`   ⏭️  SKIP: Could not update .env.example (${error.message})\n`);
  }
}

// Generate report
function generateReport() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 AUTO-FIX SUMMARY\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`✅ Fixes Applied: ${fixes.applied.length}`);
  if (fixes.applied.length > 0) {
    fixes.applied.forEach(f => {
      console.log(`   - ${f.file}: ${f.fix} (${f.confidence}% confidence)`);
    });
  }
  console.log('');

  console.log(`⏭️  Fixes Skipped: ${fixes.skipped.length}`);
  if (fixes.skipped.length > 5) {
    console.log(`   (showing first 5 of ${fixes.skipped.length})`);
    fixes.skipped.slice(0, 5).forEach(f => {
      console.log(`   - ${f.file}: ${f.reason}`);
    });
  } else if (fixes.skipped.length > 0) {
    fixes.skipped.forEach(f => {
      console.log(`   - ${f.file}: ${f.reason}`);
    });
  }
  console.log('');

  console.log(`❌ Fixes Failed: ${fixes.failed.length}`);
  if (fixes.failed.length > 0) {
    fixes.failed.forEach(f => {
      console.log(`   - ${f.file}: ${f.error}`);
    });
  }
  console.log('');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (fixes.applied.length > 0) {
    console.log('🔄 Next Steps:');
    console.log('   1. Review changes: git diff');
    console.log('   2. Test changes: npm run dev');
    console.log('   3. Validate fixes: npm run tom:genie');
    console.log('   4. Commit if satisfied: git add . && git commit -m "fix: apply Tom auto-fixes"');
    console.log('');
  } else {
    console.log('ℹ️  No fixes applied - all issues either already fixed or require manual intervention.');
    console.log('');
  }
}

// Main execution
async function main() {
  try {
    await fixRLSIssues();
    await removeConsoleLogs();
    await updateEnvExample();
    generateReport();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();
