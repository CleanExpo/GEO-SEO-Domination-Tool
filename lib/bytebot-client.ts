/**
 * Bytebot Client
 *
 * Service for interacting with Bytebot AI Desktop Agent
 * Handles task creation, monitoring, and desktop control
 */

export interface BytebotTaskPriority {
  LOW: 'LOW';
  MEDIUM: 'MEDIUM';
  HIGH: 'HIGH';
  URGENT: 'URGENT';
}

export const BYTEBOT_PRIORITY: BytebotTaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export interface BytebotTask {
  id: string;
  description: string;
  priority: keyof BytebotTaskPriority;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  error?: string;
  logs?: string[];
  screenshots?: string[];
}

export interface BytebotDesktopAction {
  action:
    | 'screenshot'
    | 'click_mouse'
    | 'double_click_mouse'
    | 'move_mouse'
    | 'type_text'
    | 'key_press'
    | 'scroll';
  coordinate?: [number, number];
  text?: string;
  key?: string;
  direction?: 'up' | 'down';
  amount?: number;
}

export class BytebotClient {
  private agentUrl: string;
  private desktopUrl: string;

  constructor() {
    this.agentUrl = process.env.BYTEBOT_AGENT_URL || 'http://localhost:9991';
    this.desktopUrl = process.env.BYTEBOT_DESKTOP_URL || 'http://localhost:9990';
  }

  /**
   * Create a new task for Bytebot to execute
   */
  async createTask(
    description: string,
    options: {
      priority?: keyof BytebotTaskPriority;
      files?: File[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<BytebotTask> {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('priority', options.priority || 'MEDIUM');

    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    if (options.files) {
      options.files.forEach(file => {
        formData.append('files', file);
      });
    }

    const response = await fetch(`${this.agentUrl}/tasks`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to create Bytebot task: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get task status and details
   */
  async getTask(taskId: string): Promise<BytebotTask> {
    const response = await fetch(`${this.agentUrl}/tasks/${taskId}`);

    if (!response.ok) {
      throw new Error(`Failed to get task: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all tasks with optional filtering
   */
  async listTasks(filters?: {
    status?: BytebotTask['status'];
    priority?: keyof BytebotTaskPriority;
    limit?: number;
    offset?: number;
  }): Promise<{ tasks: BytebotTask[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${this.agentUrl}/tasks?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to list tasks: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<void> {
    const response = await fetch(`${this.agentUrl}/tasks/${taskId}/cancel`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel task: ${response.statusText}`);
    }
  }

  /**
   * Get the latest screenshot from a task
   */
  async getTaskScreenshot(taskId: string): Promise<Blob> {
    const response = await fetch(`${this.agentUrl}/tasks/${taskId}/screenshot`);

    if (!response.ok) {
      throw new Error(`Failed to get screenshot: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get task logs
   */
  async getTaskLogs(taskId: string): Promise<string[]> {
    const response = await fetch(`${this.agentUrl}/tasks/${taskId}/logs`);

    if (!response.ok) {
      throw new Error(`Failed to get logs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.logs || [];
  }

  /**
   * Direct desktop control - execute a single action
   */
  async desktopAction(action: BytebotDesktopAction): Promise<any> {
    const response = await fetch(`${this.desktopUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });

    if (!response.ok) {
      throw new Error(`Desktop action failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Take a screenshot of the desktop
   */
  async takeScreenshot(): Promise<Blob> {
    const result = await this.desktopAction({ action: 'screenshot' });

    // The result contains base64 image data
    if (result.screenshot) {
      const base64Data = result.screenshot.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'image/png' });
    }

    throw new Error('No screenshot data received');
  }

  /**
   * Wait for a task to complete
   */
  async waitForTaskCompletion(
    taskId: string,
    options: {
      timeout?: number; // milliseconds
      pollInterval?: number; // milliseconds
    } = {}
  ): Promise<BytebotTask> {
    const timeout = options.timeout || 300000; // 5 minutes default
    const pollInterval = options.pollInterval || 2000; // 2 seconds default
    const startTime = Date.now();

    while (true) {
      const task = await this.getTask(taskId);

      if (task.status === 'COMPLETED' || task.status === 'FAILED' || task.status === 'CANCELLED') {
        return task;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`Task ${taskId} timed out after ${timeout}ms`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

// Singleton instance
let bytebotClientInstance: BytebotClient | null = null;

export function getBytebotClient(): BytebotClient {
  if (!bytebotClientInstance) {
    bytebotClientInstance = new BytebotClient();
  }
  return bytebotClientInstance;
}
