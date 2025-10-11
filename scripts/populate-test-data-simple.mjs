#!/usr/bin/env node

/**
 * Post-Audit Automation System - Simple Test Data Population Script
 *
 * SQLite-focused version for local development
 *
 * Usage:
 *   node scripts/populate-test-data-simple.mjs
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
const ENCRYPTION_KEY = 'test-encryption-key-32-chars!'; // Exactly 32 chars for AES-256
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error.message);
    return `test-encrypted-${text.substring(0, 10)}`;
  }
}

// ============================================================================
// TEST DATA
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

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Post-Audit Automation System - Test Data Population');
  console.log('='.repeat(60));

  // Initialize database
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const dataDir = join(__dirname, '..', 'data');

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true});
  }

  console.log(`\n📁 Opening SQLite database: ${SQLITE_PATH}`);
  const db = new Database(SQLITE_PATH);
  db.pragma('journal_mode = WAL');

  try {
    // Check if post-audit tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table'
        AND name IN ('website_credentials', 'agent_tasks', 'task_templates', 'automation_rules')
      ORDER BY name
    `).all();

    if (tables.length < 4) {
      console.error('\n❌ ERROR: Post-audit tables not found!');
      console.error('Found tables:', tables.map(t => t.name).join(', '));
      console.error('\nPlease run the initialization scripts first:');
      console.error('  npm run db:init');
      process.exit(1);
    }

    console.log(`✅ Found ${tables.length} post-audit tables`);

    // 1. Get or create companies
    console.log('\n📊 Setting up companies...');
    const companies = [];

    for (const companyData of TEST_COMPANIES) {
      const existing = db.prepare('SELECT id, name, website FROM companies WHERE website = ?').get(companyData.website);

      if (existing) {
        console.log(`   ✓ Found: ${existing.name}`);
        companies.push(existing);
      } else {
        // Check company table schema
        const tableInfo = db.prepare("PRAGMA table_info(companies)").all();
        const columns = tableInfo.map(col => col.name);

        // Build dynamic insert based on available columns
        const values = {
          name: companyData.name,
          website: companyData.website,
          industry: companyData.industry,
          address: '123 Test St',
          city: 'Brisbane',
          state: 'QLD',
          postcode: '4000',
          zip: '4000',
          country: 'Australia',
          phone: '1300 000 000',
          email: 'contact@example.com',
          status: 'active',
          created_at: "datetime('now')"
        };

        const insertColumns = [];
        const insertPlaceholders = [];
        const insertValues = [];

        Object.keys(values).forEach(key => {
          if (columns.includes(key) && key !== 'created_at') {
            insertColumns.push(key);
            insertPlaceholders.push('?');
            insertValues.push(values[key]);
          }
        });

        // Always add created_at if it exists
        if (columns.includes('created_at')) {
          insertColumns.push('created_at');
          insertPlaceholders.push("datetime('now')");
        }

        const insertQuery = `INSERT INTO companies (${insertColumns.join(', ')}) VALUES (${insertPlaceholders.join(', ')})`;
        const result = db.prepare(insertQuery).run(...insertValues);

        const newCompany = db.prepare('SELECT id, name, website FROM companies WHERE id = ?').get(result.lastInsertRowid);
        console.log(`   ✅ Created: ${newCompany.name}`);
        companies.push(newCompany);
      }
    }

    // 2. Populate website credentials
    console.log('\n🔐 Populating website credentials...');

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const testData = TEST_COMPANIES[i];

      const existing = db.prepare(`
        SELECT id FROM website_credentials
        WHERE company_id = ? AND platform_type = ?
      `).get(company.id, testData.platform);

      if (existing) {
        console.log(`   ⏭️  Skipping ${company.name} (exists)`);
        continue;
      }

      let credentialFields = {
        company_id: company.id,
        platform_type: testData.platform,
        platform_version: null,
        primary_access_method: null,
        wp_url: null,
        wp_username: null,
        wp_app_password_encrypted: null,
        shopify_store_url: null,
        shopify_access_token_encrypted: null,
        shopify_api_version: null,
        github_repo: null,
        github_token_encrypted: null,
        github_branch: null,
        github_auto_pr: null,
        vercel_project_id: null,
        vercel_token_encrypted: null,
        notes: 'Test credentials for development',
        test_connection_status: 'untested',
        is_active: 1
      };

      // Platform-specific credentials
      switch (testData.platform) {
        case 'wordpress':
          credentialFields = {
            ...credentialFields,
            platform_version: 'WordPress 6.4',
            primary_access_method: 'wp_rest_api',
            wp_url: company.website,
            wp_username: 'admin',
            wp_app_password_encrypted: encrypt('test-app-password-1234')
          };
          break;

        case 'shopify':
          credentialFields = {
            ...credentialFields,
            platform_version: 'Shopify Plus',
            primary_access_method: 'shopify_api',
            shopify_store_url: company.website.replace('https://', '').replace('.com.au', '.myshopify.com'),
            shopify_access_token_encrypted: encrypt('shpat_test1234567890'),
            shopify_api_version: '2024-01'
          };
          break;

        case 'next':
          credentialFields = {
            ...credentialFields,
            platform_version: 'Next.js 15',
            primary_access_method: 'github',
            github_repo: `test-org/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
            github_token_encrypted: encrypt('ghp_test1234567890'),
            github_branch: 'main',
            github_auto_pr: 1,
            vercel_project_id: `prj_test${crypto.randomBytes(4).toString('hex')}`,
            vercel_token_encrypted: encrypt('vercel_test_token_123')
          };
          break;
      }

      db.prepare(`
        INSERT INTO website_credentials (
          company_id, platform_type, platform_version, primary_access_method,
          wp_url, wp_username, wp_app_password_encrypted,
          shopify_store_url, shopify_access_token_encrypted, shopify_api_version,
          github_repo, github_token_encrypted, github_branch, github_auto_pr,
          vercel_project_id, vercel_token_encrypted,
          notes, test_connection_status, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        credentialFields.company_id,
        credentialFields.platform_type,
        credentialFields.platform_version,
        credentialFields.primary_access_method,
        credentialFields.wp_url,
        credentialFields.wp_username,
        credentialFields.wp_app_password_encrypted,
        credentialFields.shopify_store_url,
        credentialFields.shopify_access_token_encrypted,
        credentialFields.shopify_api_version,
        credentialFields.github_repo,
        credentialFields.github_token_encrypted,
        credentialFields.github_branch,
        credentialFields.github_auto_pr,
        credentialFields.vercel_project_id,
        credentialFields.vercel_token_encrypted,
        credentialFields.notes,
        credentialFields.test_connection_status,
        credentialFields.is_active
      );

      console.log(`   ✅ ${company.name} (${testData.platform})`);
    }

    // 3. Populate task templates
    console.log('\n📋 Populating task templates...');

    const templates = [
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
          position: 'before_first_paragraph'
        }),
        compatible_agents: JSON.stringify(['wp_rest_api', 'ftp_script', 'github_copilot']),
        preferred_agent: 'wp_rest_api',
        risk_level: 'low',
        requires_approval: 0,
        requires_backup: 1,
        estimated_time_seconds: 30,
        estimated_cost_usd: 0.05,
        success_criteria: JSON.stringify({ h1_count: 1, h1_length_min: 10 }),
        rollback_available: 1
      },
      {
        task_type: 'optimize_images',
        category: 'performance',
        default_priority: 'medium',
        title: 'Optimize Images',
        description: 'Compresses images and adds lazy loading',
        instructions_template: JSON.stringify({
          action: 'optimize_media',
          compression_quality: 85,
          format: 'webp'
        }),
        compatible_agents: JSON.stringify(['wp_rest_api', 'ftp_script', 'custom_script']),
        preferred_agent: 'custom_script',
        risk_level: 'medium',
        requires_approval: 0,
        requires_backup: 1,
        estimated_time_seconds: 120,
        estimated_cost_usd: 0.15,
        success_criteria: JSON.stringify({ size_reduction_pct: 30 }),
        rollback_available: 1
      },
      {
        task_type: 'add_alt_text',
        category: 'accessibility',
        default_priority: 'high',
        title: 'Add Alt Text to Images',
        description: 'Generates and adds descriptive alt text',
        instructions_template: JSON.stringify({
          action: 'add_attribute',
          attribute: 'alt'
        }),
        compatible_agents: JSON.stringify(['wp_rest_api', 'ftp_script']),
        preferred_agent: 'wp_rest_api',
        risk_level: 'low',
        requires_approval: 0,
        requires_backup: 1,
        estimated_time_seconds: 45,
        estimated_cost_usd: 0.08,
        success_criteria: JSON.stringify({ alt_text_present: true }),
        rollback_available: 1
      }
    ];

    for (const template of templates) {
      const existing = db.prepare('SELECT id FROM task_templates WHERE task_type = ?').get(template.task_type);

      if (existing) {
        console.log(`   ⏭️  Skipping ${template.task_type}`);
        continue;
      }

      db.prepare(`
        INSERT INTO task_templates (
          task_type, category, default_priority, title, description,
          instructions_template, compatible_agents, preferred_agent,
          risk_level, requires_approval, requires_backup,
          estimated_time_seconds, estimated_cost_usd, success_criteria,
          rollback_available, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `).run(
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

    // 4. Populate automation rules
    console.log('\n⚙️  Populating automation rules...');

    const rules = [
      {
        rule_name: 'Auto-fix critical SEO issues',
        description: 'Automatically creates tasks for critical SEO issues',
        trigger_type: 'audit_completed',
        trigger_conditions: JSON.stringify({ audit_score_below: 70 }),
        auto_create_tasks: 1,
        auto_execute_tasks: 0,
        require_approval: 1,
        task_types_included: JSON.stringify(['add_h1_tag', 'add_meta_description']),
        max_tasks_per_audit: 15,
        priority_threshold: 'high'
      },
      {
        rule_name: 'Performance optimization',
        description: 'Triggers performance tasks when score drops',
        trigger_type: 'score_dropped',
        trigger_conditions: JSON.stringify({ score_drop_threshold: 15 }),
        auto_create_tasks: 1,
        auto_execute_tasks: 0,
        require_approval: 0,
        task_types_included: JSON.stringify(['optimize_images']),
        max_tasks_per_audit: 10,
        priority_threshold: 'medium'
      }
    ];

    for (const company of companies) {
      for (const rule of rules) {
        const existing = db.prepare(`
          SELECT id FROM automation_rules
          WHERE company_id = ? AND rule_name = ?
        `).get(company.id, rule.rule_name);

        if (existing) {
          console.log(`   ⏭️  Skipping "${rule.rule_name}" for ${company.name}`);
          continue;
        }

        db.prepare(`
          INSERT INTO automation_rules (
            company_id, rule_name, description, trigger_type, trigger_conditions,
            auto_create_tasks, auto_execute_tasks, require_approval,
            task_types_included, max_tasks_per_audit, priority_threshold,
            is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `).run(
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

    // 5. Create sample agent tasks
    console.log('\n🤖 Populating sample agent tasks...');

    const company = companies[0];
    const sampleTasks = [
      {
        task_type: 'add_h1_tag',
        category: 'seo',
        priority: 'high',
        status: 'completed',
        page_url: `${company.website}/services`,
        instructions: JSON.stringify({ action: 'add_element', element: 'h1', content: 'Professional Services' }),
        agent_type: 'wp_rest_api',
        success: 1,
        actual_time_seconds: 28
      },
      {
        task_type: 'add_alt_text',
        category: 'accessibility',
        priority: 'high',
        status: 'pending',
        page_url: `${company.website}/about`,
        instructions: JSON.stringify({ action: 'add_attribute', attribute: 'alt' }),
        agent_type: 'wp_rest_api',
        success: null,
        actual_time_seconds: null
      }
    ];

    for (const task of sampleTasks) {
      db.prepare(`
        INSERT INTO agent_tasks (
          company_id, task_type, category, priority, status,
          page_url, instructions, agent_type, success,
          actual_time_seconds, requires_approval, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
      `).run(
        company.id,
        task.task_type,
        task.category,
        task.priority,
        task.status,
        task.page_url,
        task.instructions,
        task.agent_type,
        task.success,
        task.actual_time_seconds
      );

      console.log(`   ✅ ${task.task_type} (${task.status})`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA POPULATION COMPLETE');
    console.log('='.repeat(60));

    const stats = {
      companies: db.prepare('SELECT COUNT(*) as count FROM companies').get().count,
      credentials: db.prepare('SELECT COUNT(*) as count FROM website_credentials').get().count,
      templates: db.prepare('SELECT COUNT(*) as count FROM task_templates').get().count,
      rules: db.prepare('SELECT COUNT(*) as count FROM automation_rules').get().count,
      tasks: db.prepare('SELECT COUNT(*) as count FROM agent_tasks').get().count
    };

    console.log(`\n📊 Database Summary:`);
    console.log(`   • Companies: ${stats.companies}`);
    console.log(`   • Website Credentials: ${stats.credentials}`);
    console.log(`   • Task Templates: ${stats.templates}`);
    console.log(`   • Automation Rules: ${stats.rules}`);
    console.log(`   • Agent Tasks: ${stats.tasks}`);

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
