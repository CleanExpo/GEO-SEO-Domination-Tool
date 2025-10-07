/**
 * Agent Management API
 * Endpoints for managing autonomous agents and tasks
 */

import { NextRequest } from 'next/server';
import { agentPool } from '@/services/agents/agent-pool';
import { SEOAuditAgent } from '@/services/agents/seo-audit-agent';
import { ContentGenerationAgent } from '@/services/agents/content-generation-agent';
import { ClientOnboardingAgent } from '@/services/agents/client-onboarding-agent';

// Register agents on module load
const seoAgent = new SEOAuditAgent();
const contentAgent = new ContentGenerationAgent();
const onboardingAgent = new ClientOnboardingAgent();

agentPool.registerAgent(seoAgent);
agentPool.registerAgent(contentAgent);
agentPool.registerAgent(onboardingAgent);

/**
 * GET: List all registered agents and pool stats
 */
export async function GET(request: NextRequest) {
  try {
    const stats = agentPool.getStats();

    const agents = [
      {
        name: 'seo-audit',
        description: 'Performs comprehensive SEO audits',
        status: seoAgent.getStatus(),
        capabilities: [
          'Lighthouse audits',
          'E-E-A-T scoring',
          'Ranking checks',
          'Competitor analysis'
        ]
      },
      {
        name: 'content-generation',
        description: 'Creates SEO-optimized content',
        status: contentAgent.getStatus(),
        capabilities: [
          'Article generation',
          'Meta tag creation',
          'Content outlines',
          'Competitor content analysis'
        ]
      },
      {
        name: 'client-onboarding',
        description: 'Automates client onboarding process',
        status: onboardingAgent.getStatus(),
        capabilities: [
          'Workspace creation',
          'Initial audit',
          'Content calendar',
          'Tracking setup'
        ]
      }
    ];

    return Response.json({
      success: true,
      agents,
      pool_stats: stats
    });

  } catch (error) {
    console.error('Failed to list agents:', error);
    return Response.json({
      error: 'Failed to list agents',
      message: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * POST: Queue a new agent task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agent_name,
      input,
      workspace_id = 'default',
      client_id = 'owner',
      priority = 'medium',
      metadata = {}
    } = body;

    if (!agent_name || !input) {
      return Response.json({
        error: 'Missing required fields',
        required: ['agent_name', 'input']
      }, { status: 400 });
    }

    // Validate agent exists
    const validAgents = ['seo-audit', 'content-generation', 'client-onboarding'];
    if (!validAgents.includes(agent_name)) {
      return Response.json({
        error: 'Invalid agent name',
        available_agents: validAgents
      }, { status: 400 });
    }

    // Queue task
    const taskId = await agentPool.queueTask(
      agent_name,
      input,
      {
        workspaceId: workspace_id,
        clientId: client_id,
        metadata
      },
      priority
    );

    return Response.json({
      success: true,
      task_id: taskId,
      message: 'Task queued successfully',
      agent: agent_name,
      status: 'queued'
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to queue task:', error);
    return Response.json({
      error: 'Failed to queue task',
      message: (error as Error).message
    }, { status: 500 });
  }
}
