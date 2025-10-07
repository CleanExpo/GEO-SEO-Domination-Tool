/**
 * Agent Pool Orchestrator
 * Manages multiple autonomous agents running in parallel
 * Handles task queuing, priority, and resource allocation
 */

import { EventEmitter } from 'events';
import { BaseAgent, AgentTask, AgentContext } from './base-agent';
import { db } from '@/lib/db';

export interface AgentPoolConfig {
  maxConcurrentAgents?: number;
  taskQueueSize?: number;
  retryFailedTasks?: boolean;
  maxRetries?: number;
}

export interface QueuedTask {
  task: AgentTask;
  agent: BaseAgent;
  retryCount: number;
}

/**
 * Agent Pool - Orchestrates multiple agents
 */
export class AgentPool extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private taskQueue: QueuedTask[] = [];
  private runningTasks: Map<string, QueuedTask> = new Map();
  private completedTasks: Map<string, AgentTask> = new Map();
  private config: AgentPoolConfig;

  constructor(config: AgentPoolConfig = {}) {
    super();
    this.config = {
      maxConcurrentAgents: config.maxConcurrentAgents || 5,
      taskQueueSize: config.taskQueueSize || 100,
      retryFailedTasks: config.retryFailedTasks ?? true,
      maxRetries: config.maxRetries || 3
    };
  }

  /**
   * Register an agent with the pool
   */
  registerAgent(agent: BaseAgent): void {
    const name = agent.getConfig().name;
    this.agents.set(name, agent);
    this.emit('agent-registered', { name });
  }

  /**
   * Unregister agent
   */
  unregisterAgent(agentName: string): void {
    this.agents.delete(agentName);
    this.emit('agent-unregistered', { name: agentName });
  }

  /**
   * Queue a task for execution
   */
  async queueTask(
    agentName: string,
    input: string,
    context: AgentContext,
    priority: AgentTask['priority'] = 'medium'
  ): Promise<string> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    // Create task
    const task: AgentTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentName,
      context,
      input,
      priority,
      status: 'queued',
      createdAt: new Date(),
      checkpoints: []
    };

    // Store in database
    await this.saveTaskToDatabase(task);

    // Add to queue
    const queuedTask: QueuedTask = {
      task,
      agent,
      retryCount: 0
    };

    this.taskQueue.push(queuedTask);

    // Sort by priority
    this.sortQueue();

    this.emit('task-queued', task);

    // Try to process queue
    this.processQueue();

    return task.id;
  }

  /**
   * Get task status
   */
  getTask(taskId: string): AgentTask | null {
    // Check running tasks
    const running = this.runningTasks.get(taskId);
    if (running) return running.task;

    // Check completed tasks
    const completed = this.completedTasks.get(taskId);
    if (completed) return completed;

    // Check queue
    const queued = this.taskQueue.find(qt => qt.task.id === taskId);
    if (queued) return queued.task;

    return null;
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    // Check if running
    const running = this.runningTasks.get(taskId);
    if (running) {
      running.agent.cancel();
      running.task.status = 'cancelled';
      this.runningTasks.delete(taskId);
      this.emit('task-cancelled', running.task);
      return true;
    }

    // Check if queued
    const queuedIndex = this.taskQueue.findIndex(qt => qt.task.id === taskId);
    if (queuedIndex !== -1) {
      const queued = this.taskQueue.splice(queuedIndex, 1)[0];
      queued.task.status = 'cancelled';
      this.emit('task-cancelled', queued.task);
      return true;
    }

    return false;
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      registeredAgents: this.agents.size,
      queuedTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.size,
      availableSlots: Math.max(
        0,
        this.config.maxConcurrentAgents! - this.runningTasks.size
      )
    };
  }

  /**
   * Get all tasks for a workspace
   */
  getWorkspaceTasks(workspaceId: string): AgentTask[] {
    const tasks: AgentTask[] = [];

    // Running tasks
    for (const qt of this.runningTasks.values()) {
      if (qt.task.context.workspaceId === workspaceId) {
        tasks.push(qt.task);
      }
    }

    // Queued tasks
    for (const qt of this.taskQueue) {
      if (qt.task.context.workspaceId === workspaceId) {
        tasks.push(qt.task);
      }
    }

    // Completed tasks
    for (const task of this.completedTasks.values()) {
      if (task.context.workspaceId === workspaceId) {
        tasks.push(task);
      }
    }

    return tasks;
  }

  /**
   * Process task queue
   */
  private async processQueue(): Promise<void> {
    // Check if we have capacity
    if (this.runningTasks.size >= this.config.maxConcurrentAgents!) {
      return;
    }

    // Get next task
    const queuedTask = this.taskQueue.shift();
    if (!queuedTask) {
      return;
    }

    // Start execution
    this.runningTasks.set(queuedTask.task.id, queuedTask);

    try {
      // Execute agent task (non-blocking)
      queuedTask.agent.execute(queuedTask.task).then(async (completedTask) => {
        // Remove from running
        this.runningTasks.delete(completedTask.id);

        // Handle result
        if (completedTask.status === 'completed') {
          this.completedTasks.set(completedTask.id, completedTask);
          await this.updateTaskInDatabase(completedTask);
          this.emit('task-completed', completedTask);

        } else if (completedTask.status === 'failed') {
          // Retry logic
          if (
            this.config.retryFailedTasks &&
            queuedTask.retryCount < this.config.maxRetries!
          ) {
            queuedTask.retryCount++;
            queuedTask.task.status = 'queued';
            this.taskQueue.push(queuedTask);
            this.emit('task-retrying', {
              task: completedTask,
              retryCount: queuedTask.retryCount
            });
          } else {
            this.completedTasks.set(completedTask.id, completedTask);
            await this.updateTaskInDatabase(completedTask);
            this.emit('task-failed', completedTask);
          }
        }

        // Process next task
        this.processQueue();
      }).catch((error) => {
        console.error('Agent execution error:', error);
        this.runningTasks.delete(queuedTask.task.id);
        this.processQueue();
      });

      // Process more tasks if capacity available
      if (this.runningTasks.size < this.config.maxConcurrentAgents!) {
        this.processQueue();
      }

    } catch (error) {
      console.error('Queue processing error:', error);
      this.runningTasks.delete(queuedTask.task.id);
    }
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    this.taskQueue.sort((a, b) => {
      return priorityOrder[a.task.priority] - priorityOrder[b.task.priority];
    });
  }

  /**
   * Save task to database
   */
  private async saveTaskToDatabase(task: AgentTask): Promise<void> {
    try {
      await db.run(`
        INSERT INTO agent_tasks (
          id, agent_name, workspace_id, client_id, input, priority, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        task.id,
        task.agentName,
        task.context.workspaceId,
        task.context.clientId,
        task.input,
        task.priority,
        task.status,
        task.createdAt.toISOString()
      ]);
    } catch (error) {
      console.error('Failed to save task to database:', error);
    }
  }

  /**
   * Update task in database
   */
  private async updateTaskInDatabase(task: AgentTask): Promise<void> {
    try {
      await db.run(`
        UPDATE agent_tasks
        SET status = ?, completed_at = ?, result = ?, error = ?
        WHERE id = ?
      `, [
        task.status,
        task.completedAt?.toISOString(),
        task.result ? JSON.stringify(task.result) : null,
        task.error,
        task.id
      ]);
    } catch (error) {
      console.error('Failed to update task in database:', error);
    }
  }
}

// Singleton instance
export const agentPool = new AgentPool({
  maxConcurrentAgents: 5,
  taskQueueSize: 100,
  retryFailedTasks: true,
  maxRetries: 3
});
