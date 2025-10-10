/**
 * Comprehensive API Audit
 * Tests ALL 127 API endpoints to identify:
 * - Working endpoints
 * - Placeholder/mock endpoints
 * - Missing implementations
 * - Broken endpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, '..', 'app', 'api');
const BASE_URL = 'http://localhost:3000';

// Known working endpoints (from previous tests)
const KNOWN_WORKING = [
  '/api/workspace/save',
  '/api/workspace/load',
  '/api/workspace/list',
  '/api/onboarding/lookup',
  '/api/rankings',
  '/api/keywords',
  '/api/seo-audits'
];

async function findAllRoutes(dir, basePath = '') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const routePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      routes.push(...await findAllRoutes(fullPath, routePath));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      const apiPath = '/api' + basePath.replace(/\\/g, '/');
      routes.push({ file: fullPath, path: apiPath });
    }
  }

  return routes;
}

async function testEndpoint(apiPath) {
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const results = [];

  for (const method of methods) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (method === 'POST' || method === 'PUT') {
        options.body = JSON.stringify({});
      }

      const response = await fetch(BASE_URL + apiPath, options);
      const text = await response.text();

      // Check if it's a placeholder
      const isPlaceholder =
        text.includes('Not implemented') ||
        text.includes('Coming soon') ||
        text.includes('TODO') ||
        text.includes('placeholder') ||
        text.includes('mock data') ||
        (response.status === 501);

      results.push({
        method,
        status: response.status,
        isPlaceholder,
        bodyLength: text.length,
        hasData: text.length > 50
      });

    } catch (error) {
      results.push({
        method,
        status: 'ERROR',
        error: error.message
      });
    }
  }

  return results;
}

async function analyzeRouteFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  const analysis = {
    hasGET: /export\s+async\s+function\s+GET/.test(content),
    hasPOST: /export\s+async\s+function\s+POST/.test(content),
    hasPUT: /export\s+async\s+function\s+PUT/.test(content),
    hasDELETE: /export\s+async\s+function\s+DELETE/.test(content),
    hasDatabase: /getDatabase|createClient|supabase/.test(content),
    hasDeepSeek: /deepseek|DeepSeek/.test(content),
    hasFirecrawl: /firecrawl|Firecrawl/.test(content),
    hasGoogle: /GOOGLE_API_KEY|googleapis/.test(content),
    hasSEMrush: /SEMRUSH|semrush/.test(content),
    hasPlaceholder: /Not implemented|TODO|Coming soon|placeholder/i.test(content),
    hasMockData: /mock|dummy|fake|sample\s+data/i.test(content),
    linesOfCode: content.split('\n').length
  };

  return analysis;
}

async function main() {
  console.log('🔍 Starting comprehensive API audit...\n');

  const routes = await findAllRoutes(API_DIR);
  console.log(`📊 Found ${routes.length} API endpoints\n`);

  const results = {
    total: routes.length,
    working: 0,
    placeholders: 0,
    broken: 0,
    missing: 0,
    endpoints: []
  };

  let tested = 0;

  for (const route of routes) {
    tested++;
    console.log(`[${tested}/${routes.length}] Testing ${route.path}...`);

    const fileAnalysis = await analyzeRouteFile(route.file);
    const testResults = await testEndpoint(route.path);

    const hasWorkingMethod = testResults.some(r =>
      r.status === 200 || r.status === 201 ||
      (r.status >= 400 && r.status < 500 && !r.isPlaceholder)
    );

    const status =
      fileAnalysis.hasPlaceholder || fileAnalysis.hasMockData ? 'PLACEHOLDER' :
      !hasWorkingMethod ? 'BROKEN' :
      hasWorkingMethod && fileAnalysis.hasDatabase ? 'WORKING' :
      'PARTIAL';

    if (status === 'WORKING') results.working++;
    else if (status === 'PLACEHOLDER') results.placeholders++;
    else if (status === 'BROKEN') results.broken++;

    results.endpoints.push({
      path: route.path,
      file: route.file.replace(/\\/g, '/'),
      status,
      analysis: fileAnalysis,
      tests: testResults
    });

    // Rate limit to avoid overwhelming server
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('📊 API AUDIT REPORT');
  console.log('='.repeat(80));
  console.log(`\nTotal Endpoints: ${results.total}`);
  console.log(`✅ Working: ${results.working} (${(results.working/results.total*100).toFixed(1)}%)`);
  console.log(`⚠️  Placeholders: ${results.placeholders} (${(results.placeholders/results.total*100).toFixed(1)}%)`);
  console.log(`❌ Broken: ${results.broken} (${(results.broken/results.total*100).toFixed(1)}%)`);

  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'API_AUDIT_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: API_AUDIT_REPORT.json`);

  // Show placeholders
  console.log('\n⚠️  PLACEHOLDER ENDPOINTS:');
  results.endpoints
    .filter(e => e.status === 'PLACEHOLDER')
    .forEach(e => console.log(`   - ${e.path}`));

  // Show broken endpoints
  console.log('\n❌ BROKEN ENDPOINTS:');
  results.endpoints
    .filter(e => e.status === 'BROKEN')
    .forEach(e => console.log(`   - ${e.path}`));

  // Show endpoints using external APIs
  console.log('\n🔌 ENDPOINTS USING EXTERNAL APIs:');
  const withAPIs = results.endpoints.filter(e =>
    e.analysis.hasDeepSeek || e.analysis.hasGoogle ||
    e.analysis.hasSEMrush || e.analysis.hasFirecrawl
  );
  console.log(`   DeepSeek: ${withAPIs.filter(e => e.analysis.hasDeepSeek).length}`);
  console.log(`   Google: ${withAPIs.filter(e => e.analysis.hasGoogle).length}`);
  console.log(`   SEMrush: ${withAPIs.filter(e => e.analysis.hasSEMrush).length}`);
  console.log(`   Firecrawl: ${withAPIs.filter(e => e.analysis.hasFirecrawl).length}`);

  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
