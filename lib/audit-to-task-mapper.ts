/**
 * Audit-to-Task Mapper
 *
 * Converts SEO audit findings into structured agent tasks
 * Maps audit issues/recommendations → executable agent tasks with instructions
 */

import type { SEOAudit, AuditIssue } from '@/types/database';
import type {
  AgentTask,
  TaskInstructions,
  TaskPriority,
  TaskCategory,
  AgentType,
} from '@/types/post-audit-automation';

export interface TaskMapping {
  task_type: string;
  category: TaskCategory;
  priority: TaskPriority;
  agent_type: AgentType;
  instructions: TaskInstructions;
  page_url?: string;
  element_selector?: string;
  estimated_time_seconds: number;
  requires_approval: boolean;
}

/**
 * Main mapper function: Convert audit results into agent tasks
 */
export function mapAuditToTasks(
  audit: SEOAudit,
  companyId: string
): Omit<AgentTask, 'id' | 'created_at' | 'updated_at'>[] {
  const tasks: Omit<AgentTask, 'id' | 'created_at' | 'updated_at'>[] = [];

  // 1. Map explicit issues
  if (audit.issues && audit.issues.length > 0) {
    audit.issues.forEach((issue: AuditIssue) => {
      const taskMapping = mapIssueToTask(issue, audit.url);
      if (taskMapping) {
        tasks.push(createTaskFromMapping(taskMapping, companyId, audit.id));
      }
    });
  }

  // 2. Map recommendations
  const extendedData = audit.extended_data as any;
  if (extendedData?.recommendations && Array.isArray(extendedData.recommendations)) {
    extendedData.recommendations.forEach((rec: any) => {
      const taskMapping = mapRecommendationToTask(rec, audit.url);
      if (taskMapping) {
        tasks.push(createTaskFromMapping(taskMapping, companyId, audit.id));
      }
    });
  }

  // 3. Map performance issues (Lighthouse)
  if (audit.performance_score !== undefined && audit.performance_score < 75) {
    const perfTasks = mapPerformanceIssues(audit, companyId);
    tasks.push(...perfTasks);
  }

  // 4. Map accessibility issues
  if (audit.accessibility_score !== undefined && audit.accessibility_score < 85) {
    const a11yTasks = mapAccessibilityIssues(audit, companyId);
    tasks.push(...a11yTasks);
  }

  // 5. Map SEO issues
  if (audit.seo_score !== undefined && audit.seo_score < 85) {
    const seoTasks = mapSEOIssues(audit, companyId);
    tasks.push(...seoTasks);
  }

  return tasks;
}

/**
 * Map individual audit issue to task
 */
function mapIssueToTask(issue: AuditIssue, pageUrl: string): TaskMapping | null {
  const { type, category, message, impact } = issue;

  // Missing H1 Tag
  if (message.toLowerCase().includes('missing h1')) {
    return {
      task_type: 'add_h1_tag',
      category: 'seo',
      priority: impact === 'high' ? 'high' : 'medium',
      agent_type: 'wp_rest_api',
      instructions: {
        action: 'add_element',
        element: 'h1',
        content: generateH1FromUrl(pageUrl),
        position: 'before_first_paragraph',
        reasoning: 'H1 tag is critical for page structure and SEO',
      },
      page_url: pageUrl,
      element_selector: 'h1',
      estimated_time_seconds: 15,
      requires_approval: false,
    };
  }

  // Missing Meta Description
  if (message.toLowerCase().includes('missing') && message.toLowerCase().includes('meta description')) {
    return {
      task_type: 'add_meta_description',
      category: 'seo',
      priority: 'high',
      agent_type: 'wp_rest_api',
      instructions: {
        action: 'add_meta_tag',
        name: 'description',
        content: generateMetaDescription(pageUrl),
        reasoning: 'Meta description improves click-through rate from search results',
      },
      page_url: pageUrl,
      estimated_time_seconds: 20,
      requires_approval: true, // Meta descriptions should be reviewed
    };
  }

  // Missing Alt Text
  if (message.toLowerCase().includes('missing') && message.toLowerCase().includes('alt')) {
    return {
      task_type: 'add_alt_text',
      category: 'accessibility',
      priority: impact === 'high' ? 'high' : 'medium',
      agent_type: 'wp_rest_api',
      instructions: {
        action: 'add_image_alt_text',
        selector: 'img:not([alt])',
        ai_generate: true,
        reasoning: 'Alt text improves accessibility and image SEO',
      },
      page_url: pageUrl,
      element_selector: 'img:not([alt])',
      estimated_time_seconds: 60,
      requires_approval: false,
    };
  }

  // Short Title Tag
  if (message.toLowerCase().includes('title') && message.toLowerCase().includes('too short')) {
    return {
      task_type: 'improve_title_tag',
      category: 'seo',
      priority: 'medium',
      agent_type: 'wp_rest_api',
      instructions: {
        action: 'update_title',
        current_length: extractNumber(message) || 0,
        target_length: 60,
        ai_improve: true,
        reasoning: 'Optimal title length is 50-60 characters for search results',
      },
      page_url: pageUrl,
      estimated_time_seconds: 30,
      requires_approval: true,
    };
  }

  // Broken Internal Link
  if (message.toLowerCase().includes('broken') && message.toLowerCase().includes('link')) {
    return {
      task_type: 'fix_broken_link',
      category: 'content',
      priority: 'high',
      agent_type: 'wp_rest_api',
      instructions: {
        action: 'fix_link',
        broken_url: extractUrl(message),
        suggest_replacement: true,
        reasoning: 'Broken links harm user experience and SEO',
      },
      page_url: pageUrl,
      estimated_time_seconds: 45,
      requires_approval: false,
    };
  }

  // Multiple H1 Tags (should only be one)
  if (message.toLowerCase().includes('multiple h1')) {
    return {
      task_type: 'fix_multiple_h1',
      category: 'seo',
      priority: 'medium',
      agent_type: 'wp_rest_api',
      instructions: {
        action: 'consolidate_h1_tags',
        keep_first: true,
        convert_others_to: 'h2',
        reasoning: 'Only one H1 tag should exist per page for proper semantic structure',
      },
      page_url: pageUrl,
      element_selector: 'h1',
      estimated_time_seconds: 20,
      requires_approval: false,
    };
  }

  // Default: Create generic task
  return null;
}

/**
 * Map recommendation to task
 */
function mapRecommendationToTask(recommendation: any, pageUrl: string): TaskMapping | null {
  let recText: string;

  // Handle both string recommendations and object recommendations
  if (typeof recommendation === 'string') {
    recText = recommendation.toLowerCase();
  } else if (typeof recommendation === 'object' && recommendation !== null) {
    recText = (recommendation.title || recommendation.description || JSON.stringify(recommendation)).toLowerCase();
  } else {
    return null;
  }

  // Optimize Images
  if (recText.includes('optimize') && recText.includes('image')) {
    return {
      task_type: 'optimize_images',
      category: 'performance',
      priority: 'high',
      agent_type: 'ftp_script',
      instructions: {
        action: 'optimize_images',
        target_reduction_pct: 60,
        formats: ['jpg', 'png', 'webp'],
        max_width: 1920,
        quality: 85,
        reasoning: 'Large images slow page load times',
      },
      page_url: pageUrl,
      estimated_time_seconds: 180,
      requires_approval: false,
    };
  }

  // Add Schema Markup
  if (recText.includes('schema') || recText.includes('structured data')) {
    return {
      task_type: 'add_schema_markup',
      category: 'seo',
      priority: 'medium',
      agent_type: 'wp_rest_api',
      instructions: {
        action: 'add_schema',
        schema_type: 'LocalBusiness',
        ai_generate_from_content: true,
        reasoning: 'Schema markup helps search engines understand your content',
      },
      page_url: pageUrl,
      estimated_time_seconds: 120,
      requires_approval: true,
    };
  }

  // Improve Page Speed
  if (recText.includes('page speed') || recText.includes('loading time')) {
    return {
      task_type: 'improve_page_speed',
      category: 'performance',
      priority: 'high',
      agent_type: 'wp_rest_api',
      instructions: {
        action: 'enable_caching',
        enable_lazy_loading: true,
        minify_css: true,
        minify_js: true,
        reasoning: 'Faster pages improve user experience and rankings',
      },
      page_url: pageUrl,
      estimated_time_seconds: 300,
      requires_approval: true,
    };
  }

  // Add Internal Links
  if (recText.includes('internal link')) {
    return {
      task_type: 'add_internal_links',
      category: 'seo',
      priority: 'medium',
      agent_type: 'claude_computer_use',
      instructions: {
        action: 'add_contextual_links',
        min_links: 3,
        max_links: 5,
        ai_analyze_context: true,
        reasoning: 'Internal linking improves navigation and distributes page authority',
      },
      page_url: pageUrl,
      estimated_time_seconds: 240,
      requires_approval: true,
    };
  }

  return null;
}

/**
 * Map performance issues
 */
function mapPerformanceIssues(
  audit: SEOAudit,
  companyId: string
): Omit<AgentTask, 'id' | 'created_at' | 'updated_at'>[] {
  const tasks: Omit<AgentTask, 'id' | 'created_at' | 'updated_at'>[] = [];

  const performanceScore = audit.performance_score || 0;

  if (performanceScore < 50) {
    // Critical performance issues - add multiple tasks
    tasks.push(
      createTaskFromMapping(
        {
          task_type: 'enable_compression',
          category: 'performance',
          priority: 'critical',
          agent_type: 'ftp_script',
          instructions: {
            action: 'enable_gzip_compression',
            reasoning: 'Compression reduces file sizes and improves load times',
          },
          estimated_time_seconds: 60,
          requires_approval: false,
        },
        companyId,
        audit.id
      )
    );
  }

  if (performanceScore < 75) {
    tasks.push(
      createTaskFromMapping(
        {
          task_type: 'lazy_load_images',
          category: 'performance',
          priority: 'high',
          agent_type: 'wp_rest_api',
          instructions: {
            action: 'enable_lazy_loading',
            skip_above_fold: true,
            reasoning: 'Lazy loading defers loading off-screen images',
          },
          estimated_time_seconds: 90,
          requires_approval: false,
        },
        companyId,
        audit.id
      )
    );
  }

  return tasks;
}

/**
 * Map accessibility issues
 */
function mapAccessibilityIssues(
  audit: SEOAudit,
  companyId: string
): Omit<AgentTask, 'id' | 'created_at' | 'updated_at'>[] {
  const tasks: Omit<AgentTask, 'id' | 'created_at' | 'updated_at'>[] = [];

  const a11yScore = audit.accessibility_score || 0;

  if (a11yScore < 70) {
    tasks.push(
      createTaskFromMapping(
        {
          task_type: 'improve_color_contrast',
          category: 'accessibility',
          priority: 'high',
          agent_type: 'wp_rest_api',
          instructions: {
            action: 'check_color_contrast',
            wcag_level: 'AA',
            ai_suggest_fixes: true,
            reasoning: 'Proper color contrast ensures readability for all users',
          },
          estimated_time_seconds: 180,
          requires_approval: true,
        },
        companyId,
        audit.id
      )
    );
  }

  return tasks;
}

/**
 * Map SEO issues
 */
function mapSEOIssues(
  audit: SEOAudit,
  companyId: string
): Omit<AgentTask, 'id' | 'created_at' | 'updated_at'>[] {
  const tasks: Omit<AgentTask, 'id' | 'created_at' | 'updated_at'>[] = [];

  // Add robots.txt if missing
  const extendedData = audit.extended_data as any;
  if (!extendedData?.has_robots_txt) {
    tasks.push(
      createTaskFromMapping(
        {
          task_type: 'create_robots_txt',
          category: 'seo',
          priority: 'medium',
          agent_type: 'ftp_script',
          instructions: {
            action: 'create_file',
            file_path: '/robots.txt',
            content_template: 'default_robots_txt',
            reasoning: 'robots.txt guides search engine crawlers',
          },
          estimated_time_seconds: 30,
          requires_approval: false,
        },
        companyId,
        audit.id
      )
    );
  }

  // Add XML sitemap if missing
  if (!extendedData?.has_xml_sitemap) {
    tasks.push(
      createTaskFromMapping(
        {
          task_type: 'generate_sitemap',
          category: 'seo',
          priority: 'high',
          agent_type: 'wp_rest_api',
          instructions: {
            action: 'generate_sitemap',
            auto_submit_to_search_engines: true,
            reasoning: 'XML sitemap helps search engines discover all pages',
          },
          estimated_time_seconds: 120,
          requires_approval: false,
        },
        companyId,
        audit.id
      )
    );
  }

  return tasks;
}

/**
 * Helper: Create task object from mapping
 */
function createTaskFromMapping(
  mapping: TaskMapping,
  companyId: string,
  auditId: string
): Omit<AgentTask, 'id' | 'created_at' | 'updated_at'> {
  return {
    company_id: companyId,
    audit_id: auditId,
    task_type: mapping.task_type,
    category: mapping.category,
    priority: mapping.priority,
    status: 'pending',
    page_url: mapping.page_url,
    element_selector: mapping.element_selector,
    instructions: mapping.instructions,
    agent_type: mapping.agent_type,
    estimated_time_seconds: mapping.estimated_time_seconds,
    retry_count: 0,
    max_retries: 3,
    agent_execution_logs: [],
    requires_approval: mapping.requires_approval,
    tags: [mapping.category, mapping.priority],
    parent_task_id: undefined,
    scheduled_at: undefined,
    started_at: undefined,
    completed_at: undefined,
    target_files: undefined,
    actual_time_seconds: undefined,
    success: undefined,
    error_message: undefined,
    error_code: undefined,
    before_snapshot: undefined,
    after_snapshot: undefined,
    before_content_hash: undefined,
    after_content_hash: undefined,
    performance_impact: undefined,
    approval_reason: undefined,
    approved_by: undefined,
    approved_at: undefined,
    rejected_by: undefined,
    rejected_at: undefined,
    rejection_reason: undefined,
    rollback_data: undefined,
    rolled_back_at: undefined,
    rolled_back_by: undefined,
    cost_usd: undefined,
  };
}

/**
 * Helper: Generate H1 content from URL
 */
function generateH1FromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.replace(/^\/|\/$/g, '');

    if (!path) {
      return 'Welcome to Our Website';
    }

    // Convert /water-damage-restoration → "Water Damage Restoration"
    return path
      .split('/')
      .pop()!
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return 'Welcome to Our Website';
  }
}

/**
 * Helper: Generate meta description from URL
 */
function generateMetaDescription(url: string): string {
  const h1 = generateH1FromUrl(url);
  return `Learn more about ${h1.toLowerCase()}. Expert services and solutions for your needs.`;
}

/**
 * Helper: Extract number from string (e.g., "Title is 25 characters" → 25)
 */
function extractNumber(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Helper: Extract URL from string
 */
function extractUrl(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : null;
}
