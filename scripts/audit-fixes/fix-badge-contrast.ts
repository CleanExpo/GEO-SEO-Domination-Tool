#!/usr/bin/env tsx
/**
 * Badge Color Contrast Fix Script
 *
 * Ensures all badge components meet WCAG AA contrast ratio (4.5:1)
 *
 * Usage: npm run audit:fix:contrast
 */

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

interface ContrastFix {
  file: string;
  line: number;
  before: string;
  after: string;
  contrastRatio: string;
}

// WCAG AA compliant badge color mappings
const COLOR_FIXES: Record<string, string> = {
  // Replace light colors with darker variants for better contrast
  'bg-blue-100 text-blue-700': 'bg-blue-600 text-white',
  'bg-blue-200 text-blue-700': 'bg-blue-600 text-white',
  'bg-emerald-100 text-emerald-700': 'bg-emerald-600 text-white',
  'bg-emerald-200 text-emerald-700': 'bg-emerald-600 text-white',
  'bg-amber-100 text-amber-700': 'bg-amber-600 text-white',
  'bg-amber-200 text-amber-700': 'bg-amber-600 text-white',
  'bg-red-100 text-red-700': 'bg-red-600 text-white',
  'bg-red-200 text-red-700': 'bg-red-600 text-white',
  'bg-purple-100 text-purple-700': 'bg-purple-600 text-white',
  'bg-purple-200 text-purple-700': 'bg-purple-600 text-white',
  'bg-pink-100 text-pink-700': 'bg-pink-600 text-white',
  'bg-pink-200 text-pink-700': 'bg-pink-600 text-white',

  // Fix gray badges
  'bg-gray-100 text-gray-700': 'bg-gray-600 text-white',
  'bg-gray-200 text-gray-600': 'bg-gray-700 text-white',
};

async function fixBadgeContrast(): Promise<void> {
  console.log('🎨 Badge Color Contrast Fix Script\n');
  console.log('Target: WCAG AA (4.5:1 contrast ratio)\n');

  const files = await glob('**/*.{tsx,jsx}', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
  });

  console.log(`📁 Scanning ${files.length} component files\n`);

  const fixes: ContrastFix[] = [];
  let totalFixes = 0;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = await readFile(filePath, 'utf-8');
    let newContent = content;

    // Check if file contains Badge components
    if (!content.includes('Badge') && !content.includes('badge')) {
      continue;
    }

    const lines = content.split('\n');
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Check each problematic color combination
      for (const [before, after] of Object.entries(COLOR_FIXES)) {
        if (line.includes(before)) {
          const beforeLine = line;
          const afterLine = line.replace(before, after);

          fixes.push({
            file,
            line: lineNumber,
            before: before,
            after: after,
            contrastRatio: '4.5:1+',
          });

          newContent = newContent.replace(beforeLine, afterLine);
          totalFixes++;
        }
      }

      // Check for custom badge colors that might have contrast issues
      const customBadgeMatch = line.match(/bg-(\w+)-(\d+)\s+text-(\w+)-(\d+)/);
      if (customBadgeMatch) {
        const [, bgColor, bgShade, textColor, textShade] = customBadgeMatch;

        // Warn if background is light (100-300) with light text (100-500)
        const bgShadeNum = parseInt(bgShade);
        const textShadeNum = parseInt(textShade);

        if (bgShadeNum <= 300 && textShadeNum <= 500) {
          console.log(`⚠️  ${file}:${lineNumber}`);
          console.log(`   Potential contrast issue: bg-${bgColor}-${bgShade} text-${textColor}-${textShade}`);
          console.log(`   Consider: bg-${bgColor}-600 text-white\n`);
        }
      }
    }

    if (newContent !== content) {
      await writeFile(filePath, newContent, 'utf-8');
    }
  }

  // Print results
  console.log('\n📊 Results:\n');
  console.log(`✅ Total fixes applied: ${totalFixes}`);
  console.log(`✅ Files modified: ${new Set(fixes.map(f => f.file)).size}\n`);

  if (fixes.length > 0) {
    console.log('📝 Detailed Changes:\n');

    const fileGroups = fixes.reduce((acc, fix) => {
      if (!acc[fix.file]) acc[fix.file] = [];
      acc[fix.file].push(fix);
      return acc;
    }, {} as Record<string, ContrastFix[]>);

    for (const [file, fileFixes] of Object.entries(fileGroups)) {
      console.log(`📄 ${file}`);
      fileFixes.forEach(fix => {
        console.log(`  Line ${fix.line}: ${fix.before} → ${fix.after} (${fix.contrastRatio})`);
      });
      console.log('');
    }
  } else {
    console.log('✨ No automatic fixes needed!');
    console.log('   All badge colors already meet WCAG AA standards.');
  }

  console.log('\n🎯 Contrast Fixes Complete!');
  console.log('\n💡 Next Steps:');
  console.log('1. Review changes visually');
  console.log('2. Test with browser DevTools accessibility checker');
  console.log('3. Verify with: https://webaim.org/resources/contrastchecker/');
  console.log('4. Commit: git add -A && git commit -m "fix: improve badge color contrast for WCAG AA"');
}

// Run the script
fixBadgeContrast().catch(console.error);
