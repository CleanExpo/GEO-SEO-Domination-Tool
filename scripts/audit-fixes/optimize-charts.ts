#!/usr/bin/env tsx
/**
 * Chart Rendering Optimization Script
 *
 * Wraps chart components in React.memo and adds useMemo for data transformations
 *
 * Usage: npm run audit:fix:charts
 */

import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

async function optimizeCharts(): Promise<void> {
  console.log('📊 Chart Rendering Optimization Script\n');

  const files = await glob('**/*.{tsx,jsx}', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
  });

  console.log(`📁 Scanning ${files.length} files for charts\n`);

  let optimizations = 0;

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    let content = await readFile(filePath, 'utf-8');

    // Skip if file doesn't contain chart components
    if (!content.includes('Chart') && !content.includes('Recharts')) {
      continue;
    }

    let modified = false;

    // 1. Add React import if using React.memo
    if (!content.includes('import { memo }') && !content.includes('import React')) {
      if (content.match(/^import .* from ['"]react['"]/m)) {
        content = content.replace(
          /^(import .* from ['"]react['"])/m,
          "import { memo, useMemo } from 'react'"
        );
        modified = true;
      } else {
        content = `import { memo, useMemo } from 'react';\n${content}`;
        modified = true;
      }
    }

    // 2. Wrap chart components with memo
    const chartComponentRegex = /export\s+(default\s+)?function\s+(\w+Chart)\s*\(/g;
    let match;

    while ((match = chartComponentRegex.exec(content)) !== null) {
      const componentName = match[2];

      // Check if already wrapped
      if (content.includes(`memo(${componentName})`)) {
        continue;
      }

      // Find the component and wrap it
      const componentPattern = new RegExp(
        `export\\s+(default\\s+)?function\\s+${componentName}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`,
        'g'
      );

      content = content.replace(componentPattern, (fullMatch) => {
        return `${fullMatch}\n\nexport default memo(${componentName});`;
      });

      console.log(`  ✓ ${file}: Wrapped ${componentName} with React.memo`);
      modified = true;
      optimizations++;
    }

    // 3. Add useMemo for chart data transformations
    const dataTransformRegex = /const\s+(chartData|data)\s*=\s*([^;]+);/g;

    while ((match = dataTransformRegex.exec(content)) !== null) {
      const varName = match[1];
      const transformation = match[2].trim();

      // Skip if already using useMemo
      if (content.includes(`useMemo(() => ${transformation}`)) {
        continue;
      }

      // Skip simple assignments
      if (transformation.match(/^\w+$/)) {
        continue;
      }

      // Wrap in useMemo
      const original = match[0];
      const optimized = `const ${varName} = useMemo(() => ${transformation}, [/* dependencies */]);`;

      content = content.replace(original, optimized);
      console.log(`  ✓ ${file}: Added useMemo for ${varName}`);
      modified = true;
      optimizations++;
    }

    if (modified) {
      await writeFile(filePath, content, 'utf-8');
    }
  }

  console.log(`\n📊 Optimization Complete!\n`);
  console.log(`✅ Total optimizations: ${optimizations}\n`);
  console.log('💡 Next Steps:');
  console.log('1. Review useMemo dependencies');
  console.log('2. Test chart rendering performance');
  console.log('3. Use React DevTools Profiler to measure improvements');
  console.log('4. Commit: git add -A && git commit -m "perf: optimize chart rendering with memo and useMemo"');
}

optimizeCharts().catch(console.error);
