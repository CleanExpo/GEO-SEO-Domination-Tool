/**
 * Tactical Agentic Coding API
 * Natural language interface to Plan-Build-Ship methodology
 *
 * POST plain English → Get world-class engineered solution
 */

import { NextRequest } from 'next/server';
import { orchestrationAgent } from '@/services/tactical-agents/orchestration-agent';

/**
 * POST: Describe what you want in plain English
 *
 * Example:
 * {
 *   "description": "I need a ranking tracker that checks 50 keywords daily,
 *                   stores history in database, sends alerts on big changes,
 *                   and shows trend charts"
 * }
 *
 * Response: Fully planned, architected, implemented, tested system
 */
export async function POST(request: NextRequest) {
  try {
    const { description, workspace_id = 'default', client_id = 'owner' } = await request.json();

    if (!description) {
      return Response.json({
        error: 'Missing description',
        usage: 'Describe what you want to build in plain English',
        example: {
          description: 'Build a content calendar that generates 30 days of social posts'
        }
      }, { status: 400 });
    }

    console.log('\n🎯 TACTICAL AGENTIC CODING INITIATED');
    console.log(`📝 User Request: ${description}\n`);

    // Orchestrate the Plan-Build-Ship process
    const project = await orchestrationAgent.orchestrateTacticalProject(
      description,
      {
        workspaceId: workspace_id,
        clientId: client_id,
        metadata: {
          source: 'api',
          timestamp: new Date().toISOString()
        }
      }
    );

    return Response.json({
      success: true,
      message: 'Tactical project completed successfully',
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        phases: {
          plan: project.phases.plan,
          architecture: project.phases.architecture,
          implementation: project.phases.implementation,
          testing: project.phases.testing
        },
        artifacts: project.artifacts.map(a => ({
          type: a.type,
          name: a.name,
          created_by: a.created_by,
          timestamp: a.timestamp
        })),
        duration: project.completedAt ?
          (project.completedAt.getTime() - project.createdAt.getTime()) / 1000 : null,
        summary: {
          files_created: project.phases.implementation?.files_created.length || 0,
          tests_passed: project.phases.testing?.tests_passed || 0,
          code_quality: project.phases.implementation?.code_quality_score || 0
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Tactical project failed:', error);
    return Response.json({
      error: 'Tactical project execution failed',
      message: (error as Error).message
    }, { status: 500 });
  }
}

/**
 * GET: List tactical projects
 */
export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database
    return Response.json({
      success: true,
      projects: [],
      message: 'List of tactical projects'
    });

  } catch (error) {
    return Response.json({
      error: 'Failed to list projects',
      message: (error as Error).message
    }, { status: 500 });
  }
}
