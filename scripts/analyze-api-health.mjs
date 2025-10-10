/**
 * Static API Health Analysis
 * Analyzes code without testing endpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, '..', 'app', 'api');

function findAllRoutes(dir, basePath = '') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const routePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      routes.push(...findAllRoutes(fullPath, routePath));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      routes.push({
        path: '/api' + basePath.replace(/\\/g, '/'),
        file: fullPath
      });
    }
  }

  return routes;
}

function analyzeRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  return {
    // HTTP Methods
    hasGET: /export\s+async\s+function\s+GET/.test(content),
    hasPOST: /export\s+async\s+function\s+POST/.test(content),
    hasPUT: /export\s+async\s+function\s+PUT/.test(content),
    hasDELETE: /export\s+async\s+function\s+DELETE/.test(content),

    // Data sources
    hasDatabase: /getDatabase|createClient|db\./.test(content),
    hasSupabase: /supabase|createClient.*supabase/.test(content),

    // External APIs
    hasDeepSeek: /deepseek|DeepSeek|DEEPSEEK_API/.test(content),
    hasGoogle: /GOOGLE_API_KEY|googleapis|maps\.googleapis/.test(content),
    hasFirecrawl: /firecrawl|Firecrawl|FIRECRAWL_API/.test(content),
    hasSEMrush: /SEMRUSH|semrush/.test(content),
    hasAhrefs: /AHREFS|ahrefs/.test(content),
    hasOpenAI: /OPENAI|openai|gpt/.test(content),
    hasAnthropic: /ANTHROPIC|anthropic|claude/i.test(content),

    // Implementation quality
    hasPlaceholder: /Not implemented|TODO|Coming soon|placeholder|Mock/i.test(content),
    hasMockData: /mock\s+data|dummy|fake\s+data|sample\s+data/i.test(content),
    hasErrorHandling: /try\s*{|catch\s*\(/g.test(content),
    hasValidation: /zod|validator|validate|schema/i.test(content),

    // Code metrics
    linesOfCode: lines.length,
    hasComments: /\/\*\*|\/\//.test(content),
    complexity: (content.match(/if\s*\(|for\s*\(|while\s*\(|switch\s*\(/g) || []).length,
  };
}

function categorizeEndpoint(analysis, apiPath) {
  // Placeholder
  if (analysis.hasPlaceholder || analysis.hasMockData) {
    return 'PLACEHOLDER';
  }

  // No implementation
  if (analysis.linesOfCode < 20 && !analysis.hasDatabase) {
    return 'STUB';
  }

  // Missing error handling
  if (!analysis.hasErrorHandling && analysis.linesOfCode > 30) {
    return 'NEEDS_ERROR_HANDLING';
  }

  // Has database connection
  if (analysis.hasDatabase || analysis.hasSupabase) {
    return 'WORKING';
  }

  // Has external API
  if (analysis.hasDeepSeek || analysis.hasGoogle || analysis.hasFirecrawl) {
    return 'WORKING';
  }

  // Default
  return 'UNKNOWN';
}

function main() {
  console.log('🔍 Analyzing API Health...\n');

  const routes = findAllRoutes(API_DIR);
  console.log(`📊 Found ${routes.length} API endpoints\n`);

  const stats = {
    total: routes.length,
    working: 0,
    placeholders: 0,
    stubs: 0,
    needsErrorHandling: 0,
    unknown: 0,
    byCategory: {},
    externalAPIs: {
      deepseek: 0,
      google: 0,
      firecrawl: 0,
      semrush: 0,
      openai: 0,
      anthropic: 0
    }
  };

  const detailed = [];

  for (const route of routes) {
    const analysis = analyzeRoute(route.file);
    const status = categorizeEndpoint(analysis, route.path);

    // Count by status
    if (status === 'WORKING') stats.working++;
    else if (status === 'PLACEHOLDER') stats.placeholders++;
    else if (status === 'STUB') stats.stubs++;
    else if (status === 'NEEDS_ERROR_HANDLING') stats.needsErrorHandling++;
    else stats.unknown++;

    // Count external APIs
    if (analysis.hasDeepSeek) stats.externalAPIs.deepseek++;
    if (analysis.hasGoogle) stats.externalAPIs.google++;
    if (analysis.hasFirecrawl) stats.externalAPIs.firecrawl++;
    if (analysis.hasSEMrush) stats.externalAPIs.semrush++;
    if (analysis.hasOpenAI) stats.externalAPIs.openai++;
    if (analysis.hasAnthropic) stats.externalAPIs.anthropic++;

    // Categorize by path
    const category = route.path.split('/')[2] || 'root';
    if (!stats.byCategory[category]) {
      stats.byCategory[category] = { total: 0, working: 0, issues: 0 };
    }
    stats.byCategory[category].total++;
    if (status === 'WORKING') stats.byCategory[category].working++;
    else stats.byCategory[category].issues++;

    detailed.push({ ...route, status, analysis });
  }

  // Print report
  console.log('='.repeat(80));
  console.log('📊 API HEALTH REPORT');
  console.log('='.repeat(80));
  console.log(`\nTotal Endpoints: ${stats.total}`);
  console.log(`✅ Working: ${stats.working} (${(stats.working/stats.total*100).toFixed(1)}%)`);
  console.log(`⚠️  Placeholders: ${stats.placeholders} (${(stats.placeholders/stats.total*100).toFixed(1)}%)`);
  console.log(`📝 Stubs (< 20 lines): ${stats.stubs} (${(stats.stubs/stats.total*100).toFixed(1)}%)`);
  console.log(`🔧 Needs Error Handling: ${stats.needsErrorHandling}`);
  console.log(`❓ Unknown: ${stats.unknown}`);

  console.log('\n🔌 EXTERNAL API USAGE:');
  console.log(`   DeepSeek: ${stats.externalAPIs.deepseek}`);
  console.log(`   Google: ${stats.externalAPIs.google}`);
  console.log(`   Firecrawl: ${stats.externalAPIs.firecrawl}`);
  console.log(`   SEMrush: ${stats.externalAPIs.semrush}`);
  console.log(`   OpenAI: ${stats.externalAPIs.openai}`);
  console.log(`   Anthropic: ${stats.externalAPIs.anthropic}`);

  console.log('\n📂 BY CATEGORY:');
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15)
    .forEach(([cat, data]) => {
      const pct = (data.working / data.total * 100).toFixed(0);
      console.log(`   ${cat.padEnd(20)} ${data.working}/${data.total} (${pct}%)`);
    });

  console.log('\n⚠️  PLACEHOLDER ENDPOINTS:');
  detailed
    .filter(r => r.status === 'PLACEHOLDER')
    .forEach(r => console.log(`   - ${r.path}`));

  console.log('\n📝 STUB ENDPOINTS (< 20 lines):');
  detailed
    .filter(r => r.status === 'STUB')
    .slice(0, 10)
    .forEach(r => console.log(`   - ${r.path} (${r.analysis.linesOfCode} lines)`));

  console.log('\n💡 COMPLETION ESTIMATE:');
  const completionPct = (stats.working / stats.total * 100).toFixed(1);
  const remaining = stats.total - stats.working;
  const hoursPerEndpoint = 0.5; // Conservative estimate
  const totalHours = remaining * hoursPerEndpoint;
  console.log(`   Current: ${completionPct}%`);
  console.log(`   Remaining: ${remaining} endpoints`);
  console.log(`   Estimated time: ${totalHours} hours (${(totalHours/8).toFixed(1)} days)`);
  console.log(`   Target: 100% fully functional`);

  console.log('\n' + '='.repeat(80));

  // Save report
  fs.writeFileSync(
    path.join(__dirname, '..', 'API_HEALTH_REPORT.json'),
    JSON.stringify({ stats, detailed }, null, 2)
  );
  console.log('📄 Detailed report saved to: API_HEALTH_REPORT.json\n');
}

main();
