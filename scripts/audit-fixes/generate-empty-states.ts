#!/usr/bin/env tsx
/**
 * Empty State Component Generator
 *
 * Scans pages for data-fetching patterns and generates illustrated empty states
 * with clear CTAs for better UX when no data is available
 *
 * Usage: npm run audit:fix:empty-states
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import { existsSync } from 'fs';

interface EmptyStateTemplate {
  name: string;
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  illustration: string;
}

// Common empty state templates
const EMPTY_STATE_TEMPLATES: Record<string, EmptyStateTemplate> = {
  'no-data': {
    name: 'NoData',
    icon: 'FileX',
    title: 'No data available',
    description: 'There is no data to display at the moment. Start by adding your first item.',
    actionLabel: 'Add New Item',
    illustration: 'empty-inbox',
  },
  'no-results': {
    name: 'NoResults',
    icon: 'SearchX',
    title: 'No results found',
    description: 'We couldn\'t find any results matching your search. Try adjusting your filters.',
    actionLabel: 'Clear Filters',
    illustration: 'search',
  },
  'no-companies': {
    name: 'NoCompanies',
    icon: 'Building2',
    title: 'No companies yet',
    description: 'Start tracking your clients by adding your first company.',
    actionLabel: 'Add Company',
    actionHref: '/companies/new',
    illustration: 'building',
  },
  'no-keywords': {
    name: 'NoKeywords',
    icon: 'Tag',
    title: 'No keywords tracked',
    description: 'Add keywords to start tracking your search rankings.',
    actionLabel: 'Add Keywords',
    illustration: 'target',
  },
  'no-audits': {
    name: 'NoAudits',
    icon: 'Search',
    title: 'No audits yet',
    description: 'Run your first SEO audit to get insights and recommendations.',
    actionLabel: 'Run Audit',
    illustration: 'clipboard',
  },
  'first-time': {
    name: 'FirstTime',
    icon: 'Sparkles',
    title: 'Welcome!',
    description: 'Get started by setting up your first project. We\'ll guide you through the process.',
    actionLabel: 'Get Started',
    illustration: 'rocket',
  },
};

interface PageAnalysis {
  file: string;
  hasDataFetching: boolean;
  hasEmptyState: boolean;
  dataPattern: string;
  suggestedTemplate: string;
  confidence: number;
}

async function analyzePages(): Promise<PageAnalysis[]> {
  console.log('🔍 Empty State Component Generator\n');

  const files = await glob('app/**/page.tsx', {
    cwd: process.cwd(),
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**'],
  });

  console.log(`📁 Scanning ${files.length} page files\n`);

  const analyses: PageAnalysis[] = [];

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = await readFile(filePath, 'utf-8');

    // Check for data fetching patterns
    const hasUseEffect = content.includes('useEffect');
    const hasFetch = content.includes('fetch(') || content.includes('axios') || content.includes('supabase');
    const hasUseState = content.includes('useState');
    const hasAsync = content.includes('async');

    const hasDataFetching = (hasUseEffect && (hasFetch || hasAsync)) || (hasUseState && hasFetch);

    // Check if already has empty state handling
    const hasEmptyState =
      content.includes('No data') ||
      content.includes('No results') ||
      content.includes('empty') ||
      content.includes('length === 0') ||
      content.includes('?.length') ||
      content.includes('EmptyState');

    // Determine data pattern
    let dataPattern = 'unknown';
    let suggestedTemplate = 'no-data';
    let confidence = 50;

    if (file.includes('companies')) {
      dataPattern = 'companies';
      suggestedTemplate = 'no-companies';
      confidence = 90;
    } else if (file.includes('keywords')) {
      dataPattern = 'keywords';
      suggestedTemplate = 'no-keywords';
      confidence = 90;
    } else if (file.includes('audits') || file.includes('audit')) {
      dataPattern = 'audits';
      suggestedTemplate = 'no-audits';
      confidence = 90;
    } else if (file.includes('dashboard')) {
      dataPattern = 'dashboard';
      suggestedTemplate = 'first-time';
      confidence = 70;
    } else if (content.includes('search') || content.includes('filter')) {
      dataPattern = 'search-results';
      suggestedTemplate = 'no-results';
      confidence = 75;
    }

    if (hasDataFetching && !hasEmptyState) {
      analyses.push({
        file,
        hasDataFetching,
        hasEmptyState,
        dataPattern,
        suggestedTemplate,
        confidence,
      });
    }
  }

  return analyses;
}

function generateEmptyStateComponent(template: EmptyStateTemplate): string {
  return `import { ${template.icon} } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ${template.name}Props {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function ${template.name}({
  title = "${template.title}",
  description = "${template.description}",
  actionLabel = "${template.actionLabel}",
  onAction,
  ${template.actionHref ? `actionHref = "${template.actionHref}",` : 'actionHref,'}
}: ${template.name}Props) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <${template.icon} className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
        {(onAction || actionHref) && (
          <Button
            onClick={onAction}
            ${template.actionHref ? `asChild` : ''}
          >
            ${template.actionHref ? `<a href={actionHref}>{actionLabel}</a>` : '{actionLabel}'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
`;
}

function generateUsageExample(template: EmptyStateTemplate, dataVariable: string): string {
  return `
// Example usage in your page component:
import { ${template.name} } from '@/components/empty-states/${template.name}';

// Inside your component:
{${dataVariable}.length === 0 ? (
  <${template.name} />
) : (
  // Your data display logic here
  ${dataVariable}.map(item => ...)
)}
`;
}

async function generateEmptyStates(): Promise<void> {
  const analyses = await analyzePages();

  if (analyses.length === 0) {
    console.log('✨ All pages already have empty state handling!\n');
    return;
  }

  console.log('📊 Analysis Results:\n');
  console.log(`Found ${analyses.length} pages that need empty states:\n`);

  // Create components directory if it doesn't exist
  const componentsDir = path.join(process.cwd(), 'components', 'empty-states');
  if (!existsSync(componentsDir)) {
    await mkdir(componentsDir, { recursive: true });
  }

  const generatedComponents = new Set<string>();

  for (const analysis of analyses) {
    console.log(`📄 ${analysis.file}`);
    console.log(`   Pattern: ${analysis.dataPattern}`);
    console.log(`   Suggested: ${analysis.suggestedTemplate} (${analysis.confidence}% confidence)`);

    const template = EMPTY_STATE_TEMPLATES[analysis.suggestedTemplate];
    if (!template) continue;

    // Generate component if not already created
    if (!generatedComponents.has(template.name)) {
      const componentPath = path.join(componentsDir, `${template.name}.tsx`);

      if (!existsSync(componentPath)) {
        const componentCode = generateEmptyStateComponent(template);
        await writeFile(componentPath, componentCode, 'utf-8');
        console.log(`   ✓ Generated component: components/empty-states/${template.name}.tsx`);
      } else {
        console.log(`   ○ Component already exists: components/empty-states/${template.name}.tsx`);
      }

      generatedComponents.add(template.name);
    }

    // Suggest data variable name from file path
    const dataVarName = analysis.dataPattern === 'companies'
      ? 'companies'
      : analysis.dataPattern === 'keywords'
      ? 'keywords'
      : analysis.dataPattern === 'audits'
      ? 'audits'
      : 'data';

    console.log(`   💡 Usage example:`);
    console.log(generateUsageExample(template, dataVarName).split('\n').map(l => `      ${l}`).join('\n'));
    console.log('');
  }

  // Create index file for easy imports
  const indexPath = path.join(componentsDir, 'index.ts');
  const exports = Array.from(generatedComponents)
    .map(name => `export { ${name} } from './${name}';`)
    .join('\n');

  await writeFile(indexPath, exports + '\n', 'utf-8');

  console.log('\n📊 Summary:\n');
  console.log(`✅ Generated ${generatedComponents.size} empty state components`);
  console.log(`✅ Analyzed ${analyses.length} pages`);
  console.log(`✅ Created index file for easy imports\n`);

  console.log('💡 Next Steps:');
  console.log('1. Review generated components in components/empty-states/');
  console.log('2. Customize titles, descriptions, and actions as needed');
  console.log('3. Add empty state checks to the suggested pages');
  console.log('4. Test the empty states with no data scenarios');
  console.log('5. Commit: git add -A && git commit -m "feat: add empty state components for better UX"');
}

// Run the script
generateEmptyStates().catch(console.error);
