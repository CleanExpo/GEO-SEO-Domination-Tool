# Database Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   GEO-SEO Domination Tool                    │
│                      Application Layer                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Unified Database Client (db.ts/db.js)           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Auto-Detection: DATABASE_URL → PostgreSQL            │  │
│  │                 Otherwise → SQLite                     │  │
│  └───────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
┌──────────────────┐          ┌──────────────────┐
│   SQLite (Dev)   │          │ PostgreSQL (Prod)│
│                  │          │                  │
│  • Local file DB │          │  • Connection    │
│  • No config     │          │    pooling       │
│  • Auto-created  │          │  • SSL support   │
│  • Foreign keys  │          │  • Scalable      │
└──────────────────┘          └──────────────────┘
```

## Database Schema Organization

```
database/
│
├── schema.sql                     [Core SEO Tool]
│   ├── companies
│   ├── individuals
│   ├── audits
│   ├── keywords
│   ├── competitors
│   ├── citations
│   ├── service_areas
│   ├── local_pack_tracking
│   ├── backlinks
│   ├── content_gaps
│   └── scheduled_audits
│
├── ai-search-schema.sql           [AI Search Features]
│   ├── seo_strategies
│   ├── strategy_case_studies
│   ├── ai_search_campaigns
│   ├── campaign_strategies
│   ├── ai_search_visibility
│   ├── perplexity_optimization
│   ├── ai_content_strategy
│   ├── campaign_results
│   ├── ai_competitor_analysis
│   └── strategy_implementation_notes
│
├── project-hub-schema.sql         [Project Management]
│   ├── hub_projects
│   ├── hub_api_keys
│   ├── hub_project_configs
│   ├── hub_project_features
│   ├── hub_project_dependencies
│   ├── hub_sandbox_sessions
│   ├── hub_activity_log
│   ├── hub_quick_actions
│   ├── hub_collections
│   └── hub_collection_projects
│
├── integrations-schema.sql        [Third-Party Integrations]
│   ├── integration_registry
│   ├── integration_connections
│   ├── integration_webhooks
│   ├── webhook_events
│   ├── integration_sync_jobs
│   ├── integration_metrics
│   ├── integration_sdk_versions
│   ├── integration_templates
│   └── oauth_states
│
├── project-generation-schema.sql  [Project Scaffolding]
│   ├── project_templates
│   ├── generated_projects
│   ├── template_features
│   ├── generation_steps
│   ├── template_variables
│   ├── integration_auto_config
│   ├── code_snippets
│   ├── template_dependencies
│   └── ide_configs
│
└── crm_schema.sql                 [CRM System]
    ├── crm_contacts
    ├── crm_deals
    ├── crm_tasks
    ├── crm_calendar_events
    ├── crm_event_attendees
    ├── crm_projects
    ├── crm_project_members
    ├── crm_github_projects
    ├── crm_prompts
    └── crm_support_tickets
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Code                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           Database Client (getDatabase())                    │
│                                                              │
│  Methods:                                                    │
│    • initialize()    - Connect to database                  │
│    • query()         - Execute SQL query                    │
│    • queryOne()      - Get single row                       │
│    • executeSqlFile()- Run schema/migration files           │
│    • beginTransaction() - Start transaction                 │
│    • commit()        - Commit transaction                   │
│    • rollback()      - Rollback transaction                 │
│    • tableExists()   - Check if table exists                │
│    • close()         - Close connection                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
│                                                              │
│  SQLite:                  PostgreSQL:                        │
│  • better-sqlite3         • pg (node-postgres)               │
│  • Synchronous API        • Async/Await API                  │
│  • Single connection      • Connection pool                  │
└─────────────────────────────────────────────────────────────┘
```

## Environment Detection Flow

```
Application Start
      │
      ▼
┌─────────────────────┐
│ Check Environment   │
│ Variables           │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
DATABASE_URL   No DATABASE_URL
    or             or
POSTGRES_URL   POSTGRES_URL
    │             │
    ▼             ▼
┌───────────┐ ┌───────────┐
│PostgreSQL │ │  SQLite   │
│           │ │           │
│Production │ │Development│
└───────────┘ └───────────┘
```

## Migration System Flow

```
Create Migration
      │
      ▼
┌───────────────────────────────────────────┐
│ migrations/YYYYMMDD_HHMMSS_name.sql       │
│                                           │
│ -- UP Migration                           │
│ CREATE TABLE ...                          │
│                                           │
│ -- ROLLBACK:                              │
│ DROP TABLE ...                            │
└───────────────┬───────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
    Run Up          Run Down
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│ Execute UP   │ │ Execute DOWN │
│ SQL          │ │ SQL          │
└──────┬───────┘ └──────┬───────┘
       │                │
       ▼                ▼
┌──────────────┐ ┌──────────────┐
│ Record in    │ │ Remove from  │
│ _migrations  │ │ _migrations  │
│ table        │ │ table        │
└──────────────┘ └──────────────┘
```

## Key Relationships

### Core SEO Tool Relationships

```
companies (1) ──→ (many) individuals
    │
    ├──→ (many) audits
    ├──→ (many) keywords
    ├──→ (many) competitors
    ├──→ (many) citations
    ├──→ (many) service_areas
    ├──→ (many) local_pack_tracking
    ├──→ (many) backlinks
    ├──→ (many) content_gaps
    └──→ (many) scheduled_audits
```

### AI Search Relationships

```
companies (1) ──→ (many) ai_search_campaigns
                           │
                           ├──→ (many) campaign_strategies
                           │              │
                           │              └──→ (many) strategy_implementation_notes
                           │
                           └──→ (many) campaign_results

seo_strategies (1) ──→ (many) strategy_case_studies
                   └──→ (many) campaign_strategies
```

### Project Hub Relationships

```
hub_projects (1) ──→ (many) hub_api_keys
             └──→ (many) hub_project_configs
             └──→ (many) hub_project_features
             └──→ (many) hub_project_dependencies
             └──→ (many) hub_sandbox_sessions
             └──→ (many) hub_activity_log
             └──→ (many) hub_quick_actions

hub_collections (1) ──→ (many) hub_collection_projects ←── (many) hub_projects
```

### CRM Relationships

```
crm_contacts (1) ──→ (many) crm_deals
             └──→ (many) crm_tasks
             └──→ (many) crm_calendar_events

crm_projects (1) ──→ (many) crm_project_members

crm_calendar_events (1) ──→ (many) crm_event_attendees
```

## Transaction Handling

```
Application Request
      │
      ▼
Begin Transaction ──────────────┐
      │                         │
      ▼                         │
Execute Query 1                 │
      │                         │
      ▼                         │
Execute Query 2                 │
      │                         │
      ▼                         │
Execute Query N                 │
      │                         │
  ┌───┴───┐                     │
  │       │                     │
Success  Error                  │
  │       │                     │
  ▼       ▼                     │
Commit  Rollback ←──────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────┐
│         Application Layer                    │
│  • Parameterized queries only               │
│  • No raw SQL from user input               │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│         Database Client                      │
│  • SQL injection prevention                 │
│  • Prepared statements                      │
│  • Connection pooling limits                │
└───────────────┬─────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│   SQLite     │ │ PostgreSQL   │
│              │ │              │
│ • File perms │ │ • SSL/TLS    │
│ • Foreign    │ │ • Row-level  │
│   keys       │ │   security   │
└──────────────┘ └──────────────┘
```

## Performance Optimization

### SQLite (Development)

```
┌─────────────────────────────────────┐
│ SQLite Optimizations                │
├─────────────────────────────────────┤
│ • Foreign keys enabled              │
│ • Indexed columns for fast lookups  │
│ • Single connection (thread-safe)   │
│ • Synchronous mode for consistency  │
└─────────────────────────────────────┘
```

### PostgreSQL (Production)

```
┌─────────────────────────────────────┐
│ PostgreSQL Optimizations            │
├─────────────────────────────────────┤
│ • Connection pooling (configurable) │
│ • Prepared statements               │
│ • Indexes on foreign keys           │
│ • Query optimization                │
│ • SSL for security                  │
└─────────────────────────────────────┘
```

## Deployment Scenarios

### Development (Local)

```
Developer Machine
       │
       ▼
┌─────────────────┐
│ No config needed│
│ SQLite auto     │
│ ./data/geo-     │
│   seo.db        │
└─────────────────┘
```

### Production (Cloud)

```
Cloud Platform (Vercel/Netlify/etc.)
       │
       ▼
┌─────────────────────────┐
│ DATABASE_URL env var    │
│ postgresql://...        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ PostgreSQL Database     │
│ (Vercel Postgres,       │
│  Neon, Supabase, etc.)  │
└─────────────────────────┘
```

## Backup & Recovery

### SQLite

```
Backup: Copy ./data/geo-seo.db file
Restore: Replace ./data/geo-seo.db file
```

### PostgreSQL

```
Backup:
  pg_dump -d database_url > backup.sql

Restore:
  psql database_url < backup.sql
```

## Monitoring & Logging

```
Application Layer
       │
       ├─→ Query logging (development)
       ├─→ Error tracking (production)
       ├─→ Performance metrics
       └─→ Connection pool status
```

---

**Key Principles:**

1. **Simplicity**: Auto-detection makes setup effortless
2. **Flexibility**: Works with SQLite or PostgreSQL
3. **Safety**: Transactions, foreign keys, parameterized queries
4. **Portability**: Same code works in dev and production
5. **Maintainability**: Clear migration system for schema changes
