/**
 * Agent Swarm Orchestrator
 * Coordinates multiple AI agents working together to complete complex tasks
 */

import {
  AgentConfig,
  AgentTask,
  AgentResult,
  SwarmWorkflow,
  SwarmStrategy,
  SwarmExecutionPlan,
  SwarmExecutionResult,
  AgentHandoff
} from './types';

class AgentOrchestrator {
  private agents: Map<string, AgentConfig> = new Map();
  private workflows: Map<string, SwarmWorkflow> = new Map();
  private activeTasks: Map<string, AgentTask> = new Map();

  /**
   * Register an agent with the orchestrator
   */
  registerAgent(agent: AgentConfig): void {
    this.agents.set(agent.id, agent);
    console.log(`[Orchestrator] Registered agent: ${agent.name} (${agent.role})`);
  }

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: SwarmWorkflow): void {
    this.workflows.set(workflow.id, workflow);
    console.log(`[Orchestrator] Registered workflow: ${workflow.name} (${workflow.strategy})`);
  }

  /**
   * Create an execution plan for a workflow
   */
  createExecutionPlan(workflowId: string, task: AgentTask): SwarmExecutionPlan {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionOrder: string[][] = [];

    switch (workflow.strategy) {
      case 'sequential':
        // Execute agents one at a time in order
        workflow.nodes.forEach((node) => {
          executionOrder.push([node.agentId]);
        });
        break;

      case 'concurrent':
        // Execute all agents in parallel
        executionOrder.push(workflow.nodes.map((n) => n.agentId));
        break;

      case 'hierarchical':
        // First batch: entry point (director)
        executionOrder.push([workflow.entryPoint]);
        // Second batch: all workers in parallel
        const workers = workflow.nodes
          .filter((n) => n.agentId !== workflow.entryPoint)
          .map((n) => n.agentId);
        if (workers.length > 0) {
          executionOrder.push(workers);
        }
        break;

      case 'graph':
        // Topological sort based on dependencies
        executionOrder.push(...this.topologicalSort(workflow.nodes));
        break;
    }

    return {
      workflow,
      task,
      executionOrder
    };
  }

  /**
   * Topological sort for graph-based workflows
   */
  private topologicalSort(nodes: any[]): string[][] {
    const batches: string[][] = [];
    const completed = new Set<string>();
    const nodeMap = new Map(nodes.map((n) => [n.agentId, n]));

    while (completed.size < nodes.length) {
      const batch: string[] = [];

      // Find nodes with all dependencies completed
      for (const node of nodes) {
        if (completed.has(node.agentId)) continue;

        const deps = node.dependencies || [];
        const allDepsCompleted = deps.every((dep: string) => completed.has(dep));

        if (allDepsCompleted) {
          batch.push(node.agentId);
        }
      }

      if (batch.length === 0) {
        throw new Error('Circular dependency detected in workflow');
      }

      batches.push(batch);
      batch.forEach((id) => completed.add(id));
    }

    return batches;
  }

  /**
   * Execute a workflow with a task
   */
  async executeWorkflow(
    workflowId: string,
    task: AgentTask,
    onProgress?: (agentId: string, result: AgentResult) => void
  ): Promise<SwarmExecutionResult> {
    const startTime = Date.now();
    const plan = this.createExecutionPlan(workflowId, task);
    const agentResults = new Map<string, AgentResult>();

    console.log(`[Orchestrator] Executing workflow: ${plan.workflow.name}`);
    console.log(`[Orchestrator] Execution plan: ${plan.executionOrder.length} batches`);

    try {
      // Execute each batch
      for (let i = 0; i < plan.executionOrder.length; i++) {
        const batch = plan.executionOrder[i];
        console.log(`[Orchestrator] Executing batch ${i + 1}/${plan.executionOrder.length}: [${batch.join(', ')}]`);

        // Execute agents in parallel within batch
        const batchResults = await Promise.all(
          batch.map(async (agentId) => {
            const agent = this.agents.get(agentId);
            if (!agent) {
              throw new Error(`Agent ${agentId} not found`);
            }

            // Execute agent
            const result = await this.executeAgent(agent, task);

            // Store result
            agentResults.set(agentId, result);

            // Notify progress
            if (onProgress) {
              onProgress(agentId, result);
            }

            // Handle handoff
            if (result.handoff) {
              console.log(`[Orchestrator] Agent ${agentId} handed off to ${result.handoff.toAgent}`);
              // Note: Handoffs would require dynamic workflow modification
            }

            return { agentId, result };
          })
        );

        // Check for failures
        const failures = batchResults.filter((r) => !r.result.success);
        if (failures.length > 0) {
          throw new Error(
            `Batch ${i + 1} failed: ${failures.map((f) => `${f.agentId}: ${f.result.error}`).join(', ')}`
          );
        }
      }

      const executionTime = Date.now() - startTime;

      console.log(`[Orchestrator] Workflow completed in ${executionTime}ms`);

      return {
        workflowId,
        taskId: task.id,
        success: true,
        agentResults,
        executionTime
      };
    } catch (error: any) {
      console.error(`[Orchestrator] Workflow failed:`, error.message);

      return {
        workflowId,
        taskId: task.id,
        success: false,
        agentResults,
        executionTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Execute a single agent using cascading AI
   */
  private async executeAgent(agent: AgentConfig, task: AgentTask): Promise<AgentResult> {
    console.log(`[Orchestrator] Executing agent: ${agent.name} (${agent.role})`);

    try {
      // Import cascading AI dynamically to avoid circular dependencies
      const { cascadingAI } = await import('../api/cascading-ai');

      // Build context-rich prompt for the agent
      const prompt = this.buildAgentPrompt(agent, task);

      // Execute with AI using agent's configuration
      const startTime = Date.now();
      const response = await cascadingAI(prompt, {
        temperature: agent.temperature || 0.5,
        maxTokens: agent.maxTokens || 4000,
      });

      const executionTime = Date.now() - startTime;

      // Parse AI response
      const result = this.parseAgentResponse(response, agent);

      console.log(`[Orchestrator] Agent ${agent.name} completed in ${executionTime}ms`);

      return {
        success: true,
        data: result,
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          role: agent.role,
          executedAt: Date.now(),
          executionTime,
          model: 'qwen-plus', // Primary model in cascade
        }
      };
    } catch (error: any) {
      console.error(`[Orchestrator] Agent ${agent.name} failed:`, error);

      return {
        success: false,
        error: error.message,
        metadata: {
          agentId: agent.id,
          agentName: agent.name,
          role: agent.role,
          executedAt: Date.now(),
          failureReason: error.message,
        }
      };
    }
  }

  /**
   * Build context-rich prompt for agent execution
   */
  private buildAgentPrompt(agent: AgentConfig, task: AgentTask): string {
    let prompt = `You are ${agent.name}, a specialist AI agent with the role: ${agent.role}.\n\n`;

    // Add agent description
    if (agent.description) {
      prompt += `Your purpose: ${agent.description}\n\n`;
    }

    // Add capabilities context
    if (agent.capabilities && agent.capabilities.length > 0) {
      prompt += `Your capabilities:\n`;
      agent.capabilities.forEach(cap => {
        prompt += `- ${cap.name}: ${cap.description}\n`;
      });
      prompt += `\n`;
    }

    // Add task details
    prompt += `Task: ${task.title || 'Untitled Task'}\n`;
    prompt += `Description: ${task.description}\n\n`;

    // Add input data if provided
    if (task.input) {
      prompt += `Input Data:\n${JSON.stringify(task.input, null, 2)}\n\n`;
    }

    // Add expected output format
    prompt += `Instructions:\n`;
    prompt += `1. Analyze the task thoroughly\n`;
    prompt += `2. Use your capabilities to complete the task\n`;
    prompt += `3. Provide actionable results\n`;
    prompt += `4. Return results in JSON format with these keys:\n`;
    prompt += `   - summary: Brief summary of what you did\n`;
    prompt += `   - findings: Array of key findings or insights\n`;
    prompt += `   - recommendations: Array of specific recommendations\n`;
    prompt += `   - next_steps: Array of suggested next actions\n`;
    prompt += `   - confidence: Your confidence level (0-100)\n\n`;

    prompt += `Provide detailed, actionable output that demonstrates your expertise as ${agent.name}.`;

    return prompt;
  }

  /**
   * Parse agent response from AI
   */
  private parseAgentResponse(response: string, agent: AgentConfig): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        if (!parsed.summary) {
          parsed.summary = `${agent.name} completed the task`;
        }

        return parsed;
      }

      // Fallback: Return raw response in structured format
      return {
        summary: `${agent.name} provided analysis`,
        findings: [response.substring(0, 500)],
        recommendations: [],
        next_steps: [],
        confidence: 75,
        raw_response: response,
      };
    } catch (error) {
      console.error(`[Orchestrator] Failed to parse agent response:`, error);

      // Return raw response
      return {
        summary: `${agent.name} completed with unstructured output`,
        findings: [],
        recommendations: [],
        next_steps: [],
        confidence: 50,
        raw_response: response,
      };
    }
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): SwarmWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all registered workflows
   */
  getAllWorkflows(): SwarmWorkflow[] {
    return Array.from(this.workflows.values());
  }
}

// Export singleton
export const orchestrator = new AgentOrchestrator();

// Pre-register common agents
import { contentAgent } from './content-agent';
import { seoAgent } from './seo-agent';
import { redditAgent } from './reddit-agent';
import { browserAgent } from './browser-agent';

orchestrator.registerAgent(contentAgent);
orchestrator.registerAgent(seoAgent);
orchestrator.registerAgent(redditAgent);
orchestrator.registerAgent(browserAgent);

// Pre-register common workflows
orchestrator.registerWorkflow({
  id: 'content-opportunity-discovery',
  name: 'Content Opportunity Discovery',
  description: 'Find high-value content opportunities using SEO data and community mining',
  strategy: 'sequential',
  nodes: [
    { agentId: 'seo-agent' },
    { agentId: 'reddit-agent' },
    { agentId: 'content-agent' }
  ],
  entryPoint: 'seo-agent'
});

orchestrator.registerWorkflow({
  id: 'automated-research',
  name: 'Automated Research',
  description: 'Research a topic using browser automation and data extraction',
  strategy: 'hierarchical',
  nodes: [
    { agentId: 'browser-agent' }, // Director
    { agentId: 'seo-agent' },     // Worker
    { agentId: 'content-agent' }  // Worker
  ],
  entryPoint: 'browser-agent'
});

export { AgentOrchestrator };
