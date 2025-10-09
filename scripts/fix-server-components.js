const fs = require('fs');
const path = require('path');

// All files with onClick handlers that need 'use client'
const filesToFix = [
  'app/global-error.tsx',
  'app/error.tsx',
  'app/not-found.tsx',
  'app/test-save/page.tsx',
  'app/clients/page.tsx',
  'app/clients/[id]/autopilot/page.tsx',
  'app/task-inbox/page.tsx',
  'app/content-opportunities/page.tsx',
  'app/crm/influence/page.tsx',
  'app/crm/calendar/page.tsx',
  'app/sandbox/agents/page.tsx',
  'app/onboarding/[id]/page.tsx',
  'app/sandbox/terminal-pro/page.tsx',
  'app/sandbox/seo-monitor/page.tsx',
  'app/sandbox/terminal/page.tsx',
  'app/signup/page.tsx',
  'app/settings/page.tsx',
  'app/seo/audits/page.tsx',
  'app/schedule/page.tsx',
  'app/sandbox/page.tsx',
  'app/resources/prompts/page.tsx',
  'app/reports/page.tsx',
  'app/rankings/page.tsx',
  'app/projects/blueprints/page.tsx',
  'app/projects/page.tsx',
  'app/projects/catalog/page.tsx',
  'app/projects/builds/page.tsx',
  'app/projects/builds/RollbackPanel.tsx',
  'app/projects/builds/DiffPanelSelective.tsx',
  'app/projects/builds/DiffPanel.tsx',
  'app/projects/autolink/page.tsx',
  'app/login/page.tsx',
  'app/keywords/page.tsx',
  'app/docs/api/page.tsx',
  'app/deploy/bluegreen/page.tsx',
  'app/content-gaps/page.tsx',
  'app/companies/page.tsx',
  'app/companies/[id]/seo-audit/page.tsx',
  'app/companies/[id]/rankings/page.tsx',
  'app/companies/[id]/keywords/page.tsx',
  'app/backlinks/page.tsx',
  'app/audits/page.tsx',
  'app/ai-visibility/page.tsx',
  'app/analytics/page.tsx',
  'app/ai-strategy/page.tsx',
];

let fixedCount = 0;
let alreadyFixed = 0;
let errors = 0;

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      errors++;
      return;
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if already has 'use client'
    if (content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"')) {
      console.log(`✓  ${file} - already has 'use client'`);
      alreadyFixed++;
      return;
    }

    // Add 'use client' directive at the top
    const newContent = `'use client';\n\n${content}`;
    fs.writeFileSync(filePath, newContent, 'utf-8');

    console.log(`✅ ${file} - added 'use client'`);
    fixedCount++;
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
    errors++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('SUMMARY:');
console.log('='.repeat(60));
console.log(`✅ Fixed: ${fixedCount} files`);
console.log(`✓  Already fixed: ${alreadyFixed} files`);
console.log(`❌ Errors: ${errors} files`);
console.log('='.repeat(60));

if (fixedCount > 0) {
  console.log('\n🎉 Server Component errors should be fixed!');
  console.log('   Restart your dev server to see the changes.');
} else if (alreadyFixed === filesToFix.length) {
  console.log('\n✓  All files already have \'use client\' directive');
} else {
  console.log('\n⚠️  Some files had errors - check output above');
}
