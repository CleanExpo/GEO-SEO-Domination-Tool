/**
 * Client Autopilot Agent
 * Master orchestrator that converts monthly client spend into autonomous task schedules
 *
 * Vision: Client pays → Tasks auto-scheduled → Agents execute → Results delivered
 */

import { DatabaseClient } from '@/database/init';

export interface SubscriptionTier {
  name: string;
  monthlyPrice: number;
  quotas: {
    seoAudits: number;
    blogPosts: number;
    socialPosts: number;
    researchPapers: number;
    gmbPosts: number;
    whitePapers: number;
  };
  features: {
    competitorMonitoring: 'daily' | '3x_week' | 'weekly' | 'monthly';
    autoPublish: boolean;
    rulerThreshold: number;
    maxConcurrentTasks: number;
  };
}

export interface ClientSubscription {
  id: number;
  companyId: number;
  tierName: string;
  monthlySpend: number;
  status: 'active' | 'paused' | 'cancelled';
  autopilotStatus: 'active' | 'paused';
  quotas: {
    seoAudits: number;
    blogPosts: number;
    socialPosts: number;
    researchPapers: number;
    gmbPosts: number;
  };
  used: {
    seoAudits: number;
    blogPosts: number;
    socialPosts: number;
    researchPapers: number;
    gmbPosts: number;
  };
  preferences: {
    contentTopics?: string[];
    targetKeywords?: string[];
    competitorUrls?: string[];
    excludeDays?: string[];
    notificationEmail?: string;
  };
}

export interface TaskScheduleEntry {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  taskType: 'seo_audit' | 'blog_post' | 'social_post' | 'research_paper' | 'gmb_post' | 'white_paper';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  config: Record<string, any>;
}

export interface MonthlyAllocation {
  month: string; // YYYY-MM-01
  tasks: TaskScheduleEntry[];
  quotas: Record<string, number>;
  distribution: {
    weekdays: number[];
    preferredTimes: string[];
  };
}

/**
 * ClientAutopilotAgent - Master Orchestrator
 */
export class ClientAutopilotAgent {
  private db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }

  /**
   * Initialize new subscription and generate first month's schedule
   */
  async initializeSubscription(
    companyId: number,
    tierName: string,
    preferences?: Partial<ClientSubscription['preferences']>
  ): Promise<{ subscriptionId: number; tasksScheduled: number }> {
    console.log(`[ClientAutopilotAgent] Initializing subscription for company ${companyId}, tier: ${tierName}`);

    // Get tier configuration
    const tier = await this.getTierConfig(tierName);
    if (!tier) {
      throw new Error(`Subscription tier '${tierName}' not found`);
    }

    // Create subscription record
    const subscription = await this.createSubscription(companyId, tier, preferences);

    // Generate first month's task schedule
    const schedule = await this.generateMonthlySchedule(subscription);

    // Save schedule to calendar
    const tasksScheduled = await this.saveScheduleToCalendar(subscription.id, schedule);

    // Log event
    await this.logSubscriptionEvent(subscription.id, companyId, 'activated', {
      tier: tierName,
      tasksScheduled,
      scheduleGenerated: true
    });

    console.log(`[ClientAutopilotAgent] ✅ Subscription initialized: ${subscription.id}, ${tasksScheduled} tasks scheduled`);

    return {
      subscriptionId: subscription.id,
      tasksScheduled
    };
  }

  /**
   * Generate 30-day task schedule based on subscription quotas
   */
  async generateMonthlySchedule(subscription: ClientSubscription): Promise<MonthlyAllocation> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const tasks: TaskScheduleEntry[] = [];

    // Distribution strategy: Spread tasks evenly across 30 days
    // Avoid weekends for most tasks, prefer business hours

    const { quotas, preferences } = subscription;
    const excludeDays = new Set(preferences.excludeDays || []);

    // Helper: Get available weekdays in month
    const getAvailableWeekdays = (): Date[] => {
      const weekdays: Date[] = [];
      const current = new Date(firstDayOfMonth);

      while (current <= lastDayOfMonth) {
        const dayOfWeek = current.getDay();
        const dateStr = current.toISOString().split('T')[0];

        // Skip weekends and excluded days
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !excludeDays.has(dateStr)) {
          weekdays.push(new Date(current));
        }

        current.setDate(current.getDate() + 1);
      }

      return weekdays;
    };

    const availableDays = getAvailableWeekdays();
    if (availableDays.length === 0) {
      throw new Error('No available days for scheduling tasks');
    }

    // 1. Schedule SEO Audits (spread across month, priority on days 1, 8, 15, 22)
    for (let i = 0; i < quotas.seoAudits; i++) {
      const dayIndex = Math.floor((i / quotas.seoAudits) * availableDays.length);
      const date = availableDays[dayIndex];

      tasks.push({
        date: date.toISOString().split('T')[0],
        time: '09:00:00',
        taskType: 'seo_audit',
        priority: 'high',
        config: {
          auditType: i === 0 ? 'full_site' : 'targeted',
          notifyOnCompletion: true
        }
      });
    }

    // 2. Schedule Blog Posts (2-4 per week, spread evenly)
    const blogPostsPerWeek = Math.ceil(quotas.blogPosts / 4);
    for (let i = 0; i < quotas.blogPosts; i++) {
      const weekOffset = Math.floor(i / blogPostsPerWeek);
      const dayOffset = (i % blogPostsPerWeek) * Math.floor(7 / blogPostsPerWeek);
      const dayIndex = Math.min(weekOffset * 5 + dayOffset, availableDays.length - 1);
      const date = availableDays[dayIndex];

      // Select keyword/topic from preferences or use generic
      const keywords = preferences.targetKeywords || [];
      const keyword = keywords[i % keywords.length] || 'industry topic';

      tasks.push({
        date: date.toISOString().split('T')[0],
        time: '10:00:00',
        taskType: 'blog_post',
        priority: 'medium',
        config: {
          keyword,
          wordCount: 2000,
          researchRequired: true,
          publishTo: ['website', 'linkedin']
        }
      });
    }

    // 3. Schedule Social Posts (spread throughout month, ~2-5 per day)
    const socialPostsPerDay = Math.ceil(quotas.socialPosts / availableDays.length);
    let socialPostCount = 0;

    for (const day of availableDays) {
      const postsToday = Math.min(socialPostsPerDay, quotas.socialPosts - socialPostCount);

      for (let i = 0; i < postsToday; i++) {
        const hour = 9 + i * 3; // 9am, 12pm, 3pm, etc.
        tasks.push({
          date: day.toISOString().split('T')[0],
          time: `${hour.toString().padStart(2, '0')}:00:00`,
          taskType: 'social_post',
          priority: 'low',
          config: {
            platforms: ['linkedin', 'facebook', 'instagram'],
            contentType: i % 3 === 0 ? 'tip' : i % 3 === 1 ? 'showcase' : 'engagement',
            includeImage: true
          }
        });
        socialPostCount++;
      }

      if (socialPostCount >= quotas.socialPosts) break;
    }

    // 4. Schedule Research Papers (beginning/middle/end of month)
    for (let i = 0; i < quotas.researchPapers; i++) {
      const dayIndex = Math.floor((i / Math.max(quotas.researchPapers, 1)) * availableDays.length);
      const date = availableDays[Math.min(dayIndex, availableDays.length - 1)];

      tasks.push({
        date: date.toISOString().split('T')[0],
        time: '08:00:00', // Early start for long-running tasks
        taskType: 'research_paper',
        priority: 'high',
        config: {
          topic: preferences.contentTopics?.[i % (preferences.contentTopics?.length || 1)] || 'industry research',
          minSources: 10,
          technicalDepth: 4,
          citationStyle: 'APA'
        }
      });
    }

    // 5. Schedule GMB Posts (spread evenly, 2-8 per week)
    const gmbPostsPerWeek = Math.ceil(quotas.gmbPosts / 4);
    for (let i = 0; i < quotas.gmbPosts; i++) {
      const weekOffset = Math.floor(i / gmbPostsPerWeek);
      const dayOffset = (i % gmbPostsPerWeek) * Math.floor(7 / gmbPostsPerWeek);
      const dayIndex = Math.min(weekOffset * 5 + dayOffset, availableDays.length - 1);
      const date = availableDays[dayIndex];

      tasks.push({
        date: date.toISOString().split('T')[0],
        time: '11:00:00',
        taskType: 'gmb_post',
        priority: 'medium',
        config: {
          postType: i % 4 === 0 ? 'offer' : i % 4 === 1 ? 'update' : i % 4 === 2 ? 'event' : 'product',
          includeImage: true,
          callToAction: true
        }
      });
    }

    // Sort tasks by date and time
    tasks.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return {
      month: firstDayOfMonth.toISOString().split('T')[0],
      tasks,
      quotas: {
        seo_audits: quotas.seoAudits,
        blog_posts: quotas.blogPosts,
        social_posts: quotas.socialPosts,
        research_papers: quotas.researchPapers,
        gmb_posts: quotas.gmbPosts
      },
      distribution: {
        weekdays: availableDays.map(d => d.getDate()),
        preferredTimes: ['09:00', '10:00', '11:00', '14:00', '15:00']
      }
    };
  }

  /**
   * Save generated schedule to task_execution_calendar table
   */
  private async saveScheduleToCalendar(subscriptionId: number, schedule: MonthlyAllocation): Promise<number> {
    let savedCount = 0;

    for (const task of schedule.tasks) {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) continue;

      await this.db.run(
        `INSERT INTO task_execution_calendar
        (subscription_id, company_id, scheduled_date, scheduled_time, task_type, task_category, priority, task_config, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          subscriptionId,
          subscription.companyId,
          task.date,
          task.time,
          task.taskType,
          this.getTaskCategory(task.taskType),
          task.priority,
          JSON.stringify(task.config),
          'scheduled'
        ]
      );

      savedCount++;
    }

    // Create allocation history record
    await this.db.run(
      `INSERT INTO task_allocation_history
      (subscription_id, company_id, allocation_month,
       seo_audits_allocated, blog_posts_allocated, social_posts_allocated, research_papers_allocated, gmb_posts_allocated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subscriptionId,
        subscription.companyId,
        schedule.month,
        schedule.quotas.seo_audits,
        schedule.quotas.blog_posts,
        schedule.quotas.social_posts,
        schedule.quotas.research_papers,
        schedule.quotas.gmb_posts
      ]
    );

    return savedCount;
  }

  /**
   * Get tier configuration from database
   */
  private async getTierConfig(tierName: string): Promise<SubscriptionTier | null> {
    const result = await this.db.get<any>(
      `SELECT * FROM subscription_tiers WHERE name = ? AND is_active = 1`,
      [tierName.toLowerCase()]
    );

    if (!result) return null;

    return {
      name: result.name,
      monthlyPrice: parseFloat(result.monthly_price_usd),
      quotas: {
        seoAudits: result.seo_audits_per_month,
        blogPosts: result.blog_posts_per_month,
        socialPosts: result.social_posts_per_month,
        researchPapers: result.research_papers_per_month,
        gmbPosts: result.gmb_posts_per_month,
        whitePapers: result.white_papers_per_month
      },
      features: {
        competitorMonitoring: result.competitor_monitoring_frequency,
        autoPublish: result.auto_publish_enabled === 1,
        rulerThreshold: result.ruler_quality_threshold,
        maxConcurrentTasks: result.max_concurrent_tasks
      }
    };
  }

  /**
   * Create subscription record
   */
  private async createSubscription(
    companyId: number,
    tier: SubscriptionTier,
    preferences?: Partial<ClientSubscription['preferences']>
  ): Promise<ClientSubscription> {
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const result = await this.db.run(
      `INSERT INTO client_subscriptions
      (company_id, tier_id, tier_name, monthly_spend_usd, status, autopilot_status,
       seo_audits_quota, blog_posts_quota, social_posts_quota, research_papers_quota, gmb_posts_quota,
       preferred_content_topics, target_keywords, competitor_urls, notification_email,
       next_billing_date, activated_at)
      SELECT ?, id, ?, ?, 'active', 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      FROM subscription_tiers WHERE name = ?`,
      [
        companyId,
        tier.name,
        tier.monthlyPrice,
        tier.quotas.seoAudits,
        tier.quotas.blogPosts,
        tier.quotas.socialPosts,
        tier.quotas.researchPapers,
        tier.quotas.gmbPosts,
        JSON.stringify(preferences?.contentTopics || []),
        JSON.stringify(preferences?.targetKeywords || []),
        JSON.stringify(preferences?.competitorUrls || []),
        preferences?.notificationEmail || null,
        nextBillingDate.toISOString().split('T')[0],
        new Date().toISOString(),
        tier.name
      ]
    );

    const subscription = await this.getSubscription(result.lastID!);
    if (!subscription) {
      throw new Error('Failed to retrieve created subscription');
    }

    return subscription;
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: number): Promise<ClientSubscription | null> {
    const result = await this.db.get<any>(
      `SELECT * FROM client_subscriptions WHERE id = ?`,
      [subscriptionId]
    );

    if (!result) return null;

    return {
      id: result.id,
      companyId: result.company_id,
      tierName: result.tier_name,
      monthlySpend: parseFloat(result.monthly_spend_usd),
      status: result.status,
      autopilotStatus: result.autopilot_status,
      quotas: {
        seoAudits: result.seo_audits_quota,
        blogPosts: result.blog_posts_quota,
        socialPosts: result.social_posts_quota,
        researchPapers: result.research_papers_quota,
        gmbPosts: result.gmb_posts_quota
      },
      used: {
        seoAudits: result.seo_audits_used,
        blogPosts: result.blog_posts_used,
        socialPosts: result.social_posts_used,
        researchPapers: result.research_papers_used,
        gmbPosts: result.gmb_posts_used
      },
      preferences: {
        contentTopics: JSON.parse(result.preferred_content_topics || '[]'),
        targetKeywords: JSON.parse(result.target_keywords || '[]'),
        competitorUrls: JSON.parse(result.competitor_urls || '[]'),
        excludeDays: JSON.parse(result.exclude_days || '[]'),
        notificationEmail: result.notification_email
      }
    };
  }

  /**
   * Get task category from type
   */
  private getTaskCategory(taskType: string): string {
    const categoryMap: Record<string, string> = {
      'seo_audit': 'seo',
      'blog_post': 'content',
      'social_post': 'social',
      'research_paper': 'research',
      'gmb_post': 'local',
      'white_paper': 'content'
    };

    return categoryMap[taskType] || 'general';
  }

  /**
   * Log subscription event
   */
  private async logSubscriptionEvent(
    subscriptionId: number,
    companyId: number,
    eventType: string,
    eventData?: Record<string, any>
  ): Promise<void> {
    await this.db.run(
      `INSERT INTO subscription_events (subscription_id, company_id, event_type, event_data, triggered_by)
       VALUES (?, ?, ?, ?, ?)`,
      [subscriptionId, companyId, eventType, JSON.stringify(eventData || {}), 'system']
    );
  }

  /**
   * Get pending tasks (scheduled for next 24 hours)
   */
  async getPendingTasks(): Promise<any[]> {
    const results = await this.db.all<any>(
      `SELECT * FROM task_execution_calendar
       WHERE status = 'scheduled'
       AND scheduled_date <= date('now', '+1 day')
       ORDER BY scheduled_date, scheduled_time`
    );

    return results;
  }

  /**
   * Pause autopilot for a subscription
   */
  async pauseAutopilot(subscriptionId: number): Promise<void> {
    await this.db.run(
      `UPDATE client_subscriptions SET autopilot_status = 'paused', paused_at = ?, updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), new Date().toISOString(), subscriptionId]
    );

    const subscription = await this.getSubscription(subscriptionId);
    if (subscription) {
      await this.logSubscriptionEvent(subscriptionId, subscription.companyId, 'autopilot_paused', {
        pausedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Resume autopilot for a subscription
   */
  async resumeAutopilot(subscriptionId: number): Promise<void> {
    await this.db.run(
      `UPDATE client_subscriptions SET autopilot_status = 'active', updated_at = ? WHERE id = ?`,
      [new Date().toISOString(), subscriptionId]
    );

    const subscription = await this.getSubscription(subscriptionId);
    if (subscription) {
      await this.logSubscriptionEvent(subscriptionId, subscription.companyId, 'autopilot_resumed', {
        resumedAt: new Date().toISOString()
      });
    }
  }
}

/**
 * Export singleton instance
 */
let autopilotAgent: ClientAutopilotAgent | null = null;

export async function getClientAutopilotAgent(): Promise<ClientAutopilotAgent> {
  if (!autopilotAgent) {
    const { db } = await import('@/database/init');
    autopilotAgent = new ClientAutopilotAgent(db);
  }
  return autopilotAgent;
}
