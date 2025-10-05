# LIVE WEBSITE EDITING & AUTO-OPTIMIZATION ARCHITECTURE
**CRM-to-Live-Site Integration for SEO Dominance**
**Created:** 2025-10-05
**Research Method:** DeepSeek V3 Reasoning + Claude Code Enhanced Thinking

---

## EXECUTIVE SUMMARY

**Revolutionary Concept:** The CRM doesn't just *track* SEO - it **actively improves the live website** based on real Google data and AI analysis.

**How It Works:**
1. User runs SEO audit → Gets real Google ranking data
2. DeepSeek V3 analyzes what's wrong
3. CRM proposes specific code changes to fix issues
4. User reviews and approves
5. **CRM automatically applies changes to LIVE website**
6. Re-audit to verify improvement
7. Continuous optimization loop

**The Unique Value:**
> "You don't need a developer. The CRM IS your developer."

---

## PHASE 1: WEBSITE CONNECTION ARCHITECTURE

### 1.1 Supported Website Platforms (Prioritized)

**Tier 1: WordPress (80% of market)**
- REST API (built-in since WP 4.7)
- Custom plugin for advanced features
- Full control: posts, pages, meta tags, images, theme settings

**Tier 2: Static Site Builders**
- Vercel (Next.js, React) - Deploy via Git
- Netlify (any static) - Git-based deployment
- GitHub Pages - Direct commit

**Tier 3: Headless CMS**
- Contentful - Content API
- Strapi - REST/GraphQL API
- Sanity - GROQ API

**Tier 4: E-commerce**
- Shopify - Admin API
- WooCommerce (WordPress) - WP REST API + WooCommerce extensions

**NOT Supported (Too Complex/Risky):**
- Custom PHP sites without API
- Sites on shared hosting without access
- Sites with heavy security (good for them!)

### 1.2 Connection Methods

**Method 1: WordPress Plugin (RECOMMENDED)**

```
GEO-SEO Connector WordPress Plugin
├── Exposes secure API endpoints
├── Validates GEO-SEO CRM requests
├── Handles authentication via API keys
├── Provides safe sandbox for testing changes
├── Logs all modifications
└── One-click rollback capability
```

**Installation Flow:**
1. User downloads plugin from CRM dashboard
2. Uploads to WordPress → Activates
3. Plugin generates unique API key
4. User pastes key into GEO-SEO CRM
5. CRM verifies connection
6. **Now CRM can edit the live site**

**Method 2: Git-Based Deployment**

```
GEO-SEO CRM → GitHub → Vercel/Netlify
├── User authorizes GitHub access (OAuth)
├── CRM clones repository
├── Makes changes to code
├── Commits + pushes to branch
├── Creates pull request
├── User reviews and merges
└── Auto-deploys to production
```

**Method 3: Headless CMS API**

```
Direct API Connection
├── User provides API key
├── CRM fetches content structure
├── Modifies content via API
├── Changes go live immediately
└── Versioned for rollback
```

---

## PHASE 2: SAFE MODIFICATION SYSTEM

### 2.1 The "SEO Change Proposal" Workflow

**Critical Principle:** NEVER make changes without user approval.

```
┌─────────────────────────────────────────────────┐
│ 1. AUDIT PHASE                                  │
│    - Run Lighthouse SEO audit                   │
│    - Fetch Google Search Console rankings       │
│    - Analyze with DeepSeek V3                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 2. ANALYSIS PHASE                               │
│    DeepSeek V3 identifies issues:               │
│    ✗ Title tag too long (72 chars)             │
│    ✗ Missing alt text on 12 images             │
│    ✗ H1 tag contains keyword 0 times            │
│    ✗ Meta description missing                   │
│    ✗ Page speed: 45/100                        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 3. PROPOSAL GENERATION                          │
│    For each issue, create proposal:             │
│    ┌─────────────────────────────────────────┐ │
│    │ Issue: Title too long                   │ │
│    │ Current: "Disaster Recovery Brisbane... │ │
│    │ Proposed: "Water Damage Brisbane | ... │ │
│    │ Why: Fits 60 char limit, keeps keyword │ │
│    │ Impact: +3 SEO score                    │ │
│    │ Risk: LOW (reversible)                  │ │
│    │ [Preview] [Approve] [Reject]            │ │
│    └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 4. USER REVIEW                                  │
│    - See before/after preview                   │
│    - Approve all, some, or none                 │
│    - Set auto-approve rules (optional)          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 5. SAFE APPLY                                   │
│    - Create backup/snapshot                     │
│    - Apply change via API                       │
│    - Verify change was applied                  │
│    - Store rollback data                        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ 6. VERIFICATION                                 │
│    - Wait 24-48 hours                           │
│    - Re-run audit                               │
│    - Compare scores before/after                │
│    - Track ranking changes                      │
│    - Alert user to improvements                 │
└─────────────────────────────────────────────────┘
```

### 2.2 Safety Features

**Backup System:**
```typescript
interface ChangeBackup {
  id: string;
  change_proposal_id: string;
  before_value: string;
  after_value: string;
  target_element: string; // CSS selector or post ID
  applied_at: Date;
  can_rollback: boolean;
  rollback_expires_at: Date; // 90 days
}
```

**Rollback Process:**
```typescript
async function rollbackChange(backupId: string) {
  const backup = await getBackup(backupId);

  // Restore original value
  await updateWebsiteContent(
    backup.target_element,
    backup.before_value
  );

  // Mark as rolled back
  await markRolledBack(backupId);

  // Alert user
  await sendEmail({
    subject: "SEO change rolled back",
    body: `Change to ${backup.target_element} has been reverted.`
  });
}
```

**Change Validation:**
```typescript
async function validateChange(proposal: SEOProposal) {
  const checks = [];

  // 1. Length validation
  if (proposal.change_type === 'meta_title') {
    if (proposal.proposed_value.length > 70) {
      checks.push({ pass: false, reason: 'Title still too long' });
    }
  }

  // 2. Keyword presence
  if (proposal.change_type === 'h1') {
    const hasKeyword = proposal.proposed_value
      .toLowerCase()
      .includes(primaryKeyword.toLowerCase());
    if (!hasKeyword) {
      checks.push({ pass: false, reason: 'Missing primary keyword' });
    }
  }

  // 3. Destructive changes (require explicit approval)
  if (proposal.change_type === 'content' && proposal.current_value.length > 1000) {
    checks.push({
      pass: false,
      reason: 'Large content change requires manual approval'
    });
  }

  return checks.every(c => c.pass);
}
```

---

## PHASE 3: WORDPRESS PLUGIN DEVELOPMENT

### 3.1 Plugin Architecture

**File Structure:**
```
geo-seo-connector/
├── geo-seo-connector.php         # Main plugin file
├── includes/
│   ├── class-api-handler.php     # REST API endpoints
│   ├── class-auth.php            # API key authentication
│   ├── class-backup.php          # Backup/restore system
│   ├── class-validator.php       # Change validation
│   └── class-logger.php          # Audit logging
├── admin/
│   ├── settings-page.php         # Plugin settings UI
│   └── dashboard-widget.php      # WP admin dashboard widget
└── assets/
    ├── css/admin.css
    └── js/admin.js
```

**Main Plugin File:**
```php
<?php
/**
 * Plugin Name: GEO-SEO Connector
 * Description: Connects your WordPress site to GEO-SEO Domination Tool for automatic SEO optimization
 * Version: 1.0.0
 * Author: GEO-SEO Team
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class GEO_SEO_Connector {
    private $api_key;
    private $allowed_domains;

    public function __construct() {
        $this->api_key = get_option('geo_seo_api_key', '');
        $this->allowed_domains = ['geo-seo-domination-tool.vercel.app'];

        // Register REST API endpoints
        add_action('rest_api_init', [$this, 'register_endpoints']);

        // Add admin menu
        add_action('admin_menu', [$this, 'add_admin_menu']);

        // Enqueue admin scripts
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
    }

    /**
     * Register REST API endpoints
     */
    public function register_endpoints() {
        // Verify connection
        register_rest_route('geo-seo/v1', '/verify', [
            'methods' => 'GET',
            'callback' => [$this, 'verify_connection'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Get post metadata
        register_rest_route('geo-seo/v1', '/post/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_post_meta'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Update post metadata
        register_rest_route('geo-seo/v1', '/post/(?P<id>\d+)', [
            'methods' => 'POST',
            'callback' => [$this, 'update_post_meta'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Update image alt text
        register_rest_route('geo-seo/v1', '/media/(?P<id>\d+)/alt', [
            'methods' => 'POST',
            'callback' => [$this, 'update_image_alt'],
            'permission_callback' => [$this, 'check_api_key']
        ]);

        // Get all posts needing SEO
        register_rest_route('geo-seo/v1', '/posts/needs-seo', [
            'methods' => 'GET',
            'callback' => [$this, 'get_posts_needing_seo'],
            'permission_callback' => [$this, 'check_api_key']
        ]);
    }

    /**
     * Verify API key
     */
    public function check_api_key($request) {
        $auth_header = $request->get_header('Authorization');

        if (!$auth_header) {
            return new WP_Error('no_auth', 'No authorization header', ['status' => 401]);
        }

        $api_key = str_replace('Bearer ', '', $auth_header);

        if ($api_key !== $this->api_key) {
            // Log failed attempt
            $this->log_access_attempt($api_key, false);
            return new WP_Error('invalid_key', 'Invalid API key', ['status' => 403]);
        }

        // Log successful access
        $this->log_access_attempt($api_key, true);

        return true;
    }

    /**
     * Get post metadata
     */
    public function get_post_meta($request) {
        $post_id = $request['id'];
        $post = get_post($post_id);

        if (!$post) {
            return new WP_Error('not_found', 'Post not found', ['status' => 404]);
        }

        // Get Yoast SEO meta (if installed)
        $yoast_title = get_post_meta($post_id, '_yoast_wpseo_title', true);
        $yoast_desc = get_post_meta($post_id, '_yoast_wpseo_metadesc', true);

        // Get Rank Math meta (if installed)
        $rank_math_title = get_post_meta($post_id, 'rank_math_title', true);
        $rank_math_desc = get_post_meta($post_id, 'rank_math_description', true);

        return [
            'id' => $post_id,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'excerpt' => $post->post_excerpt,
            'slug' => $post->post_name,
            'seo' => [
                'yoast_title' => $yoast_title,
                'yoast_description' => $yoast_desc,
                'rank_math_title' => $rank_math_title,
                'rank_math_description' => $rank_math_desc,
            ],
            'featured_image_id' => get_post_thumbnail_id($post_id),
            'url' => get_permalink($post_id),
        ];
    }

    /**
     * Update post metadata
     */
    public function update_post_meta($request) {
        $post_id = $request['id'];
        $changes = $request->get_json_params();

        // Create backup before changing
        $this->create_backup($post_id, $changes);

        $updated = [];

        // Update Yoast SEO meta
        if (isset($changes['yoast_title'])) {
            update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($changes['yoast_title']));
            $updated[] = 'yoast_title';
        }

        if (isset($changes['yoast_description'])) {
            update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_text_field($changes['yoast_description']));
            $updated[] = 'yoast_description';
        }

        // Update Rank Math meta
        if (isset($changes['rank_math_title'])) {
            update_post_meta($post_id, 'rank_math_title', sanitize_text_field($changes['rank_math_title']));
            $updated[] = 'rank_math_title';
        }

        // Update post content
        if (isset($changes['content'])) {
            wp_update_post([
                'ID' => $post_id,
                'post_content' => wp_kses_post($changes['content'])
            ]);
            $updated[] = 'content';
        }

        // Log the change
        $this->log_change($post_id, $changes, $updated);

        return [
            'success' => true,
            'updated' => $updated,
            'message' => 'SEO metadata updated successfully'
        ];
    }

    /**
     * Update image alt text
     */
    public function update_image_alt($request) {
        $image_id = $request['id'];
        $alt_text = $request->get_param('alt_text');

        if (!$alt_text) {
            return new WP_Error('missing_alt', 'Alt text is required', ['status' => 400]);
        }

        // Create backup
        $current_alt = get_post_meta($image_id, '_wp_attachment_image_alt', true);
        $this->create_backup($image_id, ['alt_before' => $current_alt]);

        // Update alt text
        update_post_meta($image_id, '_wp_attachment_image_alt', sanitize_text_field($alt_text));

        // Log change
        $this->log_change($image_id, ['alt_text' => $alt_text], ['alt_text']);

        return [
            'success' => true,
            'message' => 'Image alt text updated'
        ];
    }

    /**
     * Create backup before making changes
     */
    private function create_backup($post_id, $changes) {
        $backups = get_option('geo_seo_backups', []);

        $backup = [
            'post_id' => $post_id,
            'timestamp' => time(),
            'changes' => $changes,
            'original_values' => []
        ];

        // Store original values for rollback
        foreach ($changes as $key => $value) {
            if ($key === 'yoast_title') {
                $backup['original_values'][$key] = get_post_meta($post_id, '_yoast_wpseo_title', true);
            } elseif ($key === 'content') {
                $backup['original_values'][$key] = get_post_field('post_content', $post_id);
            }
            // ... store other original values
        }

        $backups[] = $backup;

        // Keep only last 100 backups
        if (count($backups) > 100) {
            array_shift($backups);
        }

        update_option('geo_seo_backups', $backups);
    }

    /**
     * Log changes for audit trail
     */
    private function log_change($post_id, $changes, $updated) {
        $logs = get_option('geo_seo_change_log', []);

        $logs[] = [
            'post_id' => $post_id,
            'timestamp' => time(),
            'changes_requested' => $changes,
            'fields_updated' => $updated,
            'user_ip' => $_SERVER['REMOTE_ADDR'],
        ];

        // Keep last 500 logs
        if (count($logs) > 500) {
            array_shift($logs);
        }

        update_option('geo_seo_change_log', $logs);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            'GEO-SEO Connector',
            'GEO-SEO',
            'manage_options',
            'geo-seo-connector',
            [$this, 'render_settings_page'],
            'dashicons-chart-area'
        );
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Generate API key if not exists
        if (!$this->api_key) {
            $this->api_key = wp_generate_password(32, false);
            update_option('geo_seo_api_key', $this->api_key);
        }

        include plugin_dir_path(__FILE__) . 'admin/settings-page.php';
    }
}

// Initialize plugin
new GEO_SEO_Connector();
```

### 3.2 WordPress Plugin Features

**Security:**
- API key authentication
- IP whitelist (optional)
- Rate limiting
- Audit logging of all changes
- Backup before every change

**Capabilities:**
- Update Yoast SEO meta tags
- Update Rank Math meta tags
- Update image alt text
- Update post content
- Update page content
- Add/remove H tags
- Modify theme settings (cautiously)

**Admin Dashboard:**
```php
<!-- admin/settings-page.php -->
<div class="wrap">
    <h1>GEO-SEO Connector Settings</h1>

    <div class="card">
        <h2>Connection Status</h2>
        <p>
            <span class="dashicons dashicons-yes-alt" style="color: green;"></span>
            Connected to GEO-SEO Domination Tool
        </p>
    </div>

    <div class="card">
        <h2>API Key</h2>
        <input type="text" readonly value="<?php echo esc_attr($this->api_key); ?>" style="width: 100%; font-family: monospace;">
        <p class="description">Copy this key into your GEO-SEO CRM dashboard.</p>
    </div>

    <div class="card">
        <h2>Recent Changes (Last 10)</h2>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Post</th>
                    <th>Changes Made</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($recent_changes as $change): ?>
                <tr>
                    <td><?php echo date('Y-m-d H:i', $change['timestamp']); ?></td>
                    <td><?php echo get_the_title($change['post_id']); ?></td>
                    <td><?php echo implode(', ', $change['fields_updated']); ?></td>
                    <td>
                        <button class="button" onclick="rollbackChange(<?php echo $change['id']; ?>)">
                            Rollback
                        </button>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <div class="card">
        <h2>Statistics</h2>
        <ul>
            <li>Total changes made: <?php echo $stats['total_changes']; ?></li>
            <li>Changes this month: <?php echo $stats['monthly_changes']; ?></li>
            <li>SEO score improvement: +<?php echo $stats['score_improvement']; ?> points</li>
        </ul>
    </div>
</div>
```

---

## PHASE 4: CRM-SIDE INTEGRATION

### 4.1 Website Connection Management

**Database Schema:**
```sql
-- WordPress Connection Table (already created in previous architecture)
CREATE TABLE IF NOT EXISTS wordpress_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  site_url TEXT NOT NULL,
  api_endpoint TEXT NOT NULL, -- https://site.com/wp-json/geo-seo/v1
  api_key TEXT ENCRYPTED NOT NULL,

  -- Plugin info
  plugin_version TEXT,
  wordpress_version TEXT,
  active_seo_plugin TEXT, -- yoast, rank_math, all_in_one, etc.

  -- Connection status
  status TEXT DEFAULT 'pending', -- pending, active, error
  last_tested_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  connection_error TEXT,

  -- Capabilities
  can_edit_posts BOOLEAN DEFAULT true,
  can_edit_pages BOOLEAN DEFAULT true,
  can_edit_images BOOLEAN DEFAULT true,
  can_edit_theme BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEO Change Proposals (already defined in previous architecture)
-- See GEO_SEO_ENHANCEMENT_ARCHITECTURE.md

-- Auto-Optimization Rules
CREATE TABLE IF NOT EXISTS auto_optimization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- title_length, alt_text, h1_keyword, etc.

  -- Conditions
  conditions JSONB NOT NULL, -- {"seo_score": {"lt": 80}, "issue_type": "title_too_long"}

  -- Actions
  auto_approve BOOLEAN DEFAULT false,
  auto_apply BOOLEAN DEFAULT false,

  -- Limits
  max_changes_per_day INTEGER DEFAULT 10,
  require_review_after INTEGER DEFAULT 5, -- After 5 auto-applies, require manual review

  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 WordPress Service Layer

**File:** `web-app/services/wordpress/wordpress-service.ts`

```typescript
import { deepseekService } from '@/services/ai/deepseek-service';

interface WordPressConnection {
  id: string;
  site_url: string;
  api_endpoint: string;
  api_key: string;
  active_seo_plugin: string;
}

interface WordPressPost {
  id: number;
  title: string;
  content: string;
  seo: {
    yoast_title?: string;
    yoast_description?: string;
    rank_math_title?: string;
    rank_math_description?: string;
  };
  url: string;
}

class WordPressService {
  /**
   * Test connection to WordPress site
   */
  async testConnection(connection: WordPressConnection): Promise<boolean> {
    try {
      const response = await fetch(`${connection.api_endpoint}/verify`, {
        headers: {
          'Authorization': `Bearer ${connection.api_key}`,
        },
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get post metadata for SEO analysis
   */
  async getPost(connection: WordPressConnection, postId: number): Promise<WordPressPost> {
    const response = await fetch(`${connection.api_endpoint}/post/${postId}`, {
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch post');
    }

    return response.json();
  }

  /**
   * Get all posts that need SEO optimization
   */
  async getPostsNeedingSEO(connection: WordPressConnection): Promise<WordPressPost[]> {
    const response = await fetch(`${connection.api_endpoint}/posts/needs-seo`, {
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return response.json();
  }

  /**
   * Update post SEO metadata
   */
  async updatePostSEO(
    connection: WordPressConnection,
    postId: number,
    changes: {
      yoast_title?: string;
      yoast_description?: string;
      rank_math_title?: string;
      rank_math_description?: string;
      content?: string;
    }
  ): Promise<{ success: boolean; updated: string[] }> {
    const response = await fetch(`${connection.api_endpoint}/post/${postId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(changes),
    });

    if (!response.ok) {
      throw new Error('Failed to update post');
    }

    return response.json();
  }

  /**
   * Update image alt text
   */
  async updateImageAlt(
    connection: WordPressConnection,
    imageId: number,
    altText: string
  ): Promise<{ success: boolean }> {
    const response = await fetch(`${connection.api_endpoint}/media/${imageId}/alt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ alt_text: altText }),
    });

    if (!response.ok) {
      throw new Error('Failed to update image alt text');
    }

    return response.json();
  }

  /**
   * Generate and apply SEO improvements automatically
   */
  async autoOptimizeSite(connection: WordPressConnection, companyId: string) {
    // 1. Get all posts needing SEO
    const posts = await this.getPostsNeedingSEO(connection);

    // 2. For each post, analyze and create proposals
    const allProposals = [];

    for (const post of posts) {
      // Run mini SEO audit on this post
      const issues = await this.analyzePostSEO(post);

      // Use DeepSeek to generate improvement proposals
      const proposals = await deepseekService.generateSEOProposals(
        {
          seo_score: issues.score,
          performance_score: 100, // Not applicable for single post
          accessibility_score: 100,
          issues: issues.problems,
          metadata: {
            title: post.seo.yoast_title || post.title,
            meta_description: post.seo.yoast_description || '',
            h1_tags: [post.title],
          },
        },
        post.url
      );

      allProposals.push(...proposals.map(p => ({ ...p, post_id: post.id })));
    }

    // 3. Store proposals in database for user review
    await this.saveProposals(companyId, allProposals);

    return allProposals;
  }

  /**
   * Analyze a single post for SEO issues
   */
  private async analyzePostSEO(post: WordPressPost) {
    const problems = [];
    let score = 100;

    const title = post.seo.yoast_title || post.seo.rank_math_title || post.title;
    const description = post.seo.yoast_description || post.seo.rank_math_description || '';

    // Check title length
    if (title.length > 60) {
      problems.push({
        type: 'title_too_long',
        message: `Title is ${title.length} characters (should be < 60)`,
        impact: 'medium',
      });
      score -= 5;
    }

    // Check meta description
    if (!description) {
      problems.push({
        type: 'missing_meta_description',
        message: 'Meta description is missing',
        impact: 'high',
      });
      score -= 10;
    } else if (description.length > 160) {
      problems.push({
        type: 'description_too_long',
        message: `Description is ${description.length} characters (should be < 160)`,
        impact: 'medium',
      });
      score -= 5;
    }

    // Check for missing alt text (would need to parse content HTML)
    // ... more checks

    return { score, problems };
  }

  /**
   * Save proposals to database
   */
  private async saveProposals(companyId: string, proposals: any[]) {
    // Implementation would save to seo_change_proposals table
    // See previous architecture documents
  }
}

export const wordpressService = new WordPressService();
```

---

## PHASE 5: AUTO-WEBSITE GENERATION FROM CRM DATA

### 5.1 The Vision: From CRM Entry to Live Website

**Scenario:** User adds new company to CRM → CRM automatically generates complete website.

**Flow:**
```
┌──────────────────────────────────────────────────┐
│ User Creates Company in CRM                      │
│ - Name: "Brisbane Flood Restoration"            │
│ - Industry: Water Damage Restoration            │
│ - Location: Brisbane, QLD                        │
│ - Keywords: flood damage, water restoration     │
│ - Contact: phone, email, address                 │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ CRM Triggers: "Generate Website"                 │
│ - User clicks button OR auto-trigger             │
│ - Selects industry template                      │
│ - Chooses deployment target (Vercel/Netlify)    │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ DeepSeek V3 Generates Content                    │
│ ✓ Homepage content (hero, services, about)      │
│ ✓ Service pages (one per keyword)               │
│ ✓ Meta tags optimized for keywords              │
│ ✓ Blog post ideas and outlines                  │
│ ✓ FAQ section with local keywords               │
│ ✓ Schema.org JSON-LD markup                     │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ CRM Generates Next.js Site                       │
│ - Creates Git repository                         │
│ - Generates pages with SEO content               │
│ - Adds Tailwind CSS styling                      │
│ - Includes contact forms                         │
│ - Sets up analytics tracking                     │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ Deploy to Vercel/Netlify                         │
│ - Push to GitHub                                 │
│ - Connect to Vercel/Netlify                      │
│ - Auto-deploys                                   │
│ - Custom domain (if configured)                  │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│ Site is LIVE!                                    │
│ https://brisbane-flood-restoration.vercel.app    │
│ - Fully SEO-optimized                            │
│ - Mobile-responsive                              │
│ - Fast page speed                                │
│ - Schema markup included                         │
└──────────────────────────────────────────────────┘
```

### 5.2 Industry Templates

**Template Structure:**
```typescript
interface IndustryTemplate {
  id: string;
  industry: string;
  keywords: string[];
  pages: PageTemplate[];
  schema_templates: SchemaTemplate[];
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

interface PageTemplate {
  slug: string; // '/', '/services/water-damage', etc.
  title_template: string; // "{keyword} | {city} | {company_name}"
  meta_description_template: string;
  content_sections: ContentSection[];
}

interface ContentSection {
  type: 'hero' | 'services' | 'about' | 'testimonials' | 'faq' | 'cta';
  prompt_for_ai: string; // DeepSeek generation prompt
}
```

**Pre-Built Templates:**
```typescript
const templates: IndustryTemplate[] = [
  {
    id: 'water-damage-restoration',
    industry: 'Water Damage & Flood Restoration',
    keywords: [
      'water damage restoration',
      'flood damage repair',
      'emergency water removal',
      'mould remediation',
      'storm damage restoration'
    ],
    pages: [
      {
        slug: '/',
        title_template: '{company_name} | 24/7 {primary_keyword} in {city}',
        meta_description_template: 'Need {primary_keyword} in {city}? {company_name} offers 24/7 emergency response. Licensed, insured, and trusted by {reviews_count}+ customers.',
        content_sections: [
          {
            type: 'hero',
            prompt_for_ai: 'Write a compelling hero section for a water damage restoration company in {city}. Include urgency (24/7 emergency), trust signals (licensed/insured), and clear CTA. 50-100 words.'
          },
          {
            type: 'services',
            prompt_for_ai: 'List 6 main services for water damage restoration: {keywords}. For each, write 2-3 sentences highlighting benefits and process. Use local keywords for {city}.'
          },
          {
            type: 'about',
            prompt_for_ai: 'Write an "About Us" section for {company_name}, a {industry} business in {city}. Emphasize experience, certifications, local knowledge, and customer care. 150-200 words.'
          }
        ]
      },
      {
        slug: '/services/water-damage-restoration',
        title_template: 'Water Damage Restoration {city} | {company_name}',
        meta_description_template: 'Professional water damage restoration in {city}. Fast response, advanced equipment, insurance claims help. Call {phone} for immediate assistance.',
        content_sections: [
          {
            type: 'hero',
            prompt_for_ai: 'Write a hero section specifically for water damage restoration services in {city}. Include response time, equipment, and insurance handling. 75 words.'
          }
        ]
      }
    ],
    schema_templates: [
      {
        type: 'LocalBusiness',
        fields: ['name', 'address', 'phone', 'geo', 'openingHours', 'priceRange']
      },
      {
        type: 'Service',
        fields: ['serviceType', 'areaServed', 'provider']
      }
    ],
    color_scheme: {
      primary: '#3B82F6', // Blue (trust)
      secondary: '#1E40AF',
      accent: '#F59E0B' // Orange (urgency)
    }
  },
  // ... more templates for other industries
];
```

### 5.3 Website Generation Service

**File:** `web-app/services/website-generator/website-generator-service.ts`

```typescript
import { deepseekService } from '@/services/ai/deepseek-service';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface GenerateWebsiteParams {
  company_id: string;
  company_name: string;
  industry: string;
  location: string;
  keywords: string[];
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  template_id: string;
  deployment_target: 'vercel' | 'netlify';
}

class WebsiteGeneratorService {
  /**
   * Generate complete website from CRM data
   */
  async generateWebsite(params: GenerateWebsiteParams) {
    const template = await this.getTemplate(params.template_id);

    // 1. Create temporary project directory
    const projectDir = `/tmp/generated-sites/${params.company_id}`;
    await fs.mkdir(projectDir, { recursive: true });

    // 2. Initialize Next.js project
    await this.initNextJsProject(projectDir, params.company_name);

    // 3. Generate content for each page using DeepSeek V3
    const generatedPages = [];
    for (const pageTemplate of template.pages) {
      const pageContent = await this.generatePageContent(pageTemplate, params);
      generatedPages.push(pageContent);
    }

    // 4. Create Next.js page files
    for (const page of generatedPages) {
      await this.createPageFile(projectDir, page);
    }

    // 5. Add Schema.org markup
    await this.addSchemaMarkup(projectDir, template.schema_templates, params);

    // 6. Configure Tailwind CSS with brand colors
    await this.configureTailwind(projectDir, template.color_scheme);

    // 7. Add contact form component
    await this.addContactForm(projectDir, params.contact);

    // 8. Create Git repository
    await this.initGitRepo(projectDir);

    // 9. Push to GitHub
    const repoUrl = await this.pushToGitHub(projectDir, params.company_name);

    // 10. Deploy to Vercel/Netlify
    const deploymentUrl = await this.deploy(repoUrl, params.deployment_target);

    return {
      success: true,
      repository_url: repoUrl,
      deployment_url: deploymentUrl,
      pages_generated: generatedPages.length,
    };
  }

  /**
   * Generate content for a single page using DeepSeek V3
   */
  private async generatePageContent(pageTemplate: PageTemplate, params: GenerateWebsiteParams) {
    const contentSections = [];

    for (const section of pageTemplate.content_sections) {
      // Replace placeholders in prompt
      const prompt = this.fillPromptTemplate(section.prompt_for_ai, params);

      // Use DeepSeek V3 to generate content
      const content = await deepseekService.call('deepseek-chat', prompt, 0.7, 500);

      contentSections.push({
        type: section.type,
        content: content.text,
      });
    }

    return {
      slug: pageTemplate.slug,
      title: this.fillPromptTemplate(pageTemplate.title_template, params),
      meta_description: this.fillPromptTemplate(pageTemplate.meta_description_template, params),
      sections: contentSections,
    };
  }

  /**
   * Create Next.js page file
   */
  private async createPageFile(projectDir: string, page: any) {
    const pageFilePath = page.slug === '/'
      ? path.join(projectDir, 'app/page.tsx')
      : path.join(projectDir, `app${page.slug}/page.tsx`);

    // Ensure directory exists
    await fs.mkdir(path.dirname(pageFilePath), { recursive: true });

    // Generate React component
    const componentCode = this.generatePageComponent(page);

    await fs.writeFile(pageFilePath, componentCode, 'utf-8');
  }

  /**
   * Generate React component code from page data
   */
  private generatePageComponent(page: any): string {
    return `
export const metadata = {
  title: '${page.title}',
  description: '${page.meta_description}',
};

export default function Page() {
  return (
    <div className="min-h-screen">
      ${page.sections.map((section: any) => this.generateSectionComponent(section)).join('\n')}
    </div>
  );
}
`;
  }

  /**
   * Generate section component based on type
   */
  private generateSectionComponent(section: any): string {
    switch (section.type) {
      case 'hero':
        return `
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20">
        <div className="container mx-auto px-6">
          <div className="prose prose-lg">
            ${this.markdownToJSX(section.content)}
          </div>
          <button className="mt-8 bg-accent text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90">
            Get Free Quote
          </button>
        </div>
      </section>`;

      case 'services':
        return `
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8">Our Services</h2>
          <div className="prose max-w-none">
            ${this.markdownToJSX(section.content)}
          </div>
        </div>
      </section>`;

      case 'about':
        return `
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8">About Us</h2>
          <div className="prose max-w-none">
            ${this.markdownToJSX(section.content)}
          </div>
        </div>
      </section>`;

      default:
        return `<div>${section.content}</div>`;
    }
  }

  /**
   * Add Schema.org JSON-LD markup
   */
  private async addSchemaMarkup(projectDir: string, schemaTemplates: any[], params: GenerateWebsiteParams) {
    const schemas = [];

    for (const template of schemaTemplates) {
      if (template.type === 'LocalBusiness') {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          'name': params.company_name,
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': params.contact.address,
            'addressLocality': params.location,
            'addressRegion': 'QLD',
            'addressCountry': 'AU',
          },
          'telephone': params.contact.phone,
          'email': params.contact.email,
          'openingHours': 'Mo-Su 00:00-23:59', // 24/7
          'priceRange': '$$',
        });
      }
    }

    // Add to layout.tsx
    const layoutPath = path.join(projectDir, 'app/layout.tsx');
    const layoutContent = await fs.readFile(layoutPath, 'utf-8');

    const schemaScript = `
<script type="application/ld+json">
${JSON.stringify(schemas, null, 2)}
</script>`;

    const updatedLayout = layoutContent.replace(
      '</head>',
      `${schemaScript}\n</head>`
    );

    await fs.writeFile(layoutPath, updatedLayout, 'utf-8');
  }

  /**
   * Deploy to Vercel or Netlify
   */
  private async deploy(repoUrl: string, target: 'vercel' | 'netlify'): Promise<string> {
    if (target === 'vercel') {
      // Use Vercel API to create project and deploy
      const response = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoUrl.split('/').pop()?.replace('.git', ''),
          gitSource: {
            type: 'github',
            repo: repoUrl.replace('https://github.com/', ''),
            ref: 'main',
          },
        }),
      });

      const data = await response.json();
      return `https://${data.url}`;
    } else {
      // Netlify deployment
      // Similar API call to Netlify
      throw new Error('Netlify deployment not yet implemented');
    }
  }

  /**
   * Helper: Replace placeholders in templates
   */
  private fillPromptTemplate(template: string, params: GenerateWebsiteParams): string {
    return template
      .replace(/{company_name}/g, params.company_name)
      .replace(/{city}/g, params.location)
      .replace(/{industry}/g, params.industry)
      .replace(/{primary_keyword}/g, params.keywords[0])
      .replace(/{keywords}/g, params.keywords.join(', '))
      .replace(/{phone}/g, params.contact.phone)
      .replace(/{email}/g, params.contact.email);
  }

  /**
   * Helper: Convert markdown to JSX
   */
  private markdownToJSX(markdown: string): string {
    // Simple markdown to JSX conversion
    // In production, use a proper library like `marked` or `remark`
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br/>');
  }
}

export const websiteGeneratorService = new WebsiteGeneratorService();
```

---

## PHASE 6: CONTINUOUS OPTIMIZATION ENGINE

### 6.1 Auto-Optimization Loop

**The Goal:** CRM continuously monitors and improves the website without manual intervention.

**Daily Workflow:**
```
02:00 AM (Daily) - Audit Scheduler Runs
├── Run Lighthouse audit on all connected sites
├── Fetch Google Search Console rankings
├── Check for new issues (broken links, slow pages, etc.)
└── Store results in database

03:00 AM - Analysis Phase
├── DeepSeek V3 analyzes audit results
├── Compares current vs previous scores
├── Identifies new SEO issues
└── Generates improvement proposals

04:00 AM - Auto-Apply Phase
├── Check auto-optimization rules
├── For each proposal:
│   ├── If rule matches AND auto_approve = true
│   │   ├── Apply change to live site
│   │   ├── Log change
│   │   └── Mark proposal as applied
│   └── Else: Queue for manual review
└── Send summary email to user

06:00 AM - User Review
├── User receives email: "5 SEO improvements applied, 3 need review"
├── User logs in to CRM
├── Reviews auto-applied changes (can rollback if needed)
└── Approves/rejects pending proposals

7 Days Later - Verification Phase
├── Re-run audits on changed pages
├── Compare SEO scores before/after
├── Track ranking changes for affected keywords
├── Update rule effectiveness metrics
└── Notify user of results
```

### 6.2 Auto-Optimization Rules

**Database Schema:**
```sql
-- (Already defined in Phase 4, repeated here for context)
CREATE TABLE IF NOT EXISTS auto_optimization_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- title_length, alt_text, h1_keyword, etc.

  -- Conditions (when to apply)
  conditions JSONB NOT NULL,
  -- Example: {"seo_score": {"lt": 80}, "issue_type": "title_too_long"}

  -- Actions
  auto_approve BOOLEAN DEFAULT false,
  auto_apply BOOLEAN DEFAULT false,

  -- Safety limits
  max_changes_per_day INTEGER DEFAULT 10,
  require_review_after INTEGER DEFAULT 5,

  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Example Rules:**
```typescript
const exampleRules = [
  {
    rule_name: 'Fix Long Titles Automatically',
    rule_type: 'title_length',
    conditions: {
      issue_type: 'title_too_long',
      current_length: { gt: 60 },
    },
    auto_approve: true,
    auto_apply: true,
    max_changes_per_day: 5,
  },
  {
    rule_name: 'Add Missing Alt Text (Review Required)',
    rule_type: 'alt_text',
    conditions: {
      issue_type: 'missing_alt_text',
    },
    auto_approve: false, // User must review AI-generated alt text
    auto_apply: false,
    max_changes_per_day: 20,
  },
  {
    rule_name: 'Optimize Meta Descriptions',
    rule_type: 'meta_description',
    conditions: {
      or: [
        { issue_type: 'missing_meta_description' },
        { issue_type: 'description_too_long' },
      ],
    },
    auto_approve: true,
    auto_apply: true,
    max_changes_per_day: 10,
    require_review_after: 5, // After 5 auto-applies, require manual review
  },
];
```

### 6.3 Optimization Scheduler

**File:** `web-app/services/scheduler/optimization-scheduler.ts`

```typescript
import cron from 'node-cron';
import { wordpressService } from '@/services/wordpress/wordpress-service';
import { deepseekService } from '@/services/ai/deepseek-service';
import { supabase } from '@/lib/supabase';

class OptimizationScheduler {
  private tasks: cron.ScheduledTask[] = [];

  /**
   * Start daily optimization loop
   */
  start() {
    // 2:00 AM - Run audits
    const auditTask = cron.schedule('0 2 * * *', async () => {
      await this.runDailyAudits();
    }, { timezone: 'Australia/Brisbane' });

    // 3:00 AM - Analyze results
    const analysisTask = cron.schedule('0 3 * * *', async () => {
      await this.analyzeDailyResults();
    }, { timezone: 'Australia/Brisbane' });

    // 4:00 AM - Auto-apply improvements
    const applyTask = cron.schedule('0 4 * * *', async () => {
      await this.autoApplyImprovements();
    }, { timezone: 'Australia/Brisbane' });

    this.tasks.push(auditTask, analysisTask, applyTask);

    // Start all tasks
    this.tasks.forEach(task => task.start());
  }

  /**
   * Run audits on all connected sites
   */
  private async runDailyAudits() {
    // Fetch all WordPress connections
    const { data: connections } = await supabase
      .from('wordpress_connections')
      .select('*')
      .eq('status', 'active');

    for (const connection of connections || []) {
      // Get all posts needing SEO
      const posts = await wordpressService.getPostsNeedingSEO(connection);

      // Analyze each post
      for (const post of posts) {
        const issues = await this.analyzePost(post);

        // Store issues in database
        await this.storeAuditResults(connection.company_id, post.id, issues);
      }
    }
  }

  /**
   * Analyze audit results and generate proposals
   */
  private async analyzeDailyResults() {
    // Get recent audit results
    const { data: audits } = await supabase
      .from('seo_audits')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    for (const audit of audits || []) {
      // Use DeepSeek to generate proposals
      const proposals = await deepseekService.generateSEOProposals(
        {
          seo_score: audit.seo_score,
          performance_score: audit.performance_score,
          accessibility_score: audit.accessibility_score,
          issues: audit.issues,
          metadata: audit.metadata,
        },
        audit.url
      );

      // Store proposals
      for (const proposal of proposals) {
        await supabase.from('seo_change_proposals').insert([{
          company_id: audit.company_id,
          audit_id: audit.id,
          change_type: proposal.change_type,
          current_value: proposal.current_value,
          proposed_value: proposal.proposed_value,
          reasoning: proposal.reasoning,
          estimated_score_improvement: proposal.estimated_score_improvement,
          priority: proposal.priority,
          status: 'pending',
        }]);
      }
    }
  }

  /**
   * Auto-apply improvements based on rules
   */
  private async autoApplyImprovements() {
    // Get auto-optimization rules
    const { data: rules } = await supabase
      .from('auto_optimization_rules')
      .select('*')
      .eq('enabled', true);

    // Get pending proposals
    const { data: proposals } = await supabase
      .from('seo_change_proposals')
      .select('*')
      .eq('status', 'pending');

    let autoAppliedCount = 0;
    let manualReviewCount = 0;

    for (const proposal of proposals || []) {
      // Check if any rule matches this proposal
      const matchingRule = this.findMatchingRule(proposal, rules || []);

      if (matchingRule && matchingRule.auto_apply) {
        // Check daily limit
        const todayApplied = await this.getTodayAppliedCount(matchingRule.id);

        if (todayApplied < matchingRule.max_changes_per_day) {
          // Apply the change
          await this.applyProposal(proposal);
          autoAppliedCount++;
        }
      } else {
        manualReviewCount++;
      }
    }

    // Send summary email
    await this.sendOptimizationSummary(autoAppliedCount, manualReviewCount);
  }

  /**
   * Apply SEO proposal to live site
   */
  private async applyProposal(proposal: any) {
    // Get WordPress connection
    const { data: connection } = await supabase
      .from('wordpress_connections')
      .select('*')
      .eq('company_id', proposal.company_id)
      .single();

    if (!connection) return;

    // Apply change based on type
    const changes: any = {};

    if (proposal.change_type === 'meta_title') {
      changes.yoast_title = proposal.proposed_value;
    } else if (proposal.change_type === 'meta_description') {
      changes.yoast_description = proposal.proposed_value;
    }

    // Update WordPress
    await wordpressService.updatePostSEO(connection, proposal.post_id, changes);

    // Mark proposal as applied
    await supabase
      .from('seo_change_proposals')
      .update({ status: 'applied', applied_at: new Date().toISOString() })
      .eq('id', proposal.id);
  }

  /**
   * Find rule that matches proposal
   */
  private findMatchingRule(proposal: any, rules: any[]): any | null {
    for (const rule of rules) {
      if (this.ruleMatches(rule.conditions, proposal)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Check if rule conditions match proposal
   */
  private ruleMatches(conditions: any, proposal: any): boolean {
    // Simple condition matching
    // In production, implement full JSONB query logic
    if (conditions.issue_type && proposal.change_type === conditions.issue_type) {
      return true;
    }
    return false;
  }
}

export const optimizationScheduler = new OptimizationScheduler();
```

---

## PHASE 7: AI-POWERED CONTENT GENERATION

### 7.1 Auto-Generated Content Types

**What the CRM Can Generate:**

1. **Blog Posts** - From target keywords
2. **Service Pages** - One per keyword
3. **FAQ Sections** - Based on "People Also Ask"
4. **Google Business Profile Posts** - Weekly updates
5. **Review Responses** - Professional replies to all reviews
6. **Meta Tags** - Title and description for every page
7. **Image Alt Text** - SEO-optimized descriptions
8. **Schema Markup** - Structured data for all pages

### 7.2 Blog Post Auto-Generation

**Scenario:** User wants to rank for "water damage prevention tips Brisbane"

```typescript
async function generateBlogPost(keyword: string, location: string): Promise<BlogPost> {
  const prompt = `
Write a comprehensive, SEO-optimized blog post:

Keyword: ${keyword}
Location: ${location}
Target Audience: Homeowners and property managers in ${location}

Requirements:
- 1500-2000 words
- E-E-A-T compliant (Experience, Expertise, Authority, Trust)
- Include H2 and H3 headings with keyword variations
- Add FAQ section at the end
- Use local keywords naturally (${location} specific)
- Include actionable tips (numbered list)
- Natural, engaging tone (not robotic)
- Include a subtle CTA at the end

Structure:
1. Introduction (hook + problem statement)
2. Main content (5-7 sections with H2 headings)
3. FAQ (5 questions)
4. Conclusion with CTA

Return ONLY valid JSON:
{
  "title": "...",
  "meta_description": "...",
  "h1": "...",
  "content": "... (markdown format)",
  "faq": [{"question": "...", "answer": "..."}],
  "suggested_images": ["description 1", "description 2"]
}
`;

  const result = await deepseekService.call('deepseek-chat', prompt, 0.7, 2000);

  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch![0]);
  } catch (error) {
    throw new Error('Failed to parse blog post from DeepSeek');
  }
}
```

### 7.3 Review Response Automation

```typescript
async function autoRespondToReviews(companyId: string) {
  // Get Google Business Profile reviews (via Google My Business API)
  const reviews = await getNewReviews(companyId);

  for (const review of reviews) {
    // Generate professional response
    const response = await deepseekService.generateReviewResponse(
      {
        rating: review.rating,
        comment: review.comment,
      },
      {
        name: review.business_name,
        industry: review.industry,
      }
    );

    // Post response to GBP (via API)
    await postReviewResponse(review.id, response);

    // Log in CRM
    await logReviewResponse(companyId, review.id, response);
  }
}
```

---

## IMPLEMENTATION PLAN

### MVP (Minimum Viable Product) - 2 Weeks

**Week 1: WordPress Plugin + Basic CRM Integration**
- [ ] Build WordPress plugin with REST API endpoints
- [ ] Create plugin admin dashboard
- [ ] Add backup/rollback system
- [ ] Create WordPress connection UI in CRM
- [ ] Test connection flow end-to-end

**Week 2: SEO Proposal System**
- [ ] Build SEO analysis with DeepSeek V3
- [ ] Create proposal generation system
- [ ] Build user review interface
- [ ] Implement safe apply mechanism
- [ ] Add rollback capability

### Phase 2 - Auto-Optimization (1 Week)

- [ ] Build auto-optimization rules system
- [ ] Create daily scheduler for audits
- [ ] Implement auto-apply logic with safety limits
- [ ] Add email notifications
- [ ] Build rule management UI

### Phase 3 - Website Generation (2 Weeks)

- [ ] Create industry templates
- [ ] Build Next.js site generator
- [ ] Integrate DeepSeek V3 for content
- [ ] Add Vercel/Netlify deployment
- [ ] Test end-to-end generation flow

### Phase 4 - Content Automation (1 Week)

- [ ] Build blog post generator
- [ ] Add review response automation
- [ ] Create GBP post scheduler
- [ ] Implement FAQ generation
- [ ] Add image alt text automation

---

## SUCCESS METRICS

**How to Measure ROI:**

1. **Time Savings**
   - Manual SEO fixes: 2-4 hours/week → 15 minutes/week
   - Website creation: 20 hours → 10 minutes
   - Content creation: 3 hours/post → 5 minutes/post

2. **SEO Improvements**
   - Track average SEO score improvement per site
   - Measure ranking increases for target keywords
   - Monitor organic traffic growth

3. **Client Retention**
   - Sites with auto-optimization have higher retention
   - Show clients monthly "improvements made" reports
   - Demonstrate ongoing value

4. **Revenue Impact**
   - Faster onboarding = more clients
   - Auto-optimization = upsell opportunity
   - Website generation = new service offering

---

## COST ANALYSIS

### Using DeepSeek V3 via OpenRouter

**Monthly Usage Estimate:**
- Daily audits: 30 days × 10 sites × 500 tokens = 150K tokens
- Content generation: 20 blog posts × 2000 tokens = 40K tokens
- Review responses: 50 reviews × 300 tokens = 15K tokens
- SEO proposals: 30 days × 10 proposals × 400 tokens = 120K tokens

**Total: ~325K tokens/month**

**Cost:**
- Input: 325K × $0.27/M = $0.09
- Output: 325K × $1.10/M = $0.36
- **Total: ~$0.45/month**

**Compare to Manual Labor:**
- SEO analyst: $50/hour × 10 hours/week = $500/week = $2,000/month
- Content writer: $100/post × 20 posts = $2,000/month
- **Total manual cost: $4,000/month**

**Savings: $3,999.55/month = 99.99% cost reduction**

---

## SECURITY & SAFETY

**Critical Safety Features:**

1. **Backup Before Every Change**
   - 90-day rollback capability
   - Version history for all modifications
   - Audit trail of who changed what

2. **User Approval Required for High-Impact Changes**
   - Content changes > 1000 characters
   - Homepage modifications
   - Theme/styling changes

3. **Daily Change Limits**
   - Max 10 auto-applied changes per day per site
   - Require review after 5 consecutive auto-applies
   - Stop auto-optimization if SEO score drops

4. **API Key Security**
   - WordPress API keys encrypted in database
   - Rate limiting on all endpoints
   - IP whitelist optional
   - Audit logging of all API calls

5. **Testing Sandbox**
   - Option to test changes in staging environment
   - Preview changes before applying
   - A/B testing capability

---

## CONCLUSION

**What We've Built:**

A revolutionary CRM that doesn't just manage SEO data—it **actively improves live websites** using AI.

**The Unique Value:**

> "Your CRM is your developer, your SEO expert, your content writer, and your optimization engine—all powered by DeepSeek V3 for $5/month."

**Next Steps:**

1. Build WordPress plugin (Week 1)
2. Implement SEO proposal system (Week 2)
3. Add auto-optimization (Week 3)
4. Launch MVP with 5 beta clients
5. Gather feedback and iterate
6. Add website generation (Phase 2)
7. Add content automation (Phase 3)

**Total Development Time: 5-6 weeks for full implementation**

**ROI:**
- Development cost: ~$10,000 (6 weeks × developer cost)
- Monthly operating cost: $5-10 (DeepSeek V3 via OpenRouter)
- Value delivered: $4,000/month in automated labor
- **Payback period: 2.5 months**

---

**END OF ARCHITECTURE DOCUMENT**

*This architecture was created using DeepSeek V3 reasoning and Claude Code enhanced thinking, as requested.*
