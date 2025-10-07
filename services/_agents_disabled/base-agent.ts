/**
 * Base Agent Class
 * Reusable foundation for all autonomous SDK agents
 * Inspired by Anthropic's autonomous agent architecture
 */

import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';

export interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt: string;
  tools: AgentTool[];
}

export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (input: any, context: AgentContext) => Promise<any>;
}

export interface AgentContext {
  workspaceId: string;
  clientId: string;
  metadata: Record<string, any>;
  checkpointId?: string;
}

export interface AgentTask {
  id: string;
  agentName: string;
  context: AgentContext;
  input: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  checkpoints: AgentCheckpoint[];
}

export interface AgentCheckpoint {
  id: string;
  timestamp: Date;
  state: 'thinking' | 'tool_use' | 'result' | 'error';
  content: string;
  toolCalls?: Array<{
    tool: string;
    input: any;
    output: any;
  }>;
}

/**
 * Base Agent - All agents extend this class
 */
export abstract class BaseAgent extends EventEmitter {
  protected anthropic: Anthropic;
  protected config: AgentConfig;
  protected isRunning: boolean = false;
  protected abortController?: AbortController;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Execute agent task autonomously
   */
  async execute(task: AgentTask): Promise<AgentTask> {
    if (this.isRunning) {
      throw new Error(`Agent ${this.config.name} is already running`);
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    task.startedAt = new Date();
    task.status = 'running';

    this.emit('task-started', task);

    try {
      // Create checkpoint: Task started
      this.createCheckpoint(task, 'thinking', `Starting task: ${task.input}`);

      // Build conversation history from checkpoints
      const messages = this.buildMessages(task);

      // Execute with Claude SDK
      let response = await this.anthropic.messages.create({
        model: this.config.model || 'claude-sonnet-4.5-20250929',
        max_tokens: this.config.maxTokens || 8192,
        temperature: this.config.temperature || 0.7,
        system: this.config.systemPrompt,
        tools: this.config.tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema
        })),
        messages: messages
      }, {
        signal: this.abortController.signal
      });

      // Process response with tool calling loop
      let iterationCount = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (
        response.stop_reason === 'tool_use' &&
        iterationCount < maxIterations
      ) {
        iterationCount++;

        // Extract tool calls
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.Messages.ToolUseBlock =>
            block.type === 'tool_use'
        );

        // Create checkpoint: Tool use
        this.createCheckpoint(
          task,
          'tool_use',
          `Using ${toolUseBlocks.length} tool(s)`,
          toolUseBlocks.map(t => ({
            tool: t.name,
            input: t.input,
            output: null // Will be filled below
          }))
        );

        // Execute tools
        const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          const tool = this.config.tools.find(t => t.name === toolUse.name);

          if (!tool) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Error: Tool ${toolUse.name} not found`,
              is_error: true
            });
            continue;
          }

          try {
            // Execute tool handler
            const result = await tool.handler(toolUse.input, task.context);

            // Update checkpoint with tool output
            const lastCheckpoint = task.checkpoints[task.checkpoints.length - 1];
            if (lastCheckpoint.toolCalls) {
              const toolCall = lastCheckpoint.toolCalls.find(t => t.tool === toolUse.name);
              if (toolCall) {
                toolCall.output = result;
              }
            }

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: typeof result === 'string' ? result : JSON.stringify(result)
            });

            this.emit('tool-executed', {
              task,
              tool: toolUse.name,
              input: toolUse.input,
              output: result
            });

          } catch (error) {
            const errorMsg = (error as Error).message;

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Error: ${errorMsg}`,
              is_error: true
            });

            this.emit('tool-error', {
              task,
              tool: toolUse.name,
              error: errorMsg
            });
          }
        }

        // Continue conversation with tool results
        const updatedMessages = [
          ...messages,
          {
            role: 'assistant' as const,
            content: response.content
          },
          {
            role: 'user' as const,
            content: toolResults
          }
        ];

        response = await this.anthropic.messages.create({
          model: this.config.model || 'claude-sonnet-4.5-20250929',
          max_tokens: this.config.maxTokens || 8192,
          temperature: this.config.temperature || 0.7,
          system: this.config.systemPrompt,
          tools: this.config.tools.map(t => ({
            name: t.name,
            description: t.description,
            input_schema: t.input_schema
          })),
          messages: updatedMessages
        }, {
          signal: this.abortController.signal
        });
      }

      // Extract final result
      const finalText = response.content
        .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      // Create final checkpoint
      this.createCheckpoint(task, 'result', finalText);

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = {
        text: finalText,
        usage: response.usage,
        iterations: iterationCount
      };

      this.emit('task-completed', task);

      return task;

    } catch (error) {
      const errorMsg = (error as Error).message;

      this.createCheckpoint(task, 'error', errorMsg);

      task.status = 'failed';
      task.completedAt = new Date();
      task.error = errorMsg;

      this.emit('task-failed', { task, error: errorMsg });

      return task;

    } finally {
      this.isRunning = false;
      this.abortController = undefined;
    }
  }

  /**
   * Cancel running task
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.isRunning = false;
      this.emit('task-cancelled');
    }
  }

  /**
   * Create checkpoint for task
   */
  private createCheckpoint(
    task: AgentTask,
    state: AgentCheckpoint['state'],
    content: string,
    toolCalls?: AgentCheckpoint['toolCalls']
  ): void {
    const checkpoint: AgentCheckpoint = {
      id: `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      state,
      content,
      toolCalls
    };

    task.checkpoints.push(checkpoint);
    this.emit('checkpoint-created', { task, checkpoint });
  }

  /**
   * Build messages array from task checkpoints
   */
  private buildMessages(task: AgentTask): Anthropic.Messages.MessageParam[] {
    // Initial user message
    return [{
      role: 'user' as const,
      content: task.input
    }];
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Get agent status
   */
  getStatus(): { name: string; running: boolean } {
    return {
      name: this.config.name,
      running: this.isRunning
    };
  }
}
