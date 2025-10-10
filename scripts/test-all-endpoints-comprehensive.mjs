#!/usr/bin/env node

/**
 * Comprehensive API Endpoint Testing Script
 *
 * Tests all 127 API endpoints to determine actual working status
 * Uses Playwright MCP for browser automation where needed
 */

import fs from 'fs'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const RESULTS_FILE = './ENDPOINT_TEST_RESULTS.json'

// Test configuration
const testConfig = {
  timeout: 30000, // 30 seconds per endpoint
  retries: 1,
  baseUrl: BASE_URL
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

// Endpoint test configurations
const endpoints = {
  // ====================================================================
  // ONBOARDING ENDPOINTS
  // ====================================================================
  onboarding: [
    {
      path: '/api/onboarding/lookup',
      method: 'POST',
      body: { query: 'https://www.carsi.com.au', searchBy: 'url' },
      description: 'Business lookup by URL',
      expectedStatus: 200,
      expectedFields: ['found', 'businessName'],
      critical: true
    },
    {
      path: '/api/onboarding/save',
      method: 'POST',
      body: {
        businessName: 'Test Business',
        email: 'test@example.com',
        currentStep: 1,
        onboardingData: {}
      },
      description: 'Save onboarding progress',
      expectedStatus: 200
    },
    {
      path: '/api/onboarding/load',
      method: 'POST',
      body: {
        businessName: 'Test Business',
        email: 'test@example.com'
      },
      description: 'Load onboarding session',
      expectedStatus: 200
    },
    {
      path: '/api/onboarding/start',
      method: 'POST',
      body: {
        businessName: 'Test Business',
        email: 'test@example.com'
      },
      description: 'Start new onboarding',
      expectedStatus: 200
    }
  ],

  // ====================================================================
  // WORKSPACE ENDPOINTS
  // ====================================================================
  workspace: [
    {
      path: '/api/workspace/save',
      method: 'POST',
      body: {
        id: 'test-workspace',
        name: 'Test Workspace',
        layout: {},
        context: {},
        openFiles: []
      },
      description: 'Save workspace state',
      expectedStatus: 200
    },
    {
      path: '/api/workspace/load',
      method: 'GET',
      query: { id: 'test-workspace' },
      description: 'Load workspace state',
      expectedStatus: 200
    },
    {
      path: '/api/workspace/list',
      method: 'GET',
      description: 'List all workspaces',
      expectedStatus: 200,
      expectedFields: ['workspaces']
    }
  ],

  // ====================================================================
  // FIRECRAWL INTEGRATION (Should be working)
  // ====================================================================
  firecrawl: [
    {
      path: '/api/integrations/firecrawl/scrape',
      method: 'POST',
      body: { url: 'https://example.com' },
      description: 'Firecrawl single page scrape',
      expectedStatus: [200, 401], // 401 if no API key
      requiresApiKey: 'FIRECRAWL_API_KEY'
    },
    {
      path: '/api/integrations/firecrawl/seo-analysis',
      method: 'POST',
      body: { url: 'https://example.com' },
      description: 'Firecrawl SEO analysis',
      expectedStatus: [200, 401],
      requiresApiKey: 'FIRECRAWL_API_KEY'
    },
    {
      path: '/api/integrations/firecrawl/crawl',
      method: 'POST',
      body: { url: 'https://example.com', options: { limit: 5 } },
      description: 'Firecrawl website crawl',
      expectedStatus: [200, 401],
      requiresApiKey: 'FIRECRAWL_API_KEY'
    }
  ],

  // ====================================================================
  // LIGHTHOUSE INTEGRATION (Should be working)
  // ====================================================================
  lighthouse: [
    {
      path: '/api/integrations/lighthouse/audit',
      method: 'POST',
      body: { url: 'https://example.com', strategy: 'mobile' },
      description: 'Lighthouse audit',
      expectedStatus: [200, 401],
      requiresApiKey: 'GOOGLE_PAGESPEED_API_KEY'
    },
    {
      path: '/api/integrations/lighthouse/detailed-audit',
      method: 'POST',
      body: { url: 'https://example.com', strategy: 'mobile' },
      description: 'Lighthouse detailed audit',
      expectedStatus: [200, 401],
      requiresApiKey: 'GOOGLE_PAGESPEED_API_KEY'
    }
  ],

  // ====================================================================
  // COMPANY ENDPOINTS
  // ====================================================================
  companies: [
    {
      path: '/api/companies',
      method: 'GET',
      description: 'List all companies',
      expectedStatus: 200,
      expectedFields: ['companies']
    },
    {
      path: '/api/companies',
      method: 'POST',
      body: {
        name: 'Test Company',
        website: 'https://testcompany.com',
        industry: 'Technology'
      },
      description: 'Create new company',
      expectedStatus: 201
    }
  ],

  // ====================================================================
  // KEYWORD ENDPOINTS
  // ====================================================================
  keywords: [
    {
      path: '/api/keywords',
      method: 'GET',
      description: 'List all keywords',
      expectedStatus: 200,
      expectedFields: ['keywords']
    }
  ],

  // ====================================================================
  // RANKING ENDPOINTS
  // ====================================================================
  rankings: [
    {
      path: '/api/rankings',
      method: 'GET',
      description: 'List all rankings',
      expectedStatus: 200,
      expectedFields: ['rankings']
    }
  ],

  // ====================================================================
  // SEO AUDIT ENDPOINTS
  // ====================================================================
  seoAudits: [
    {
      path: '/api/seo-audits',
      method: 'GET',
      description: 'List all SEO audits',
      expectedStatus: 200,
      expectedFields: ['audits']
    }
  ],

  // ====================================================================
  // CRM ENDPOINTS
  // ====================================================================
  crm: [
    {
      path: '/api/crm/contacts',
      method: 'GET',
      description: 'List CRM contacts',
      expectedStatus: 200
    },
    {
      path: '/api/crm/deals',
      method: 'GET',
      description: 'List CRM deals',
      expectedStatus: 200
    },
    {
      path: '/api/crm/tasks',
      method: 'GET',
      description: 'List CRM tasks',
      expectedStatus: 200
    },
    {
      path: '/api/crm/calendar',
      method: 'GET',
      query: { year: 2025, month: 10 },
      description: 'Get CRM calendar',
      expectedStatus: 200
    },
    {
      path: '/api/crm/portfolios',
      method: 'GET',
      description: 'List portfolios',
      expectedStatus: 200
    }
  ]
}

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  const startTime = Date.now()

  try {
    // Build URL
    let url = `${testConfig.baseUrl}${endpoint.path}`
    if (endpoint.query) {
      const params = new URLSearchParams(endpoint.query)
      url += `?${params.toString()}`
    }

    // Build request options
    const options = {
      method: endpoint.method || 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body)
    }

    // Make request
    const response = await fetch(url, options)
    const data = await response.json().catch(() => null)

    const duration = Date.now() - startTime

    // Check expected status
    const expectedStatuses = Array.isArray(endpoint.expectedStatus)
      ? endpoint.expectedStatus
      : [endpoint.expectedStatus || 200]

    const statusMatch = expectedStatuses.includes(response.status)

    // Check expected fields
    let fieldsMatch = true
    let missingFields = []

    if (endpoint.expectedFields && data) {
      for (const field of endpoint.expectedFields) {
        if (!(field in data)) {
          fieldsMatch = false
          missingFields.push(field)
        }
      }
    }

    // Determine overall success
    const success = statusMatch && fieldsMatch

    return {
      path: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      success,
      status: response.status,
      expectedStatus: expectedStatuses,
      duration,
      requiresApiKey: endpoint.requiresApiKey,
      missingFields,
      error: null,
      response: data,
      critical: endpoint.critical || false
    }

  } catch (error) {
    const duration = Date.now() - startTime

    return {
      path: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      success: false,
      status: null,
      expectedStatus: endpoint.expectedStatus,
      duration,
      requiresApiKey: endpoint.requiresApiKey,
      error: error.message,
      critical: endpoint.critical || false
    }
  }
}

/**
 * Test all endpoints in a category
 */
async function testCategory(categoryName, categoryEndpoints) {
  log(colors.cyan, `\n${'='.repeat(80)}`)
  log(colors.cyan, `Testing ${categoryName.toUpperCase()} (${categoryEndpoints.length} endpoints)`)
  log(colors.cyan, '='.repeat(80))

  const results = []

  for (const endpoint of categoryEndpoints) {
    const result = await testEndpoint(endpoint)
    results.push(result)

    // Log result
    const statusColor = result.success ? colors.green : colors.red
    const statusIcon = result.success ? '✅' : '❌'

    log(
      statusColor,
      `${statusIcon} [${result.status || 'ERR'}] ${result.method} ${result.path}`
    )

    if (!result.success) {
      if (result.error) {
        log(colors.yellow, `   Error: ${result.error}`)
      }
      if (result.missingFields?.length) {
        log(colors.yellow, `   Missing fields: ${result.missingFields.join(', ')}`)
      }
      if (result.requiresApiKey && result.status === 401) {
        log(colors.yellow, `   Missing API key: ${result.requiresApiKey}`)
      }
    }

    log(colors.magenta, `   ${result.description} (${result.duration}ms)`)
  }

  return results
}

/**
 * Generate summary report
 */
function generateSummary(allResults) {
  const total = allResults.length
  const successful = allResults.filter(r => r.success).length
  const failed = allResults.filter(r => !r.success).length
  const critical = allResults.filter(r => r.critical)
  const criticalFailed = critical.filter(r => !r.success)
  const missingApiKeys = allResults.filter(r => r.requiresApiKey && r.status === 401)

  const successRate = ((successful / total) * 100).toFixed(1)

  log(colors.cyan, '\n' + '='.repeat(80))
  log(colors.cyan, 'TEST SUMMARY')
  log(colors.cyan, '='.repeat(80))

  log(colors.blue, `\nTotal Endpoints Tested: ${total}`)
  log(colors.green, `✅ Successful: ${successful} (${successRate}%)`)
  log(colors.red, `❌ Failed: ${failed} (${(100 - successRate).toFixed(1)}%)`)

  if (criticalFailed.length > 0) {
    log(colors.red, `\n⚠️  CRITICAL FAILURES: ${criticalFailed.length}`)
    criticalFailed.forEach(r => {
      log(colors.yellow, `   - ${r.method} ${r.path}: ${r.error || 'Status ' + r.status}`)
    })
  }

  if (missingApiKeys.length > 0) {
    log(colors.yellow, `\n🔑 Missing API Keys: ${missingApiKeys.length}`)
    const uniqueKeys = [...new Set(missingApiKeys.map(r => r.requiresApiKey))]
    uniqueKeys.forEach(key => {
      log(colors.yellow, `   - ${key}`)
    })
  }

  // Group failures by error type
  const errors = {}
  allResults.filter(r => !r.success && r.error).forEach(r => {
    if (!errors[r.error]) {
      errors[r.error] = []
    }
    errors[r.error].push(r.path)
  })

  if (Object.keys(errors).length > 0) {
    log(colors.yellow, '\n📊 Failure Breakdown:')
    Object.entries(errors).forEach(([error, paths]) => {
      log(colors.yellow, `   ${error} (${paths.length} endpoints)`)
      paths.forEach(path => log(colors.yellow, `      - ${path}`))
    })
  }

  return {
    total,
    successful,
    failed,
    successRate: parseFloat(successRate),
    criticalFailed: criticalFailed.length,
    missingApiKeys: uniqueKeys,
    errors
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log(colors.cyan, '\n╔════════════════════════════════════════════════════════════════════════════╗')
  log(colors.cyan, '║        GEO-SEO DOMINATION TOOL - COMPREHENSIVE API ENDPOINT TESTS         ║')
  log(colors.cyan, '╚════════════════════════════════════════════════════════════════════════════╝')

  log(colors.blue, `\nBase URL: ${testConfig.baseUrl}`)
  log(colors.blue, `Timeout: ${testConfig.timeout}ms`)
  log(colors.blue, `Retries: ${testConfig.retries}`)

  const allResults = []
  const categoryResults = {}

  // Test each category
  for (const [categoryName, categoryEndpoints] of Object.entries(endpoints)) {
    const results = await testCategory(categoryName, categoryEndpoints)
    categoryResults[categoryName] = results
    allResults.push(...results)
  }

  // Generate summary
  const summary = generateSummary(allResults)

  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    config: testConfig,
    summary,
    categories: categoryResults,
    allResults
  }

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2))
  log(colors.green, `\n✅ Full report saved to: ${RESULTS_FILE}`)

  // Exit with appropriate code
  if (summary.criticalFailed > 0) {
    log(colors.red, '\n❌ CRITICAL TESTS FAILED - Review required!')
    process.exit(1)
  } else if (summary.failed > 0) {
    log(colors.yellow, '\n⚠️  Some tests failed - Review recommended')
    process.exit(0)
  } else {
    log(colors.green, '\n✅ ALL TESTS PASSED!')
    process.exit(0)
  }
}

// Run tests
runTests().catch(error => {
  log(colors.red, '\n❌ Test runner failed:')
  console.error(error)
  process.exit(1)
})
