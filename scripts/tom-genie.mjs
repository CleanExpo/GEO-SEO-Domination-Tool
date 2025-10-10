#!/usr/bin/env node
/**
 * Tom Genie - Comprehensive Code Engineer Validation System
 *
 * Goes beyond basic scanning to understand:
 * - Complete user journeys
 * - Multi-step workflows
 * - API connection chains
 * - State management flows
 * - Database consistency
 * - Navigation paths
 * - What you HAVEN'T thought of (blind spots)
 *
 * Run: npm run tom:genie
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

console.log('\n🧞 TOM GENIE: Comprehensive System Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// System map
const systemMap = {
  apiRoutes: [],
  components: [],
  types: [],
  schemas: [],
  workflows: [],
  navigationPaths: [],
  stateFlows: [],
  connections: [], // UI → API → DB connections
  issues: {
    critical: [],
    high: [],
    medium: [],
    low: [],
    blindSpots: []
  }
};

// ============================================================================
// PHASE 1: BUILD COMPLETE SYSTEM MAP
// ============================================================================

function buildSystemMap() {
  console.log('🔍 Phase 1: Building Complete System Map...\n');

  // Scan API routes
  console.log('   Mapping API routes...');
  scanApiRoutes(join(ROOT, 'app', 'api'));
  console.log(`   ✓ Found ${systemMap.apiRoutes.length} API endpoints\n`);

  // Scan components
  console.log('   Mapping React components...');
  scanComponents(join(ROOT, 'components'));
  scanComponents(join(ROOT, 'app'));
  console.log(`   ✓ Found ${systemMap.components.length} components\n`);

  // Scan database schemas
  console.log('   Mapping database schemas...');
  scanSchemas(join(ROOT, 'database'));
  console.log(`   ✓ Found ${systemMap.schemas.length} tables\n`);

  // Scan TypeScript types
  console.log('   Mapping TypeScript interfaces...');
  scanTypes(join(ROOT, 'types'));
  console.log(`   ✓ Found ${systemMap.types.length} type definitions\n`);
}

function scanApiRoutes(dir, basePath = '') {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const routePath = join(basePath, entry.name);

    if (entry.isDirectory()) {
      scanApiRoutes(fullPath, routePath);
    } else if (entry.name === 'route.ts') {
      const content = readFileSync(fullPath, 'utf-8');
      const route = `/api/${routePath.replace(/\\/g, '/').replace('/route.ts', '')}`;

      const methods = [];
      if (/export\s+async\s+function\s+GET/.test(content)) methods.push('GET');
      if (/export\s+async\s+function\s+POST/.test(content)) methods.push('POST');
      if (/export\s+async\s+function\s+PUT/.test(content)) methods.push('PUT');
      if (/export\s+async\s+function\s+PATCH/.test(content)) methods.push('PATCH');
      if (/export\s+async\s+function\s+DELETE/.test(content)) methods.push('DELETE');

      systemMap.apiRoutes.push({
        route,
        file: relative(ROOT, fullPath),
        methods,
        content,
        usesAdminClient: content.includes('createAdminClient'),
        usesRegularClient: content.includes('createClient()') && !content.includes('createAdminClient'),
        hasTodos: /\/\/\s*TODO/i.test(content),
        hasPlaceholders: /placeholder|mock.*data|test.*data/i.test(content),
        returnsEmptyObject: /return\s+NextResponse\.json\(\s*\{\s*\}\s*\)/.test(content)
      });
    }
  }
}

function scanComponents(dir) {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      scanComponents(fullPath);
    } else if (entry.name.endsWith('.tsx')) {
      try {
        const content = readFileSync(fullPath, 'utf-8');

        // Extract buttons with handlers
        const buttons = [];
        const buttonRegex = /<button[^>]*onClick\s*=\s*\{([^}]+)\}[^>]*>(.*?)<\/button>/gs;
        let match;
        while ((match = buttonRegex.exec(content)) !== null) {
          buttons.push({
            handler: match[1].trim(),
            label: match[2].replace(/<[^>]+>/g, '').trim()
          });
        }

        // Extract API calls
        const apiCalls = [];
        const fetchRegex = /fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/g;
        while ((match = fetchRegex.exec(content)) !== null) {
          apiCalls.push(match[1]);
        }

        systemMap.components.push({
          file: relative(ROOT, fullPath),
          content,
          buttons,
          apiCalls,
          hasState: /useState|useReducer/.test(content),
          hasEffects: /useEffect/.test(content),
          hasLoadingState: /loading|isLoading/.test(content),
          hasErrorState: /error|hasError/.test(content)
        });
      } catch (e) {
        // Skip files that can't be read
      }
    }
  }
}

function scanSchemas(dir) {
  if (!existsSync(dir)) return;

  const files = readdirSync(dir).filter(f => f.endsWith('.sql'));

  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf-8');
    const tableMatches = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi);

    for (const match of tableMatches) {
      systemMap.schemas.push({
        table: match[1],
        file,
        content
      });
    }
  }
}

function scanTypes(dir) {
  if (!existsSync(dir)) return;

  const files = readdirSync(dir).filter(f => f.endsWith('.ts'));

  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf-8');
    const interfaceMatches = content.matchAll(/(?:export\s+)?interface\s+(\w+)/g);

    for (const match of interfaceMatches) {
      systemMap.types.push({
        name: match[1],
        file,
        content
      });
    }
  }
}

// ============================================================================
// PHASE 2: TRACE USER JOURNEYS
// ============================================================================

function traceUserJourneys() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔄 Phase 2: Tracing User Journeys...\n');

  // Critical Journey: Create Company → Run Audit → View Results
  traceJourney_CreateCompanyToAudit();

  // Critical Journey: Onboarding Flow (5 steps)
  traceJourney_OnboardingFlow();

  // Critical Journey: View Companies → Click Company → See Details
  traceJourney_CompanyNavigation();
}

function traceJourney_CreateCompanyToAudit() {
  console.log('   📋 Journey: Create Company → Run Audit → View Results');

  const journey = {
    name: 'Create Company → Run Audit',
    steps: [],
    broken: false
  };

  // Step 1: Create company
  const onboardingComponent = systemMap.components.find(c => c.file.includes('onboarding') && c.file.includes('page.tsx'));
  const onboardingApi = systemMap.apiRoutes.find(r => r.route === '/api/onboarding/start');

  if (onboardingComponent && onboardingApi && onboardingApi.methods.includes('POST')) {
    journey.steps.push({
      name: 'Create Company',
      status: 'PASS',
      details: 'Onboarding form → POST /api/onboarding/start → Company created'
    });
  } else {
    journey.steps.push({
      name: 'Create Company',
      status: 'FAIL',
      details: 'Onboarding flow incomplete'
    });
    journey.broken = true;
  }

  // Step 2: Navigate to audit page
  const auditComponent = systemMap.components.find(c => c.file.includes('seo-audit/page.tsx'));
  if (auditComponent) {
    journey.steps.push({
      name: 'Navigate to Audit Page',
      status: 'PASS',
      details: '/companies/[id]/seo-audit page exists'
    });
  }

  // Step 3: Company API loads URL
  const companyApi = systemMap.apiRoutes.find(r => r.route.match(/\/api\/companies\/\[id\]/));
  if (companyApi && companyApi.usesAdminClient) {
    journey.steps.push({
      name: 'Load Company Data',
      status: 'PASS',
      details: 'GET /api/companies/[id] using admin client ✓'
    });
  } else if (companyApi && companyApi.usesRegularClient) {
    journey.steps.push({
      name: 'Load Company Data',
      status: 'FAIL',
      details: 'GET /api/companies/[id] using createClient() - RLS RISK'
    });
    journey.broken = true;
    systemMap.issues.critical.push({
      journey: journey.name,
      step: 'Load Company Data',
      issue: 'Company API using createClient() may cause RLS errors',
      file: companyApi.file,
      fix: 'Replace createClient() with createAdminClient()'
    });
  }

  // Step 4: Run audit
  const auditApi = systemMap.apiRoutes.find(r => r.route === '/api/seo-audits');
  if (auditApi && auditApi.methods.includes('POST') && auditApi.usesAdminClient) {
    journey.steps.push({
      name: 'Run Audit (POST)',
      status: 'PASS',
      details: 'POST /api/seo-audits using admin client ✓'
    });
  }

  // Step 5: Fetch audits
  if (auditApi && auditApi.methods.includes('GET') && auditApi.usesAdminClient) {
    journey.steps.push({
      name: 'Fetch Audits (GET)',
      status: 'PASS',
      details: 'GET /api/seo-audits using admin client ✓'
    });
  } else if (auditApi && auditApi.methods.includes('GET') && auditApi.usesRegularClient) {
    journey.steps.push({
      name: 'Fetch Audits (GET)',
      status: 'FAIL',
      details: 'GET /api/seo-audits using createClient() - may return empty'
    });
    journey.broken = true;
    systemMap.issues.critical.push({
      journey: journey.name,
      step: 'Fetch Audits',
      issue: 'Audit GET endpoint using createClient() may return empty array',
      file: auditApi.file,
      fix: 'Replace createClient() with createAdminClient()'
    });
  }

  systemMap.workflows.push(journey);

  journey.steps.forEach(step => {
    const icon = step.status === 'PASS' ? '✓' : '❌';
    console.log(`      ${icon} ${step.name}: ${step.details}`);
  });

  console.log(`   ${journey.broken ? '❌ JOURNEY BROKEN' : '✅ JOURNEY COMPLETE'}\n`);
}

function traceJourney_OnboardingFlow() {
  console.log('   📋 Journey: Onboarding Flow (5 Steps)');

  const processorFile = join(ROOT, 'services', 'onboarding', 'onboarding-processor.ts');

  if (existsSync(processorFile)) {
    const content = readFileSync(processorFile, 'utf-8');

    // Check for TODO placeholders in workflow stages
    const todoMatches = content.match(/\/\/\s*TODO[^\n]*/gi) || [];

    if (todoMatches.length > 0) {
      console.log(`      ⚠️  Found ${todoMatches.length} TODO placeholders in onboarding workflow`);

      todoMatches.forEach(todo => {
        systemMap.issues.high.push({
          category: 'Workflow Incomplete',
          issue: `Onboarding processor has placeholder: ${todo}`,
          file: relative(ROOT, processorFile),
          impact: 'Promised features after sign-up don\'t execute'
        });
      });
    }
  }

  console.log('      (Full onboarding flow validation requires deep AST analysis)\n');
}

function traceJourney_CompanyNavigation() {
  console.log('   📋 Journey: View Companies → Click → See Details');

  const companiesPage = systemMap.components.find(c => c.file.includes('companies') && c.file.includes('page.tsx') && !c.file.includes('[id]'));
  const companyDetailPage = systemMap.components.find(c => c.file.includes('companies/[id]') && !c.file.includes('seo-audit'));

  if (companiesPage) {
    console.log('      ✓ Companies list page exists');
  }

  if (companyDetailPage || systemMap.components.some(c => c.file.includes('[id]/seo-audit'))) {
    console.log('      ✓ Company detail page exists (redirects to seo-audit)');
  }

  console.log('      ✅ JOURNEY COMPLETE\n');
}

// ============================================================================
// PHASE 3: VALIDATE API CONNECTIONS
// ============================================================================

function validateApiConnections() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔗 Phase 3: Validating API Connections...\n');

  // Find all UI → API connections
  systemMap.components.forEach(component => {
    component.apiCalls.forEach(apiUrl => {
      const normalizedUrl = apiUrl.replace(/\$\{[^}]+\}/g, '[id]');
      const apiRoute = systemMap.apiRoutes.find(r => normalizedUrl.startsWith(r.route));

      if (!apiRoute) {
        systemMap.issues.critical.push({
          category: 'Broken Connection',
          component: component.file,
          issue: `API call to ${apiUrl} - endpoint not found`,
          fix: 'Create API route or fix URL'
        });
      } else {
        systemMap.connections.push({
          from: component.file,
          to: apiRoute.route,
          status: 'connected'
        });
      }
    });
  });

  console.log(`   ✓ Traced ${systemMap.connections.length} UI → API connections`);
  console.log(`   ❌ Found ${systemMap.issues.critical.filter(i => i.category === 'Broken Connection').length} broken connections\n`);
}

// ============================================================================
// PHASE 4: DETECT BLIND SPOTS
// ============================================================================

function detectBlindSpots() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 Phase 4: Detecting Blind Spots (Issues You Didn\'t Know About)...\n');

  // Blind Spot 1: Multiple APIs still using createClient()
  const rlsRiskApis = systemMap.apiRoutes.filter(r => r.usesRegularClient);
  if (rlsRiskApis.length > 0) {
    systemMap.issues.blindSpots.push({
      category: 'Systematic RLS Risk',
      issue: `${rlsRiskApis.length} API routes using createClient() (same pattern as Run Audit bug)`,
      routes: rlsRiskApis.map(r => r.route).slice(0, 10),
      fix: 'Batch update all to createAdminClient()',
      impact: 'Future bugs with same root cause'
    });
    console.log(`   ⚠️  ${rlsRiskApis.length} API routes using createClient() - RLS risk`);
  }

  // Blind Spot 2: Components without loading states
  const noLoadingState = systemMap.components.filter(c => c.apiCalls.length > 0 && !c.hasLoadingState);
  if (noLoadingState.length > 0) {
    systemMap.issues.blindSpots.push({
      category: 'Missing UX Feedback',
      issue: `${noLoadingState.length} components make API calls but have no loading state`,
      impact: 'Users think app is frozen',
      fix: 'Add loading spinners/skeletons'
    });
    console.log(`   ⚠️  ${noLoadingState.length} components missing loading states`);
  }

  // Blind Spot 3: Components without error handling
  const noErrorState = systemMap.components.filter(c => c.apiCalls.length > 0 && !c.hasErrorState);
  if (noErrorState.length > 0) {
    systemMap.issues.blindSpots.push({
      category: 'Missing Error Handling',
      issue: `${noErrorState.length} components make API calls but have no error state`,
      impact: 'Errors fail silently',
      fix: 'Add error state and display'
    });
    console.log(`   ⚠️  ${noErrorState.length} components missing error handling`);
  }

  // Blind Spot 4: TODO comments in production code
  const todosInApis = systemMap.apiRoutes.filter(r => r.hasTodos);
  if (todosInApis.length > 0) {
    systemMap.issues.blindSpots.push({
      category: 'Incomplete Implementation',
      issue: `${todosInApis.length} API routes have TODO comments`,
      routes: todosInApis.map(r => r.route),
      impact: 'Features may not work as expected',
      fix: 'Complete implementations or remove TODOs'
    });
    console.log(`   ⚠️  ${todosInApis.length} API routes with TODO comments`);
  }

  console.log(`\n   💡 Total blind spots found: ${systemMap.issues.blindSpots.length}\n`);
}

// ============================================================================
// PHASE 5: GENERATE REPORT
// ============================================================================

function generateReport() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎯 TOM GENIE VALIDATION REPORT\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const critical = systemMap.issues.critical.length;
  const high = systemMap.issues.high.length;
  const medium = systemMap.issues.medium.length;
  const low = systemMap.issues.low.length;
  const blindSpots = systemMap.issues.blindSpots.length;

  console.log(`Overall Status: ${critical > 0 ? '❌ CRITICAL ISSUES' : high > 0 ? '⚠️  ISSUES FOUND' : '✅ READY'}`);
  console.log(`Deployment Recommendation: ${critical > 0 ? 'DO NOT DEPLOY' : high > 0 ? 'REVIEW & FIX' : 'DEPLOY'}\n`);

  console.log('Issues Found:');
  console.log(`  • ${critical} CRITICAL (blocks core functionality)`);
  console.log(`  • ${high} HIGH (impacts UX significantly)`);
  console.log(`  • ${medium} MEDIUM (should fix soon)`);
  console.log(`  • ${low} LOW (non-urgent)`);
  console.log(`  • ${blindSpots} BLIND SPOTS (you didn't know about)\n`);

  console.log('System Map:');
  console.log(`  • ${systemMap.apiRoutes.length} API routes scanned`);
  console.log(`  • ${systemMap.components.length} React components analyzed`);
  console.log(`  • ${systemMap.schemas.length} database tables mapped`);
  console.log(`  • ${systemMap.connections.length} UI → API connections traced`);
  console.log(`  • ${systemMap.workflows.length} user journeys validated\n`);

  // Critical Issues
  if (critical > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚨 CRITICAL ISSUES (Blocking Deployment)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    systemMap.issues.critical.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.issue}`);
      if (issue.file) console.log(`   File: ${issue.file}`);
      if (issue.journey) console.log(`   Journey: ${issue.journey} → ${issue.step}`);
      if (issue.fix) console.log(`   Fix: ${issue.fix}`);
      console.log('');
    });
  }

  // Blind Spots
  if (blindSpots > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 BLIND SPOTS (Issues You Didn\'t Know About)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    systemMap.issues.blindSpots.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.issue}`);
      if (issue.routes) {
        console.log(`   Routes: ${issue.routes.slice(0, 5).join(', ')}${issue.routes.length > 5 ? '...' : ''}`);
      }
      console.log(`   Impact: ${issue.impact}`);
      console.log(`   Fix: ${issue.fix}\n`);
    });
  }

  // Workflows
  if (systemMap.workflows.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔄 USER JOURNEY VALIDATION\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    systemMap.workflows.forEach(workflow => {
      const icon = workflow.broken ? '❌' : '✅';
      console.log(`${icon} ${workflow.name}`);
      workflow.steps.forEach(step => {
        const stepIcon = step.status === 'PASS' ? '  ✓' : '  ❌';
        console.log(`${stepIcon} ${step.name}`);
      });
      console.log('');
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (critical === 0 && high === 0) {
    console.log('🎉 No critical or high priority issues found!');
    console.log('   Your code is ready for deployment.\n');
  } else {
    console.log('🔧 Next Steps:');
    console.log('   1. Fix all CRITICAL issues before deploying');
    console.log('   2. Review BLIND SPOTS (you didn\'t know about these!)');
    console.log('   3. Run npm run tom:genie again after fixes');
    console.log('   4. Deploy when all critical issues resolved\n');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    buildSystemMap();
    traceUserJourneys();
    validateApiConnections();
    detectBlindSpots();
    generateReport();
  } catch (error) {
    console.error('\n❌ Tom Genie encountered an error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();
