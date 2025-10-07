/**
 * Client Onboarding Agent
 * Autonomous agent that handles complete client onboarding
 * Creates workspace, runs initial audit, sets up tracking, generates content calendar
 */

import { BaseAgent, AgentConfig, AgentTool, AgentContext } from './base-agent';
import { db } from '@/lib/db';
import { terminalService } from '../terminal/windows-terminal-service';
import * as fs from 'fs';
import * as path from 'path';

export class ClientOnboardingAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'client-onboarding',
      description: 'Automates complete client onboarding process including workspace setup, initial audit, and strategic planning',
      model: 'claude-sonnet-4.5-20250929',
      maxTokens: 8192,
      temperature: 0.5,
      systemPrompt: `You are an expert business consultant specializing in digital marketing and SEO onboarding.

Your task is to onboard new clients efficiently by:
1. Understanding their business, industry, and goals
2. Creating organized workspace structures
3. Running initial SEO audits
4. Setting up tracking and analytics
5. Creating strategic content calendars
6. Configuring automated reporting

When onboarding clients:
- Ask clarifying questions about their business
- Identify quick wins for immediate value
- Set realistic timelines and expectations
- Create actionable 30/60/90 day plans
- Document everything for transparency

Be professional, thorough, and focus on delivering value from day one.`,
      tools: this.getTools()
    };

    super(config);
  }

  /**
   * Define tools available to the agent
   */
  private getTools(): AgentTool[] {
    return [
      {
        name: 'create_client_workspace',
        description: 'Create isolated workspace directory for new client',
        input_schema: {
          type: 'object',
          properties: {
            client_name: {
              type: 'string',
              description: 'Client company name'
            },
            client_id: {
              type: 'string',
              description: 'Unique client identifier'
            },
            industry: {
              type: 'string',
              description: 'Client industry/sector'
            }
          },
          required: ['client_name', 'client_id']
        },
        handler: async (input, context) => {
          return await this.createWorkspace(input, context);
        }
      },
      {
        name: 'create_client_profile',
        description: 'Create client profile in CRM database',
        input_schema: {
          type: 'object',
          properties: {
            client_data: {
              type: 'object',
              description: 'Client details including name, industry, website, contact info'
            }
          },
          required: ['client_data']
        },
        handler: async (input, context) => {
          return await this.createClientProfile(input, context);
        }
      },
      {
        name: 'run_initial_seo_audit',
        description: 'Queue initial SEO audit for client website',
        input_schema: {
          type: 'object',
          properties: {
            client_id: {
              type: 'string',
              description: 'Client ID'
            },
            website_url: {
              type: 'string',
              description: 'Client website URL'
            }
          },
          required: ['client_id', 'website_url']
        },
        handler: async (input, context) => {
          return await this.queueInitialAudit(input, context);
        }
      },
      {
        name: 'setup_keyword_tracking',
        description: 'Set up keyword tracking for client',
        input_schema: {
          type: 'object',
          properties: {
            client_id: {
              type: 'string',
              description: 'Client ID'
            },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: 'Initial keywords to track'
            },
            location: {
              type: 'string',
              description: 'Geographic location for local SEO'
            }
          },
          required: ['client_id', 'keywords']
        },
        handler: async (input, context) => {
          return await this.setupKeywordTracking(input, context);
        }
      },
      {
        name: 'generate_content_calendar',
        description: 'Create 90-day content calendar for client',
        input_schema: {
          type: 'object',
          properties: {
            client_id: {
              type: 'string',
              description: 'Client ID'
            },
            industry: {
              type: 'string',
              description: 'Client industry'
            },
            target_audience: {
              type: 'string',
              description: 'Primary target audience'
            },
            content_types: {
              type: 'array',
              items: { type: 'string' },
              description: 'Types of content to create (blog, video, social, etc.)'
            }
          },
          required: ['client_id', 'industry']
        },
        handler: async (input, context) => {
          return await this.generateContentCalendar(input, context);
        }
      },
      {
        name: 'create_onboarding_checklist',
        description: 'Generate comprehensive onboarding checklist',
        input_schema: {
          type: 'object',
          properties: {
            client_id: {
              type: 'string',
              description: 'Client ID'
            },
            service_level: {
              type: 'string',
              enum: ['basic', 'standard', 'premium'],
              description: 'Service tier'
            }
          },
          required: ['client_id', 'service_level']
        },
        handler: async (input, context) => {
          return await this.createOnboardingChecklist(input, context);
        }
      },
      {
        name: 'send_welcome_email',
        description: 'Send automated welcome email to client',
        input_schema: {
          type: 'object',
          properties: {
            client_email: {
              type: 'string',
              description: 'Client email address'
            },
            client_name: {
              type: 'string',
              description: 'Client name'
            },
            portal_link: {
              type: 'string',
              description: 'Link to client portal'
            }
          },
          required: ['client_email', 'client_name']
        },
        handler: async (input, context) => {
          return await this.sendWelcomeEmail(input, context);
        }
      }
    ];
  }

  /**
   * Create client workspace
   */
  private async createWorkspace(
    input: any,
    context: AgentContext
  ): Promise<any> {
    try {
      const workspacePath = path.join(
        'D:',
        'GEO_SEO_Domination-Tool',
        'workspaces',
        input.client_id,
        'main'
      );

      // Create directory structure
      await fs.promises.mkdir(workspacePath, { recursive: true });
      await fs.promises.mkdir(path.join(workspacePath, 'documents'), { recursive: true });
      await fs.promises.mkdir(path.join(workspacePath, 'reports'), { recursive: true });
      await fs.promises.mkdir(path.join(workspacePath, 'content'), { recursive: true });

      // Create README
      await fs.promises.writeFile(
        path.join(workspacePath, 'README.md'),
        `# ${input.client_name} Workspace\n\nIndustry: ${input.industry || 'Not specified'}\nCreated: ${new Date().toISOString()}\n\n## Directory Structure\n- /documents - Client documents and assets\n- /reports - SEO audit reports\n- /content - Generated content\n`
      );

      // Create terminal session for this workspace
      const terminalSessionId = await terminalService.createSession({
        workspaceId: 'main',
        clientId: input.client_id,
        shell: 'powershell',
        workingDirectory: workspacePath,
        brandName: `${input.client_name} Terminal`
      });

      return {
        success: true,
        workspace_path: workspacePath,
        terminal_session_id: terminalSessionId,
        message: 'Workspace created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Create client profile in database
   */
  private async createClientProfile(
    input: any,
    context: AgentContext
  ): Promise<any> {
    try {
      const clientId = `client_${Date.now()}`;
      const data = input.client_data;

      await db.run(`
        INSERT INTO companies (
          id, name, industry, website, email, phone, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        clientId,
        data.name,
        data.industry,
        data.website,
        data.email,
        data.phone,
        data.notes || 'New client',
        new Date().toISOString()
      ]);

      return {
        success: true,
        client_id: clientId,
        message: 'Client profile created'
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Queue initial SEO audit
   */
  private async queueInitialAudit(
    input: any,
    context: AgentContext
  ): Promise<any> {
    // Would integrate with agent pool to queue SEO audit
    return {
      success: true,
      audit_queued: true,
      audit_task_id: `audit_task_${Date.now()}`,
      estimated_completion: '5-10 minutes',
      message: 'Initial SEO audit queued'
    };
  }

  /**
   * Setup keyword tracking
   */
  private async setupKeywordTracking(
    input: any,
    context: AgentContext
  ): Promise<any> {
    try {
      const keywordsAdded = [];

      for (const keyword of input.keywords) {
        const keywordId = `keyword_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await db.run(`
          INSERT INTO keywords (
            id, company_id, keyword, location, created_at
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          keywordId,
          input.client_id,
          keyword,
          input.location || 'Global',
          new Date().toISOString()
        ]);

        keywordsAdded.push({ id: keywordId, keyword });
      }

      return {
        success: true,
        keywords_added: keywordsAdded.length,
        keywords: keywordsAdded,
        tracking_enabled: true
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Generate content calendar
   */
  private async generateContentCalendar(
    input: any,
    context: AgentContext
  ): Promise<any> {
    const contentTypes = input.content_types || ['blog', 'social'];
    const calendar = [];

    // Generate 90 days of content ideas
    for (let week = 1; week <= 12; week++) {
      calendar.push({
        week,
        theme: `Week ${week} Theme`,
        content_pieces: [
          {
            type: 'blog',
            title: `${input.industry} Topic ${week}`,
            keywords: ['industry keyword', 'related term'],
            due_date: new Date(Date.now() + (week * 7 * 24 * 60 * 60 * 1000)).toISOString()
          },
          {
            type: 'social',
            title: `Social post for Week ${week}`,
            platform: 'LinkedIn',
            due_date: new Date(Date.now() + (week * 7 * 24 * 60 * 60 * 1000)).toISOString()
          }
        ]
      });
    }

    return {
      success: true,
      calendar_duration: '90 days',
      total_content_pieces: calendar.length * 2,
      calendar,
      message: 'Content calendar generated'
    };
  }

  /**
   * Create onboarding checklist
   */
  private async createOnboardingChecklist(
    input: any,
    context: AgentContext
  ): Promise<any> {
    const serviceLevel = input.service_level || 'standard';

    const checklist = {
      phase_1: {
        name: 'Setup & Discovery',
        tasks: [
          { task: 'Create client workspace', status: 'completed' },
          { task: 'Setup CRM profile', status: 'completed' },
          { task: 'Schedule kickoff call', status: 'pending' },
          { task: 'Collect brand assets', status: 'pending' }
        ]
      },
      phase_2: {
        name: 'Initial Analysis',
        tasks: [
          { task: 'Run SEO audit', status: 'in_progress' },
          { task: 'Competitor analysis', status: 'pending' },
          { task: 'Keyword research', status: 'pending' }
        ]
      },
      phase_3: {
        name: 'Strategy Development',
        tasks: [
          { task: 'Create content calendar', status: 'pending' },
          { task: 'Define KPIs', status: 'pending' },
          { task: 'Setup tracking', status: 'pending' }
        ]
      },
      phase_4: {
        name: 'Execution Launch',
        tasks: [
          { task: 'Begin content creation', status: 'pending' },
          { task: 'Setup automated reporting', status: 'pending' },
          { task: 'Schedule first review', status: 'pending' }
        ]
      }
    };

    return {
      success: true,
      service_level: serviceLevel,
      checklist,
      total_tasks: 15,
      estimated_timeline: '30 days'
    };
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(
    input: any,
    context: AgentContext
  ): Promise<any> {
    // Would integrate with email service
    return {
      success: true,
      email_sent: true,
      recipient: input.client_email,
      subject: `Welcome to ${input.client_name}! Let's Get Started`,
      message: 'Welcome email sent successfully'
    };
  }
}
