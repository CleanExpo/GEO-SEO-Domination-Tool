/**
 * Agent Swarm Types
 * Defines the structure and interfaces for autonomous agent systems
 */

export interface AgentCapability {
  name: string;
  description: string;
  requiredTools: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: AgentCapability[];
  model?: string; // AI model to use (claude-3-5-sonnet, gpt-4, etc.)
  temperature?: number;
  maxTokens?: number;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface AgentContext {
  taskId: string;
  history: AgentMessage[];
  variables: Record<string, any>;
  sessionData: Record<string, any>;
}

export interface AgentHandoff {
  toAgent: string;
  reason: string;
  context: Partial<AgentContext>;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  handoff?: AgentHandoff;
  requiresHuman?: boolean;
  metadata?: Record<string, any>;
}

export interface AgentTask {
  id: string;
  description: string;
  assignedAgent: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  context: AgentContext;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: AgentResult;
}

// Swarm orchestration types

export type SwarmStrategy =
  | 'sequential'    // Execute agents one after another
  | 'concurrent'    // Execute multiple agents in parallel
  | 'hierarchical'  // Director delegates to workers
  | 'graph';        // Complex dependency-based workflow

export interface SwarmNode {
  agentId: string;
  dependencies?: string[]; // IDs of agents that must complete first
  parallel?: boolean;       // Can run in parallel with others
}

export interface SwarmWorkflow {
  id: string;
  name: string;
  description: string;
  strategy: SwarmStrategy;
  nodes: SwarmNode[];
  entryPoint: string; // ID of starting agent
}

export interface SwarmExecutionPlan {
  workflow: SwarmWorkflow;
  task: AgentTask;
  executionOrder: string[][]; // Batches of agent IDs to execute
}

export interface SwarmExecutionResult {
  workflowId: string;
  taskId: string;
  success: boolean;
  agentResults: Map<string, AgentResult>;
  executionTime: number;
  error?: string;
}

// Browser automation integration

export interface BrowserAgentAction {
  type: 'navigate' | 'click' | 'fill' | 'scroll' | 'extract' | 'screenshot';
  params: Record<string, any>;
  description: string;
}

export interface BrowserAgentPlan {
  sessionId?: string;
  actions: BrowserAgentAction[];
  expectedOutcome: string;
}

// Task inbox types

export type TaskInputType = 'text' | 'voice' | 'file' | 'url';

export interface TaskInput {
  type: TaskInputType;
  content: string;
  attachments?: File[];
  metadata?: Record<string, any>;
}

export interface TaskIntent {
  action: string; // e.g., "find_keywords", "generate_content", "monitor_rankings"
  entities: Record<string, any>; // Extracted entities (keywords, URLs, etc.)
  confidence: number; // 0-1
  suggestedWorkflow?: string;
  suggestedAgents?: string[];
}
