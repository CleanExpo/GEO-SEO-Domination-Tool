#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes all tables from schema files in the database/ directory
 *
 * Usage:
 *   node scripts/init-database.js
 *   npm run init-db
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseClient } from '../web-app/lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Log with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Get all SQL schema files from the database directory
 */
function getSchemaFiles() {
  const databaseDir = path.join(__dirname, '..', 'database');

  if (!fs.existsSync(databaseDir)) {
    throw new Error(`Database directory not found: ${databaseDir}`);
  }

  const files = fs.readdirSync(databaseDir)
    .filter(file => file.endsWith('.sql'))
    .sort() // Sort to ensure consistent order
    .map(file => path.join(databaseDir, file));

  return files;
}

/**
 * Initialize database with all schema files
 */
async function initializeDatabase() {
  log('\n========================================', colors.cyan);
  log('  Database Initialization Script', colors.cyan + colors.bright);
  log('========================================\n', colors.cyan);

  const db = new DatabaseClient();

  try {
    // Initialize connection
    log('Initializing database connection...', colors.blue);
    await db.initialize();
    log(`✓ Connected to ${db.getType()} database\n`, colors.green);

    // Get all schema files
    const schemaFiles = getSchemaFiles();
    log(`Found ${schemaFiles.length} schema file(s):\n`, colors.blue);
    schemaFiles.forEach(file => {
      log(`  - ${path.basename(file)}`, colors.cyan);
    });
    log('');

    // Execute each schema file
    log('Executing schema files...', colors.blue);
    let successCount = 0;
    let errorCount = 0;

    for (const schemaFile of schemaFiles) {
      const fileName = path.basename(schemaFile);
      try {
        log(`  Processing ${fileName}...`, colors.yellow);
        const sqlContent = fs.readFileSync(schemaFile, 'utf-8');
        await db.executeSqlFile(sqlContent);
        log(`  ✓ ${fileName} executed successfully`, colors.green);
        successCount++;
      } catch (error) {
        log(`  ✗ Error in ${fileName}: ${error.message}`, colors.red);
        errorCount++;
      }
    }

    log('');
    log('========================================', colors.cyan);
    log(`Summary:`, colors.bright);
    log(`  Total files: ${schemaFiles.length}`, colors.blue);
    log(`  Successful: ${successCount}`, colors.green);
    log(`  Errors: ${errorCount}`, errorCount > 0 ? colors.red : colors.green);
    log('========================================\n', colors.cyan);

    if (errorCount === 0) {
      log('✓ Database initialization completed successfully!', colors.green + colors.bright);
    } else {
      log('⚠ Database initialization completed with errors', colors.yellow + colors.bright);
      process.exit(1);
    }

  } catch (error) {
    log(`\n✗ Fatal error: ${error.message}`, colors.red + colors.bright);
    console.error(error);
    process.exit(1);
  } finally {
    // Close connection
    await db.close();
  }
}

/**
 * Verify tables were created
 */
async function verifyTables() {
  const db = new DatabaseClient();

  try {
    await db.initialize();

    const expectedTables = [
      'companies',
      'individuals',
      'audits',
      'keywords',
      'competitors',
      'citations',
      'service_areas',
      'local_pack_tracking',
      'backlinks',
      'content_gaps',
      'scheduled_audits',
      'seo_strategies',
      'strategy_case_studies',
      'ai_search_campaigns',
      'campaign_strategies',
      'ai_search_visibility',
      'perplexity_optimization',
      'ai_content_strategy',
      'campaign_results',
      'ai_competitor_analysis',
      'strategy_implementation_notes',
      'hub_projects',
      'hub_api_keys',
      'hub_project_configs',
      'hub_project_features',
      'hub_project_dependencies',
      'hub_sandbox_sessions',
      'hub_activity_log',
      'hub_quick_actions',
      'hub_collections',
      'hub_collection_projects',
      'integration_registry',
      'integration_connections',
      'integration_webhooks',
      'webhook_events',
      'integration_sync_jobs',
      'integration_metrics',
      'integration_sdk_versions',
      'integration_templates',
      'oauth_states',
      'project_templates',
      'generated_projects',
      'template_features',
      'generation_steps',
      'template_variables',
      'integration_auto_config',
      'code_snippets',
      'template_dependencies',
      'ide_configs',
      'crm_contacts',
      'crm_deals',
      'crm_tasks',
      'crm_calendar_events',
      'crm_event_attendees',
      'crm_projects',
      'crm_project_members',
      'crm_github_projects',
      'crm_prompts',
      'crm_support_tickets',
      'support_tickets',
      'support_ticket_responses',
      'support_ticket_attachments',
    ];

    log('\nVerifying tables...', colors.blue);
    let foundCount = 0;
    let missingTables = [];

    for (const tableName of expectedTables) {
      const exists = await db.tableExists(tableName);
      if (exists) {
        foundCount++;
      } else {
        missingTables.push(tableName);
      }
    }

    log(`Found ${foundCount}/${expectedTables.length} tables`, colors.cyan);

    if (missingTables.length > 0) {
      log('\nMissing tables:', colors.yellow);
      missingTables.forEach(table => log(`  - ${table}`, colors.red));
    } else {
      log('✓ All expected tables exist!', colors.green);
    }

  } finally {
    await db.close();
  }
}

// Run the initialization
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const shouldVerify = args.includes('--verify') || args.includes('-v');

  initializeDatabase()
    .then(() => {
      if (shouldVerify) {
        return verifyTables();
      }
    })
    .catch(error => {
      log(`\nUnexpected error: ${error.message}`, colors.red);
      console.error(error);
      process.exit(1);
    });
}

export { initializeDatabase, verifyTables };
