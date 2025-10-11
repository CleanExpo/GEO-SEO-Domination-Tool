#!/usr/bin/env tsx
/**
 * Automated Card Spacing Standardization Script
 *
 * This script standardizes card padding across all components:
 * - Normal cards: p-6 (24px)
 * - Compact cards: p-4 (16px)
 *
 * Usage: npm run audit:fix:spacing
 */

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

interface FixResult {
  file: string;
  changes: number;
  before: string[];
  after: string[];
}

const CARD_PATTERNS = [
  // Match Card/CardHeader/CardContent with inconsistent padding
  { pattern: /<Card(Header|Content)?\s+[^>]*className="[^"]*\bp-[2358]\b/g, standard: 'p-6' },
  { pattern: /<Card(Header|Content)?\s+[^>]*className="[^"]*\bp[xyt]?-[2358]\b/g, standard: 'p-6' },
];

const COMPACT_INDICATORS = ['compact', 'sm:', 'small', 'mini'];

async function fixCardSpacing(): Promise<void> {
  console.log('🔧 Card Spacing Standardization Script\n');

  // Find all component files
  const files = await glob('**/*.{tsx,jsx}', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
  });

  console.log(`📁 Found ${files.length} component files\n`);

  const results: FixResult[] = [];
  let totalChanges = 0;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = await readFile(filePath, 'utf-8');
    let newContent = content;
    let fileChanges = 0;
    const before: string[] = [];
    const after: string[] = [];

    // Check if file contains Card components
    if (!content.includes('Card')) {
      continue;
    }

    // Find all Card components with padding
    const cardMatches = content.match(/<Card[^>]*>/g) || [];

    for (const match of cardMatches) {
      // Determine if this should be compact
      const isCompact = COMPACT_INDICATORS.some(indicator =>
        match.toLowerCase().includes(indicator)
      );

      const standardPadding = isCompact ? 'p-4' : 'p-6';

      // Check current padding
      const paddingMatch = match.match(/\bp-([0-9])\b/);
      if (paddingMatch) {
        const currentPadding = `p-${paddingMatch[1]}`;

        if (currentPadding !== standardPadding) {
          before.push(`${file}: ${currentPadding} → ${standardPadding}`);

          // Replace the padding
          const newMatch = match.replace(
            new RegExp(`\\bp-${paddingMatch[1]}\\b`),
            standardPadding
          );

          newContent = newContent.replace(match, newMatch);
          fileChanges++;
          after.push(`✓ ${file}: Applied ${standardPadding}`);
        }
      } else {
        // Add padding if missing
        const classNameMatch = match.match(/className="([^"]*)"/);
        if (classNameMatch) {
          const newClassName = `${classNameMatch[1]} ${standardPadding}`;
          const newMatch = match.replace(
            `className="${classNameMatch[1]}"`,
            `className="${newClassName}"`
          );
          newContent = newContent.replace(match, newMatch);
          fileChanges++;
          before.push(`${file}: No padding defined`);
          after.push(`✓ ${file}: Added ${standardPadding}`);
        }
      }
    }

    if (fileChanges > 0) {
      await writeFile(filePath, newContent, 'utf-8');
      totalChanges += fileChanges;
      results.push({ file, changes: fileChanges, before, after });
    }
  }

  // Print results
  console.log('📊 Results:\n');
  console.log(`✅ Total files modified: ${results.length}`);
  console.log(`✅ Total changes applied: ${totalChanges}\n`);

  if (results.length > 0) {
    console.log('📝 Detailed Changes:\n');
    for (const result of results) {
      console.log(`📄 ${result.file} (${result.changes} changes)`);
      result.after.forEach(change => console.log(`  ${change}`));
      console.log('');
    }
  } else {
    console.log('✨ No changes needed - all card spacing already standardized!');
  }

  console.log('\n🎯 Standardization Complete!');
  console.log('\n💡 Next Steps:');
  console.log('1. Review changes: git diff');
  console.log('2. Test affected components');
  console.log('3. Commit changes: git add -A && git commit -m "fix: standardize card spacing"');
}

// Run the script
fixCardSpacing().catch(console.error);
