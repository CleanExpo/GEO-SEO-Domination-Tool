#!/usr/bin/env node

/**
 * Post-Audit Automation System - Test Data Population Script
 *
 * Populates the database with realistic test data for:
 * - Website credentials (encrypted)
 * - Automation rules
 * - Agent tasks
 * - Task templates
 * - Execution logs
 *
 * Usage:
 *   node scripts/populate-test-data.mjs
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SQLITE_PATH = process.env.SQLITE_PATH || './data/geo-seo.db';

// Simple encryption for test data (NOT production-grade - use proper KMS in production)
const ENCRYPTION_KEY = 'test-encryption-key-32-chars!!!'; // Must be 32 chars for AES-256
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// ============================================================================
// DATABASE CLIENT
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, '..', 'data');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(SQLITE_PATH);
db.pragma('journal_mode = WAL');

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

const TEST_COMPANIES = [
  {
    name: 'Brisbane Water Damage Pros',
    website: 'https://waterdamagebrisbane.com.au',
    platform: 'wordpress',
    industry: 'Water Damage Restoration'
  },
  {
    name: 'Gold Coast Plumbing Services',
    website: 'https://gcplumbing.com.au',
    platform: 'shopify',
    industry: 'Plumbing'
  },
  {
    name: 'Sydney Web Design Co',
    website: 'https://sydneywebdesign.com.au',
    platform: 'next',
    industry: 'Web Design'
  }
];

const TASK_TEMPLATES = [
  {
    task_type: 'add_h1_tag',
    category: 'seo',
    default_priority: 'high',
    title: 'Add Missing H1 Tag',
    description: 'Adds an H1 heading tag to pages that are missing one',
    instructions_template: JSON.stringify({
      action: 'add_element',
      element: 'h1',
      content: '{{h1_content}}',
      position: 'before_first_paragraph',
      context: 'SEO best practice requires exactly one H1 per page'
    }),
    compatible_agents: JSON.stringify(['wp_rest_api', 'ftp_script', 'github_copilot']),
    preferred_agent: 'wp_rest_api',
    risk_level: 'low',
    requires_approval: 0,
    requires_backup: 1,
    estimated_time_seconds: 30,
    estimated_cost_usd: 0.05,
    success_criteria: JSON.stringify({
      h1_count: 1,
      h1_length_min: 10,
      h1_length_max: 70
    }),
    rollback_available: 1
  },
  {
    task_type: 'optimize_images',
    category: 'performance',
    default_priority: 'medium',
    title: 'Optimize Images',
    description: 'Compresses images and adds lazy loading attributes',
    instructions_template: JSON.stringify({
      action: 'optimize_media',
      targets: '{{image_urls}}',
      compression_quality: 85,
      format: 'webp',
      add_lazy_loading: true
    }),
    compatible_agents: JSON.stringify(['wp_rest_api', 'ftp_script', 'custom_script']),
    preferred_agent: 'custom_script',
    risk_level: 'medium',
    requires_approval: 0,
    requires_backup: 1,
    estimated_time_seconds: 120,
    estimated_cost_usd: 0.15,
    success_criteria: JSON.stringify({
      size_reduction_pct: 30,
      format_webp: true
    }),
    rollback_available: 1
  },
  {
    task_type: 'add_alt_text',
    category: 'accessibility',
    default_priority: 'high',
    title: 'Add Alt Text to Images',
    description: 'Generates and adds descriptive alt text to images missing it',
    instructions_template: JSON.stringify({
      action: 'add_attribute',
      element: 'img',
      attribute: 'alt',
      value: '{{alt_text}}',
      selector: '{{image_selector}}'
    }),
    compatible_agents: JSON.stringify(['wp_rest_api', 'ftp_script', 'claude_computer_use']),
    preferred_agent: 'wp_rest_api',
    risk_level: 'low',
    requires_approval: 0,
    requires_backup: 1,
    estimated_time_seconds: 45,
    estimated_cost_usd: 0.08,
    success_criteria: JSON.stringify({
      alt_text_present: true,
      alt_text_length_min: 5
    }),
    rollback_available: 1
  },
  {
    task_type: 'fix_broken_links',
    category: 'seo',
    default_priority: 'high',
    title: 'Fix Broken Links',
    description: 'Updates or removes broken internal and external links',
    instructions_template: JSON.stringify({
      action: 'replace_links',
      broken_urls: '{{broken_urls}}',
      replacement_strategy: '{{strategy}}',
      replacement_urls: '{{new_urls}}'
    }),
    compatible_agents: JSON.stringify(['wp_rest_api', 'ftp_script', 'custom_script']),
    preferred_agent: 'wp_rest_api',
    risk_level: 'medium',
    requires_approval: 1,
    requires_backup: 1,
    estimated_time_seconds: 90,
    estimated_cost_usd: 0.12,
    success_criteria: JSON.stringify({
      broken_links_count: 0,
      all_links_status_ok: true
    }),
    rollback_available: 1
  },
  {
    task_type: 'add_meta_description',
    category: 'seo',
    default_priority: 'medium',
    title: 'Add Meta Description',
    description: 'Generates and adds optimized meta descriptions to pages missing them',
    instructions_template: JSON.stringify({
      action: 'add_meta_tag',
      meta_name: 'description',
      content: '{{meta_description}}',
      page_url: '{{page_url}}'
    }),
    compatible_agents: JSON.stringify(['wp_rest_api', 'ftp_script', 'claude_computer_use']),
    preferred_agent: 'wp_rest_api',
    risk_level: 'low',
    requires_approval: 0,
    requires_backup: 1,
    estimated_time_seconds: 30,
    estimated_cost_usd: 0.06,
    success_criteria: JSON.stringify({
      meta_description_present: true,
      length_between: [120, 160]
    }),
    rollback_available: 1
  }
];

const AUTOMATION_RULES_TEMPLATES = [
  {
    rule_name: 'Auto-fix critical SEO issues',
    description: 'Automatically creates tasks for critical SEO issues found in audits',
    trigger_type: 'audit_completed',
    trigger_conditions: JSON.stringify({
      audit_score_below: 70,
      categories: ['seo'],
      priority_minimum: 'high'
    }),
    auto_create_tasks: 1,
    auto_execute_tasks: 0,
    require_approval: 1,
    task_types_included: JSON.stringify(['add_h1_tag', 'add_meta_description', 'fix_broken_links']),
    max_tasks_per_audit: 15,
    priority_threshold: 'high'
  },
  {
    rule_name: 'Performance optimization on score drop',
    description: 'Triggers performance tasks when Lighthouse score drops significantly',
    trigger_type: 'score_dropped',
    trigger_conditions: JSON.stringify({
      score_drop_threshold: 15,
      categories: ['performance'],
      consecutive_audits: 2
    }),
    auto_create_tasks: 1,
    auto_execute_tasks: 0,
    require_approval: 0,
    task_types_included: JSON.stringify(['optimize_images', 'minify_css', 'enable_caching']),
    max_tasks_per_audit: 10,
    priority_threshold: 'medium'
  },
  {
    rule_name: 'Weekly accessibility audit',
    description: 'Scheduled weekly accessibility checks and fixes',
    trigger_type: 'schedule',
    trigger_conditions: JSON.stringify({
      schedule_cron: '0 9 * * MON',
      timezone: 'Australia/Brisbane',
      categories: ['accessibility']
    }),
    auto_create_tasks: 1,
    auto_execute_tasks: 0,
    require_approval: 0,
    task_types_included: JSON.stringify(['add_alt_text', 'fix_color_contrast', 'add_aria_labels']),
    max_tasks_per_audit: 20,
    priority_threshold: 'low'
  }
];

// ============================================================================
// POPULATION FUNCTIONS
// ============================================================================

function getOrCreateCompanies() {
  console.log('\n📊 Checking for existing companies...');

  const companies = [];

  for (const companyData of TEST_COMPANIES) {
    // Check if company exists
    const existing = db.prepare('SELECT id, name, website FROM companies WHERE website = ?')
      .get(companyData.website);

    if (existing) {
      console.log(`   ✓ Found existing: ${existing.name} (${existing.id})`);
      companies.push(existing);
    } else {
      // Create new company
      const stmt = db.prepare(`
        INSERT INTO companies (id, name, website, industry, status, created_at)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, 'active', datetime('now'))
      `);

      const info = stmt.run(companyData.name, companyData.website, companyData.industry);

      const newCompany = db.prepare('SELECT id, name, website FROM companies WHERE rowid = ?')
        .get(info.lastInsertRowid);

      console.log(`   ✅ Created: ${newCompany.name} (${newCompany.id})`);
      companies.push(newCompany);
    }
  }

  return companies;
}

function populateWebsiteCredentials(companies) {
  console.log('\n🔐 Populating website credentials...');

  const credentials = [];

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const testData = TEST_COMPANIES[i];

    // Check if credentials exist
    const existing = db.prepare(
      'SELECT id FROM website_credentials WHERE company_id = ? AND platform_type = ?'
    ).get(company.id, testData.platform);

    if (existing) {
      console.log(`   ⏭️  Skipping ${company.name} (credentials exist)`);
      credentials.push(existing);
      continue;
    }

    let credentialData = {
      company_id: company.id,
      platform_type: testData.platform,
      test_connection_status: 'untested',
      is_active: 1,
      notes: 'Test credentials for development'
    };

    // Add platform-specific credentials
    switch (testData.platform) {
      case 'wordpress':
        credentialData = {
          ...credentialData,
          platform_version: 'WordPress 6.4',
          primary_access_method: 'wp_rest_api',
          wp_url: company.website,
          wp_username: 'admin',
          wp_app_password_encrypted: encrypt('test-app-password-1234-5678-90ab-cdef')
        };
        break;

      case 'shopify':
        credentialData = {
          ...credentialData,
          platform_version: 'Shopify Plus',
          primary_access_method: 'shopify_api',
          shopify_store_url: company.website.replace('https://', '').replace('.com.au', '.myshopify.com'),
          shopify_access_token_encrypted: encrypt('shpat_test1234567890abcdefghijklmnop'),
          shopify_api_version: '2024-01'
        };
        break;

      case 'next':
        credentialData = {
          ...credentialData,
          platform_version: 'Next.js 15',
          primary_access_method: 'github',
          github_repo: `test-org/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
          github_token_encrypted: encrypt('ghp_test1234567890abcdefghijklmnopqrstu'),
          github_branch: 'main',
          github_auto_pr: 1,
          vercel_project_id: `prj_test${crypto.randomBytes(8).toString('hex')}`,
          vercel_token_encrypted: encrypt('vercel_test_token_1234567890abcdefghijklmnop')
        };
        break;
    }

    const stmt = db.prepare(`
      INSERT INTO website_credentials (
        id, company_id, platform_type, platform_version, primary_access_method,
        wp_url, wp_username, wp_app_password_encrypted,
        shopify_store_url, shopify_access_token_encrypted, shopify_api_version,
        github_repo, github_token_encrypted, github_branch, github_auto_pr,
        vercel_project_id, vercel_token_encrypted,
        notes, test_connection_status, is_active, created_at, updated_at
      ) VALUES (
        lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `);

    stmt.run(
      credentialData.company_id,
      credentialData.platform_type,
      credentialData.platform_version || null,
      credentialData.primary_access_method,
      credentialData.wp_url || null,
      credentialData.wp_username || null,
      credentialData.wp_app_password_encrypted || null,
      credentialData.shopify_store_url || null,
      credentialData.shopify_access_token_encrypted || null,
      credentialData.shopify_api_version || null,
      credentialData.github_repo || null,
      credentialData.github_token_encrypted || null,
      credentialData.github_branch || null,
      credentialData.github_auto_pr || null,
      credentialData.vercel_project_id || null,
      credentialData.vercel_token_encrypted || null,
      credentialData.notes,
      credentialData.test_connection_status,
      credentialData.is_active
    );

    console.log(`   ✅ ${company.name} (${testData.platform})`);
  }
}

function populateTaskTemplates() {
  console.log('\n📋 Populating task templates...');

  for (const template of TASK_TEMPLATES) {
    // Check if template exists
    const existing = db.prepare('SELECT id FROM task_templates WHERE task_type = ?')
      .get(template.task_type);

    if (existing) {
      console.log(`   ⏭️  Skipping ${template.task_type} (exists)`);
      continue;
    }

    const stmt = db.prepare(`
      INSERT INTO task_templates (
        id, task_type, category, default_priority, title, description,
        instructions_template, compatible_agents, preferred_agent,
        risk_level, requires_approval, requires_backup,
        estimated_time_seconds, estimated_cost_usd, success_criteria,
        rollback_available, is_active, created_at, updated_at
      ) VALUES (
        lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now')
      )
    `);

    stmt.run(
      template.task_type,
      template.category,
      template.default_priority,
      template.title,
      template.description,
      template.instructions_template,
      template.compatible_agents,
      template.preferred_agent,
      template.risk_level,
      template.requires_approval,
      template.requires_backup,
      template.estimated_time_seconds,
      template.estimated_cost_usd,
      template.success_criteria,
      template.rollback_available
    );

    console.log(`   ✅ ${template.title}`);
  }
}

function populateAutomationRules(companies) {
  console.log('\n⚙️  Populating automation rules...');

  for (const company of companies) {
    for (const rule of AUTOMATION_RULES_TEMPLATES) {
      // Check if rule exists
      const existing = db.prepare(
        'SELECT id FROM automation_rules WHERE company_id = ? AND rule_name = ?'
      ).get(company.id, rule.rule_name);

      if (existing) {
        console.log(`   ⏭️  Skipping "${rule.rule_name}" for ${company.name}`);
        continue;
      }

      const stmt = db.prepare(`
        INSERT INTO automation_rules (
          id, company_id, rule_name, description, trigger_type, trigger_conditions,
          auto_create_tasks, auto_execute_tasks, require_approval,
          task_types_included, max_tasks_per_audit,
          priority_threshold, is_active, created_at, updated_at
        ) VALUES (
          lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now')
        )
      `);

      stmt.run(
        company.id,
        rule.rule_name,
        rule.description,
        rule.trigger_type,
        rule.trigger_conditions,
        rule.auto_create_tasks,
        rule.auto_execute_tasks,
        rule.require_approval,
        rule.task_types_included,
        rule.max_tasks_per_audit,
        rule.priority_threshold
      );

      console.log(`   ✅ "${rule.rule_name}" for ${company.name}`);
    }
  }
}

function populateSampleAgentTasks(companies) {
  console.log('\n🤖 Populating sample agent tasks...');

  // Create a few sample tasks for the first company
  const company = companies[0];

  const sampleTasks = [
    {
      task_type: 'add_h1_tag',
      category: 'seo',
      priority: 'high',
      status: 'completed',
      page_url: `${company.website}/services`,
      instructions: JSON.stringify({
        action: 'add_element',
        element: 'h1',
        content: 'Professional Water Damage Restoration Services',
        position: 'before_first_paragraph'
      }),
      agent_type: 'wp_rest_api',
      success: 1,
      actual_time_seconds: 28
    },
    {
      task_type: 'add_meta_description',
      category: 'seo',
      priority: 'medium',
      status: 'completed',
      page_url: `${company.website}/contact`,
      instructions: JSON.stringify({
        action: 'add_meta_tag',
        meta_name: 'description',
        content: '24/7 emergency water damage restoration in Brisbane. Fast response, expert service. Call now for immediate help.'
      }),
      agent_type: 'wp_rest_api',
      success: 1,
      actual_time_seconds: 32
    },
    {
      task_type: 'add_alt_text',
      category: 'accessibility',
      priority: 'high',
      status: 'pending',
      page_url: `${company.website}/about`,
      instructions: JSON.stringify({
        action: 'add_attribute',
        element: 'img',
        attribute: 'alt',
        value: 'Professional water damage restoration team in Brisbane',
        selector: '.team-photo'
      }),
      agent_type: 'wp_rest_api'
    }
  ];

  for (const task of sampleTasks) {
    const stmt = db.prepare(`
      INSERT INTO agent_tasks (
        id, company_id, task_type, category, priority, status,
        page_url, instructions, agent_type, success,
        actual_time_seconds, requires_approval, created_at, updated_at
      ) VALUES (
        lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now')
      )
    `);

    stmt.run(
      company.id,
      task.task_type,
      task.category,
      task.priority,
      task.status,
      task.page_url,
      task.instructions,
      task.agent_type,
      task.success || null,
      task.actual_time_seconds || null
    );

    console.log(`   ✅ ${task.task_type} (${task.status})`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('🚀 Post-Audit Automation System - Test Data Population');
  console.log('='.repeat(60));
  console.log(`📁 Using SQLite: ${SQLITE_PATH}`);

  try {
    // Verify tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name IN ('website_credentials', 'agent_tasks', 'task_templates', 'automation_rules')
      ORDER BY name
    `).all();

    if (tables.length < 4) {
      console.error('\n❌ ERROR: Post-audit tables not found!');
      console.error('Please run the migration first.');
      console.error(`Found tables: ${tables.map(t => t.name).join(', ') || 'none'}`);
      process.exit(1);
    }

    console.log(`\n✅ Found ${tables.length} post-audit tables`);

    // Populate data
    const companies = getOrCreateCompanies();
    populateWebsiteCredentials(companies);
    populateTaskTemplates();
    populateAutomationRules(companies);
    populateSampleAgentTasks(companies);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA POPULATION COMPLETE');
    console.log('='.repeat(60));

    const summary = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM companies WHERE website IN ('https://waterdamagebrisbane.com.au', 'https://gcplumbing.com.au', 'https://sydneywebdesign.com.au')) as companies,
        (SELECT COUNT(*) FROM website_credentials) as credentials,
        (SELECT COUNT(*) FROM task_templates) as templates,
        (SELECT COUNT(*) FROM automation_rules) as rules,
        (SELECT COUNT(*) FROM agent_tasks) as tasks
    `).get();

    console.log(`\n📊 Database Summary:`);
    console.log(`   • Companies: ${summary.companies}`);
    console.log(`   • Website Credentials: ${summary.credentials}`);
    console.log(`   • Task Templates: ${summary.templates}`);
    console.log(`   • Automation Rules: ${summary.rules}`);
    console.log(`   • Agent Tasks: ${summary.tasks}`);

    console.log('\n🎉 Ready to build API endpoints and UI components!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
